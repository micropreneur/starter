import { describe, expect, it } from 'vitest'

import { getDoc, getSkill, listDocs, listSkills, searchDocs, searchSkills } from './knowledge'

describe('agent knowledge tools', () => {
  it('lists public guides and component references without full Markdown', () => {
    const docs = listDocs()

    expect(docs.some((doc) => doc.id === 'getting-started/introduction')).toBe(true)
    expect(docs.some((doc) => doc.id === 'components/card')).toBe(true)
    expect(docs[0]).not.toHaveProperty('markdown')
  })

  it('searches documentation content and returns a focused snippet', () => {
    const results = searchDocs('webhook')

    expect(results[0]?.id).toBe('integrations/stripe')
    expect(results[0]?.snippet.toLowerCase()).toContain('webhook')
    expect(results[0]).not.toHaveProperty('markdown')
  })

  it('gets the complete canonical document by id or raw path', () => {
    expect(getDoc('agents/mcp-server')?.markdown).toContain('## Available tools')
    expect(getDoc('/components/card.md')?.title).toBe('Card')
    expect(getDoc('missing')).toBeUndefined()
  })

  it('lists, searches, and fetches canonical shared skills', () => {
    expect(listSkills()).toEqual([
      expect.objectContaining({ name: 'starter-repo', rawPath: '/skills/starter-repo.md' }),
    ])
    expect(searchSkills('AuthPort')[0]?.name).toBe('starter-repo')
    expect(getSkill('starter-repo')?.markdown).toContain('Read the root and nearest local')
    expect(getSkill('missing')).toBeUndefined()
  })
})
