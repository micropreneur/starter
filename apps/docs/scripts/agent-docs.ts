import { createHash } from 'node:crypto'
import {
  access,
  lstat,
  mkdir,
  readdir,
  readFile,
  readlink,
  unlink,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import { elementCatalog } from '@micropreneur/elements/catalog'
import ts from 'typescript'

type DocSection = {
  id: string
  title: string
}

type DocMeta = {
  description: string
  group: string
  keywords: readonly string[]
  order: number
  sections: readonly DocSection[]
  title: string
}

export type AgentDocRecord = {
  description: string
  group: string
  id: string
  keywords: readonly string[]
  markdown: string
  path: string
  rawPath: string
  sourcePath: string
  title: string
  type: 'article' | 'component'
}

export type AgentSkillRecord = {
  description: string
  markdown: string
  name: string
  rawPath: string
  sourcePath: string
}

type GeneratedOutput = {
  content: string
  path: string
}

const docGroupOrder = [
  'Getting started',
  'Integrations',
  'Cloudflare',
  'Elements',
  'Agents',
] as const

const docGroupRank = new Map<string, number>(docGroupOrder.map((group, index) => [group, index]))

export async function createAgentDocsOutputs(repoRoot: string): Promise<GeneratedOutput[]> {
  const articles = [...(await readArticles(repoRoot)), createElementsGalleryArticle()]
  const components = await readComponents(repoRoot)
  const skills = await readSkills(repoRoot)
  const docs = [...articles, ...components]
  const publicRoot = path.join(repoRoot, 'apps/docs/public')
  const outputs: GeneratedOutput[] = []

  for (const article of articles) {
    outputs.push({
      content: article.markdown,
      path: path.join(publicRoot, article.rawPath.slice(1)),
    })
  }

  for (const skill of skills) {
    const markdown = ensureFinalNewline(skill.markdown)
    outputs.push({
      content: markdown,
      path: path.join(publicRoot, skill.rawPath.slice(1)),
    })
    outputs.push(
      {
        content: markdown,
        path: path.join(publicRoot, '.well-known/agent-skills', skill.name, 'SKILL.md'),
      },
      {
        content: markdown,
        path: path.join(publicRoot, '.well-known/skills', skill.name, 'SKILL.md'),
      },
    )
  }

  outputs.push(
    {
      content: renderLlmsIndex(docs, skills),
      path: path.join(publicRoot, 'llms.txt'),
    },
    {
      content: renderLlmsFull(docs, skills),
      path: path.join(publicRoot, 'llms-full.txt'),
    },
    {
      content: `${JSON.stringify(
        {
          docs: docs.map(withoutMarkdown),
          skills: skills.map(withoutMarkdown),
        },
        null,
        2,
      )}\n`,
      path: path.join(publicRoot, 'agent-content.json'),
    },
    {
      content: `${JSON.stringify(skills.map(withoutMarkdown), null, 2)}\n`,
      path: path.join(publicRoot, 'skills/index.json'),
    },
    {
      content: renderAgentSkillsIndex(skills),
      path: path.join(publicRoot, '.well-known/agent-skills/index.json'),
    },
    {
      content: renderLegacySkillsIndex(skills),
      path: path.join(publicRoot, '.well-known/skills/index.json'),
    },
    {
      content: `${JSON.stringify({ docs, skills }, null, 2)}\n`,
      path: path.join(repoRoot, 'packages/mcp/src/generated/agent-content.json'),
    },
    {
      content: renderRootLlms(docs, skills),
      path: path.join(repoRoot, 'llms.txt'),
    },
  )

  return outputs.sort((first, second) => first.path.localeCompare(second.path))
}

function createElementsGalleryArticle(): AgentDocRecord {
  const componentLinks = elementCatalog
    .map(
      (element) => `- [${element.title}](/components/${element.name}.md) — ${element.description}`,
    )
    .join('\n')

  return {
    description: 'Browse every public Elements component with live previews and install commands.',
    group: 'Elements',
    id: 'elements/gallery',
    keywords: ['elements', 'components', 'gallery', 'registry', 'shadcn'],
    markdown: ensureFinalNewline(`# Component gallery

> Browse every public Elements component with live previews and install commands.

Open the [interactive gallery](/elements/gallery) to preview components, filter by ontology, and copy install commands.

## Components

${componentLinks}`),
    path: '/elements/gallery',
    rawPath: '/elements/gallery.md',
    sourcePath: 'packages/elements/src/catalog.ts',
    title: 'Component gallery',
    type: 'article',
  }
}

export async function generateAgentDocs(repoRoot: string, check: boolean) {
  const outputs = await createAgentDocsOutputs(repoRoot)
  const stalePaths: string[] = []

  for (const output of outputs) {
    const current = await readOptionalFile(output.path)
    if (current === output.content) continue

    if (check) {
      stalePaths.push(path.relative(repoRoot, output.path))
      continue
    }

    await mkdir(path.dirname(output.path), { recursive: true })
    await writeFile(output.path, output.content, 'utf8')
  }

  const expectedPaths = new Set(outputs.map((output) => output.path))
  const orphanPaths = await findOrphanRawFiles(repoRoot, expectedPaths)
  if (check) {
    stalePaths.push(...orphanPaths.map((filePath) => path.relative(repoRoot, filePath)))
  } else {
    await Promise.all(orphanPaths.map((filePath) => unlink(filePath)))
  }

  if (stalePaths.length > 0) {
    throw new Error(
      `Generated agent documentation is stale:\n${stalePaths
        .sort()
        .map((filePath) => `- ${filePath}`)
        .join('\n')}\nRun: pnpm --filter docs agent:generate`,
    )
  }

  return outputs.map((output) => path.relative(repoRoot, output.path))
}

async function readArticles(repoRoot: string): Promise<AgentDocRecord[]> {
  const contentRoot = path.join(repoRoot, 'apps/docs/src/content')
  const sourceFiles = await collectFiles(contentRoot, '.mdx')

  const articles = await Promise.all(
    sourceFiles.map(async (sourceFile) => {
      const source = await readFile(sourceFile, 'utf8')
      const relativeSource = toPosixPath(path.relative(repoRoot, sourceFile))
      const id = toPosixPath(path.relative(contentRoot, sourceFile)).replace(/\.mdx$/, '')
      const { body, meta } = parseMdxArticle(source, relativeSource)
      const markdown = ensureFinalNewline(`# ${meta.title}\n\n> ${meta.description}\n\n${body}`)

      return {
        description: meta.description,
        group: meta.group,
        id,
        keywords: meta.keywords,
        markdown,
        order: meta.order,
        path: `/${id}`,
        rawPath: `/${id}.md`,
        sourcePath: relativeSource,
        title: meta.title,
        type: 'article' as const,
      }
    }),
  )

  return articles
    .sort(
      (first, second) =>
        (docGroupRank.get(first.group) ?? Number.MAX_SAFE_INTEGER) -
          (docGroupRank.get(second.group) ?? Number.MAX_SAFE_INTEGER) ||
        first.order - second.order ||
        first.title.localeCompare(second.title),
    )
    .map(({ order: _order, ...article }) => article)
}

async function readComponents(repoRoot: string): Promise<AgentDocRecord[]> {
  return Promise.all(
    elementCatalog.map(async (element) => {
      const sourcePath = `apps/docs/public${element.docsPath}`
      const markdown = ensureFinalNewline(
        await readRequiredFile(path.join(repoRoot, sourcePath), sourcePath),
      )

      return {
        description: element.description,
        group: `Elements / ${element.ontology}`,
        id: `components/${element.name}`,
        keywords: [element.name, element.ontology, element.kind, element.registryType],
        markdown,
        path: `/elements/components/${element.name}`,
        rawPath: element.docsPath,
        sourcePath,
        title: element.title,
        type: 'component' as const,
      }
    }),
  )
}

async function readSkills(repoRoot: string): Promise<AgentSkillRecord[]> {
  const skillsRoot = path.join(repoRoot, '.agents/shared-skills')
  const entries = await readdir(skillsRoot, { withFileTypes: true })

  return Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .sort((first, second) => first.name.localeCompare(second.name))
      .map(async (entry) => {
        const sourcePath = `.agents/shared-skills/${entry.name}/SKILL.md`
        await assertSkillSymlink(repoRoot, entry.name)
        const markdown = await readRequiredFile(path.join(repoRoot, sourcePath), sourcePath)
        const metadata = parseSkillMetadata(markdown, sourcePath)

        return {
          ...metadata,
          markdown,
          rawPath: `/skills/${entry.name}.md`,
          sourcePath,
        }
      }),
  )
}

function parseMdxArticle(source: string, sourcePath: string): { body: string; meta: DocMeta } {
  const sourceFile = ts.createSourceFile(
    sourcePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  let metaValue: unknown
  let metaStatement: ts.VariableStatement | undefined

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    const declaration = statement.declarationList.declarations.find(
      (candidate) => ts.isIdentifier(candidate.name) && candidate.name.text === 'meta',
    )
    if (!declaration?.initializer) continue
    metaValue = readLiteral(declaration.initializer, sourcePath)
    metaStatement = statement
    break
  }

  if (!metaStatement) throw new Error(`${sourcePath} must export a literal meta object.`)
  const meta = assertDocMeta(metaValue, sourcePath)
  const body =
    `${source.slice(0, metaStatement.getFullStart())}${source.slice(metaStatement.end)}`.trim()
  return { body, meta }
}

function readLiteral(node: ts.Expression, sourcePath: string): unknown {
  if (ts.isStringLiteralLike(node)) return node.text
  if (ts.isNumericLiteral(node)) return Number(node.text)
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => readLiteral(element, sourcePath))
  }
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(
      node.properties.map((property) => {
        if (!ts.isPropertyAssignment(property)) {
          throw new Error(`${sourcePath} meta may only contain literal property assignments.`)
        }
        const key = propertyName(property.name, sourcePath)
        return [key, readLiteral(property.initializer, sourcePath)]
      }),
    )
  }
  throw new Error(`${sourcePath} meta contains a non-literal value.`)
}

function propertyName(name: ts.PropertyName, sourcePath: string) {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) {
    return name.text
  }
  throw new Error(`${sourcePath} meta contains an unsupported property name.`)
}

function assertDocMeta(value: unknown, sourcePath: string): DocMeta {
  if (!isRecord(value)) throw new Error(`${sourcePath} meta must be an object.`)

  const title = requiredString(value.title, 'title', sourcePath)
  const description = requiredString(value.description, 'description', sourcePath)
  const group = requiredString(value.group, 'group', sourcePath)
  if (!docGroupRank.has(group)) {
    throw new Error(`${sourcePath} meta.group must be one of: ${docGroupOrder.join(', ')}.`)
  }
  if (typeof value.order !== 'number') throw new Error(`${sourcePath} meta.order must be a number.`)
  const keywords = stringArray(value.keywords, 'keywords', sourcePath)
  if (!Array.isArray(value.sections))
    throw new Error(`${sourcePath} meta.sections must be an array.`)
  const sections = value.sections.map((section, index) => {
    if (!isRecord(section)) throw new Error(`${sourcePath} section ${index + 1} must be an object.`)
    return {
      id: requiredString(section.id, `sections[${index}].id`, sourcePath),
      title: requiredString(section.title, `sections[${index}].title`, sourcePath),
    }
  })

  return { description, group, keywords, order: value.order, sections, title }
}

function parseSkillMetadata(markdown: string, sourcePath: string) {
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatter?.[1]) throw new Error(`${sourcePath} must begin with YAML frontmatter.`)
  const fields = Object.fromEntries(
    frontmatter[1].split('\n').flatMap((line) => {
      const separator = line.indexOf(':')
      return separator > 0
        ? [[line.slice(0, separator).trim(), line.slice(separator + 1).trim()]]
        : []
    }),
  )
  return {
    description: requiredString(fields.description, 'description', sourcePath),
    name: requiredString(fields.name, 'name', sourcePath),
  }
}

function renderLlmsIndex(docs: readonly AgentDocRecord[], skills: readonly AgentSkillRecord[]) {
  const articles = docs.filter((doc) => doc.type === 'article')
  const components = docs.filter((doc) => doc.type === 'component')
  const groups = [...new Set(articles.map((doc) => doc.group))]

  const lines = [
    '# Micropreneur Starter documentation',
    '',
    '> Public, machine-readable guidance for building and extending a Micropreneur Starter fork.',
    '',
    '## Complete corpus',
    '',
    '- [llms-full.txt](/llms-full.txt): all public guides, component docs, and agent skills in one file',
    '- [agent-content.json](/agent-content.json): structured document and skill metadata',
  ]

  for (const group of groups) {
    lines.push('', `## ${group}`, '')
    for (const doc of articles.filter((article) => article.group === group)) {
      lines.push(`- [${doc.title}](${doc.rawPath}): ${doc.description}`)
    }
  }

  lines.push('', '## Components', '')
  for (const doc of components) lines.push(`- [${doc.title}](${doc.rawPath}): ${doc.description}`)

  lines.push('', '## Agent skills', '')
  for (const skill of skills) {
    lines.push(`- [${skill.name}](${skill.rawPath}): ${skill.description}`)
  }
  lines.push(
    '',
    '## MCP',
    '',
    'Connect to `https://docs.micropreneur.dev/mcp`, or run `pnpm --filter @micropreneur/mcp dev` for local stdio access.',
  )

  return `${lines.join('\n')}\n`
}

function renderAgentSkillsIndex(skills: readonly AgentSkillRecord[]) {
  return `${JSON.stringify(
    {
      $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
      skills: skills.map((skill) => {
        const markdown = ensureFinalNewline(skill.markdown)
        return {
          name: skill.name,
          type: 'skill-md',
          description: skill.description,
          url: `/.well-known/agent-skills/${skill.name}/SKILL.md`,
          digest: `sha256:${createHash('sha256').update(markdown, 'utf8').digest('hex')}`,
        }
      }),
    },
    null,
    2,
  )}\n`
}

function renderLegacySkillsIndex(skills: readonly AgentSkillRecord[]) {
  const entries = skills
    .map(
      (skill) => `    {
      "name": ${JSON.stringify(skill.name)},
      "description": ${JSON.stringify(skill.description)},
      "files": ["SKILL.md"]
    }`,
    )
    .join(',\n')
  return `{\n  "skills": [\n${entries}\n  ]\n}\n`
}

function renderLlmsFull(docs: readonly AgentDocRecord[], skills: readonly AgentSkillRecord[]) {
  const lines = [
    '# Micropreneur Starter complete documentation',
    '',
    '> Generated from public MDX articles, component Markdown, and canonical shared skills.',
  ]

  for (const doc of docs) {
    lines.push(
      '',
      '---',
      '',
      `Source: \`${doc.sourcePath}\``,
      `Canonical page: \`${doc.path}\``,
      '',
      doc.markdown.trim(),
    )
  }

  for (const skill of skills) {
    lines.push('', '---', '', `Source: \`${skill.sourcePath}\``, '', skill.markdown.trim())
  }

  return `${lines.join('\n')}\n`
}

function renderRootLlms(docs: readonly AgentDocRecord[], skills: readonly AgentSkillRecord[]) {
  return `# micropreneur/starter

> Public fork-and-go SaaS base for TanStack Start on Cloudflare Workers.

## Machine-readable documentation

- [Documentation index](apps/docs/public/llms.txt)
- [Complete documentation corpus](apps/docs/public/llms-full.txt)
- [Structured content manifest](apps/docs/public/agent-content.json)
- ${docs.filter((doc) => doc.type === 'article').length} public guides and ${
    docs.filter((doc) => doc.type === 'component').length
  } component references are generated from canonical source.

## Agent interfaces

- [Repository instructions](AGENTS.md)
- [Shared skill pattern](.agents/README.md)
- [MCP server](packages/mcp/README.md)
- ${skills.length} discoverable shared ${skills.length === 1 ? 'skill' : 'skills'} under \`.agents/skills/\`.

## Product boundaries

- [README](README.md)
- [Free and Pro roadmap](ROADMAP.md)
- [Release verification](RELEASE.md)

Run \`pnpm --filter docs agent:generate\` after changing MDX, component Markdown, or shared skills.
`
}

async function findOrphanRawFiles(repoRoot: string, expectedPaths: ReadonlySet<string>) {
  const contentRoot = path.join(repoRoot, 'apps/docs/src/content')
  const publicRoot = path.join(repoRoot, 'apps/docs/public')
  const groups = (await readdir(contentRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
  const articleFiles = (
    await Promise.all(
      groups.map((group) => collectFiles(path.join(publicRoot, group), '.md', true)),
    )
  ).flat()
  const skillFiles = await collectFiles(path.join(publicRoot, 'skills'), '.md', true)
  const wellKnownSkillFiles = (
    await Promise.all([
      collectFiles(path.join(publicRoot, '.well-known/agent-skills'), '.md', true),
      collectFiles(path.join(publicRoot, '.well-known/skills'), '.md', true),
    ])
  ).flat()
  return [...articleFiles, ...skillFiles, ...wellKnownSkillFiles].filter(
    (filePath) => !expectedPaths.has(filePath),
  )
}

async function assertSkillSymlink(repoRoot: string, skillName: string) {
  const linkPath = path.join(repoRoot, '.agents/skills', skillName)
  const displayPath = `.agents/skills/${skillName}`
  let stats: Awaited<ReturnType<typeof lstat>>
  try {
    stats = await lstat(linkPath)
  } catch {
    throw new Error(`Canonical skill is missing its discovery symlink: ${displayPath}`)
  }
  if (!stats.isSymbolicLink()) throw new Error(`${displayPath} must be a relative symlink.`)

  const expectedTarget = `../shared-skills/${skillName}`
  const actualTarget = await readlink(linkPath)
  if (actualTarget !== expectedTarget) {
    throw new Error(`${displayPath} must point to ${expectedTarget}; found ${actualTarget}.`)
  }
}

async function collectFiles(
  directory: string,
  extension: string,
  optional = false,
): Promise<string[]> {
  if (optional && !(await exists(directory))) return []
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return collectFiles(entryPath, extension)
      return entry.isFile() && entry.name.endsWith(extension) ? [entryPath] : []
    }),
  )
  return files.flat().sort()
}

async function readRequiredFile(filePath: string, displayPath: string) {
  try {
    return await readFile(filePath, 'utf8')
  } catch {
    throw new Error(`Required agent documentation source is missing: ${displayPath}`)
  }
}

async function readOptionalFile(filePath: string) {
  try {
    return await readFile(filePath, 'utf8')
  } catch {
    return undefined
  }
}

async function exists(filePath: string) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function requiredString(value: unknown, field: string, sourcePath: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${sourcePath} ${field} must be a non-empty string.`)
  }
  return value
}

function stringArray(value: unknown, field: string, sourcePath: string) {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`${sourcePath} ${field} must be a string array.`)
  }
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value)
}

function withoutMarkdown<T extends { markdown: string }>(value: T): Omit<T, 'markdown'> {
  const { markdown: _markdown, ...metadata } = value
  return metadata
}

function ensureFinalNewline(value: string) {
  return `${value.trim()}\n`
}

function toPosixPath(value: string) {
  return value.split(path.sep).join('/')
}
