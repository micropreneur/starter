import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { createAgentDocsOutputs, generateAgentDocs } from './agent-docs'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))

describe('agent documentation generator', () => {
  it('derives raw Markdown and indexes from canonical sources', async () => {
    const outputs = await createAgentDocsOutputs(repoRoot)
    const byPath = new Map(outputs.map((output) => [output.path, output.content]))

    const introduction = findOutput(byPath, '/apps/docs/public/getting-started/introduction.md')
    expect(introduction).toContain('# Introduction')
    expect(introduction).not.toContain('export const meta')

    const llms = findOutput(byPath, '/apps/docs/public/llms.txt')
    expect(llms.indexOf('## Getting started')).toBeLessThan(llms.indexOf('## Agents'))
    expect(llms).toContain('[starter-repo](/skills/starter-repo.md)')

    const mcpCorpus = JSON.parse(
      findOutput(byPath, '/packages/mcp/src/generated/agent-content.json'),
    ) as { docs: Array<{ id: string }>; skills: Array<{ name: string }> }
    expect(mcpCorpus.docs).toContainEqual(expect.objectContaining({ id: 'agents/mcp-server' }))
    expect(mcpCorpus.docs).toContainEqual(expect.objectContaining({ id: 'agents/agent-skills' }))
    expect(mcpCorpus.docs).toContainEqual(
      expect.objectContaining({ id: 'agents/llms-integration' }),
    )
    expect(mcpCorpus.docs).not.toContainEqual(
      expect.objectContaining({ id: 'agents/agent-readable-docs' }),
    )
    expect(mcpCorpus.skills).toContainEqual(expect.objectContaining({ name: 'starter-repo' }))

    const projectStructure = findOutput(
      byPath,
      '/apps/docs/public/getting-started/project-structure.md',
    )
    expect(projectStructure).toContain('├── web/')
    expect(projectStructure).not.toContain('â”')
  })

  it('publishes current and legacy skill discovery from exact skill bytes', async () => {
    const outputs = await createAgentDocsOutputs(repoRoot)
    const byPath = new Map(outputs.map((output) => [output.path, output.content]))
    const skill = findOutput(
      byPath,
      '/apps/docs/public/.well-known/agent-skills/starter-repo/SKILL.md',
    )
    const current = JSON.parse(
      findOutput(byPath, '/apps/docs/public/.well-known/agent-skills/index.json'),
    ) as {
      $schema: string
      skills: Array<{ digest: string; name: string; type: string; url: string }>
    }
    const legacy = JSON.parse(
      findOutput(byPath, '/apps/docs/public/.well-known/skills/index.json'),
    ) as { skills: Array<{ files: string[]; name: string }> }

    expect(current.$schema).toBe('https://schemas.agentskills.io/discovery/0.2.0/schema.json')
    expect(current.skills).toContainEqual(
      expect.objectContaining({
        digest: `sha256:${createHash('sha256').update(skill, 'utf8').digest('hex')}`,
        name: 'starter-repo',
        type: 'skill-md',
        url: '/.well-known/agent-skills/starter-repo/SKILL.md',
      }),
    )
    expect(legacy.skills).toContainEqual(
      expect.objectContaining({ files: ['SKILL.md'], name: 'starter-repo' }),
    )
  })

  it('keeps committed agent artifacts current', async () => {
    await expect(generateAgentDocs(repoRoot, true)).resolves.toContain('apps/docs/public/llms.txt')
  })
})

function findOutput(outputs: ReadonlyMap<string, string>, suffix: string) {
  const entry = [...outputs.entries()].find(([filePath]) => filePath.endsWith(suffix))
  if (!entry) throw new Error(`Missing generated output: ${suffix}`)
  return entry[1]
}
