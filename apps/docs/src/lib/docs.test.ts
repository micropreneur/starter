import { describe, expect, it } from 'vitest'

import { docGroups, docPages, getAdjacentPages, getDocPage, searchDocs } from './docs'

describe('documentation catalog', () => {
  it('keeps paths and source files unique', () => {
    expect(new Set(docPages.map((page) => page.path)).size).toBe(docPages.length)
    expect(new Set(docPages.map((page) => page.sourcePath)).size).toBe(docPages.length)
  })

  it('orders groups and pages deterministically', () => {
    const ranks = docPages.map((page) => docGroups.indexOf(page.group))
    expect(ranks).toEqual([...ranks].sort((first, second) => first - second))
  })

  it('resolves the introduction at the root path', () => {
    expect(getDocPage('/')?.path).toBe('getting-started/introduction')
  })

  it('searches titles, descriptions, sections, and keywords', () => {
    expect(searchDocs('stripe')[0]?.path).toBe('integrations/stripe')
    expect(searchDocs('durable objects').some((page) => page.group === 'Cloudflare')).toBe(true)
    expect(searchDocs('mdx')[0]?.path).toBe('getting-started/writing-documentation')
  })

  it('publishes the MDX authoring guide after the core setup guides', () => {
    const page = getDocPage('/getting-started/writing-documentation')
    expect(page?.order).toBe(4)
    expect(page?.sections.map((section) => section.id)).toEqual([
      'write-in-mdx',
      'guide-a-sequence',
      'compare-commands',
      'embed-an-element',
      'publish-agent-interfaces',
    ])
  })

  it('returns neighboring pages', () => {
    const page = docPages[1]
    expect(page).toBeDefined()
    if (!page) return

    const adjacent = getAdjacentPages(page)
    expect(adjacent.previous).toBe(docPages[0])
    expect(adjacent.next).toBe(docPages[2])
  })
})
