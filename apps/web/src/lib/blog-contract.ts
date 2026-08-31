import ts from 'typescript'

import { type BlogPostMeta, type BlogPostSummary, blogCategories } from './blog-schema.ts'
import { contentHeadingId } from './content-heading.ts'

export type BlogSource = {
  source: string
  sourcePath: string
}

const allowedMetaFields = new Set([
  'author',
  'category',
  'date',
  'description',
  'featured',
  'readTime',
  'sections',
  'title',
])
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function validateBlogSources(
  sources: readonly BlogSource[],
): ReadonlyArray<BlogPostSummary> {
  const posts = sources.map(({ source, sourcePath }) => ({
    meta: parseBlogMeta(source, sourcePath),
    slug: assertBlogSlug(sourcePath),
  }))
  const featuredPosts = posts.filter((post) => post.meta.featured)

  if (featuredPosts.length > 1) {
    throw new Error(
      `Blog content may only have one featured post. Found: ${featuredPosts
        .map((post) => post.slug)
        .join(', ')}.`,
    )
  }

  return posts.map(({ meta, slug }) => ({ ...meta, slug }))
}

export function parseBlogMeta(source: string, sourcePath: string): BlogPostMeta {
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
    const exported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    )
    if (!exported) throw new Error(`${sourcePath} must export its meta object.`)

    metaValue = readLiteral(declaration.initializer, sourcePath)
    metaStatement = statement
    break
  }

  if (!metaStatement) throw new Error(`${sourcePath} must export a literal meta object.`)

  const meta = assertBlogMeta(metaValue, sourcePath)
  const body = `${source.slice(0, metaStatement.getFullStart())}${source.slice(metaStatement.end)}`
  assertSectionsMatchHeadings(meta.sections, body, sourcePath)
  return meta
}

function assertBlogSlug(sourcePath: string): string {
  const filename = sourcePath.split('/').at(-1) ?? ''
  const slug = filename.replace(/\.mdx$/, '')

  if (!filename.endsWith('.mdx') || !slugPattern.test(slug)) {
    throw new Error(
      `${sourcePath} must use a lowercase kebab-case .mdx filename; the filename becomes the public blog slug.`,
    )
  }

  return slug
}

function assertBlogMeta(value: unknown, sourcePath: string): BlogPostMeta {
  if (!isRecord(value)) throw new Error(`${sourcePath} meta must be an object.`)

  const unknownFields = Object.keys(value).filter((field) => !allowedMetaFields.has(field))
  if (unknownFields.length > 0) {
    throw new Error(`${sourcePath} meta has unsupported fields: ${unknownFields.join(', ')}.`)
  }

  const author = requiredString(value.author, 'author', sourcePath)
  const category = requiredString(value.category, 'category', sourcePath)
  if (!isBlogCategory(category)) {
    throw new Error(`${sourcePath} meta.category must be one of: ${blogCategories.join(', ')}.`)
  }
  const date = requiredString(value.date, 'date', sourcePath)
  if (!isIsoDate(date)) {
    throw new Error(`${sourcePath} meta.date must be a valid YYYY-MM-DD date.`)
  }
  const description = requiredString(value.description, 'description', sourcePath)
  if (value.featured !== undefined && typeof value.featured !== 'boolean') {
    throw new Error(`${sourcePath} meta.featured must be a boolean when provided.`)
  }
  const readTime = requiredString(value.readTime, 'readTime', sourcePath)
  if (!Array.isArray(value.sections)) {
    throw new Error(`${sourcePath} meta.sections must be an array.`)
  }
  const sections = value.sections.map((section, index) => {
    if (!isRecord(section)) {
      throw new Error(`${sourcePath} meta.sections[${index}] must be an object.`)
    }

    return {
      id: requiredString(section.id, `sections[${index}].id`, sourcePath),
      title: requiredString(section.title, `sections[${index}].title`, sourcePath),
    }
  })
  const title = requiredString(value.title, 'title', sourcePath)

  return {
    author,
    category,
    date,
    description,
    ...(value.featured === undefined ? {} : { featured: value.featured }),
    readTime,
    sections,
    title,
  }
}

function assertSectionsMatchHeadings(
  sections: BlogPostMeta['sections'],
  body: string,
  sourcePath: string,
): void {
  const headings = secondLevelHeadings(body, sourcePath)
  const headingIds = headings.map(contentHeadingId)
  const sectionIds = sections.map((section) => section.id)

  const duplicateHeadingId = headingIds.find((id, index) => headingIds.indexOf(id) !== index)
  if (duplicateHeadingId) {
    throw new Error(
      `${sourcePath} has more than one level-two heading with id "${duplicateHeadingId}".`,
    )
  }

  const duplicateSectionId = sectionIds.find((id, index) => sectionIds.indexOf(id) !== index)
  if (duplicateSectionId) {
    throw new Error(`${sourcePath} meta.sections contains duplicate id "${duplicateSectionId}".`)
  }

  if (
    headingIds.length !== sectionIds.length ||
    headingIds.some((id, index) => id !== sectionIds[index])
  ) {
    throw new Error(
      `${sourcePath} meta.sections ids must match its level-two headings in order. Expected: ${formatIds(headingIds)}. Received: ${formatIds(sectionIds)}.`,
    )
  }
}

function secondLevelHeadings(source: string, sourcePath: string): string[] {
  const headings: string[] = []
  let fence: { character: string; length: number } | undefined

  for (const line of source.split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/)
    if (fenceMatch?.[1]) {
      const character = fenceMatch[1][0]
      if (!fence) {
        fence = { character: character ?? '', length: fenceMatch[1].length }
      } else if (character === fence.character && fenceMatch[1].length >= fence.length) {
        fence = undefined
      }
      continue
    }
    if (fence) continue

    const heading = line.match(/^##(?!#)\s+(.+?)\s*#*\s*$/)?.[1]?.trim()
    if (!heading) continue
    if (/[*_`[\]<>]/.test(heading)) {
      throw new Error(
        `${sourcePath} level-two headings must be plain text so their section ids stay stable: "${heading}".`,
      )
    }
    if (!contentHeadingId(heading)) {
      throw new Error(`${sourcePath} level-two heading does not produce a usable section id.`)
    }
    headings.push(heading)
  }

  return headings
}

function readLiteral(node: ts.Expression, sourcePath: string): unknown {
  if (ts.isStringLiteralLike(node)) return node.text
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

function propertyName(name: ts.PropertyName, sourcePath: string): string {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) {
    return name.text
  }
  throw new Error(`${sourcePath} meta contains an unsupported property name.`)
}

function requiredString(value: unknown, field: string, sourcePath: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${sourcePath} meta.${field} must be a non-empty string.`)
  }
  return value
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function formatIds(ids: readonly string[]): string {
  return ids.length > 0 ? ids.join(', ') : '(none)'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isBlogCategory(value: string): value is BlogPostMeta['category'] {
  return (blogCategories as readonly string[]).includes(value)
}
