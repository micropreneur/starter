import { elementCatalog } from '@micropreneur/elements/catalog'
import { describe, expect, it } from 'vitest'

import {
  elementOntologies,
  elementPageHref,
  elementSourcePath,
  getAdjacentElements,
  getElementPage,
  getElementsByOntology,
  getFirstElementPage,
  searchElements,
} from './elements'

describe('Elements documentation routes', () => {
  it('resolves every catalog item through a stable drill-down URL', () => {
    for (const element of elementCatalog) {
      const href = elementPageHref(element)
      expect(getElementPage(href)?.name).toBe(element.name)
    }
  })

  it('lists every item under exactly one ontology', () => {
    const grouped = elementOntologies.flatMap(getElementsByOntology)
    expect(grouped).toHaveLength(elementCatalog.length)
    expect(new Set(grouped.map((element) => element.name)).size).toBe(elementCatalog.length)
  })

  it('uses the grouped sidebar order for entry and adjacent component links', () => {
    const first = getFirstElementPage()
    expect(first?.name).toBe('card')
    expect(first && getAdjacentElements(first).previous).toBeUndefined()
  })

  it('points primitives and composed elements at their owning source package', () => {
    expect(elementSourcePath(elementCatalog[0])).toBe('packages/ui/src/components/button.tsx')
    expect(elementSourcePath(elementCatalog[4])).toBe('packages/elements/src/status-badge.tsx')
  })

  it('searches registry metadata', () => {
    expect(searchElements('lifecycle').map((element) => element.name)).toContain('status-badge')
    expect(searchElements('status badge').map((element) => element.name)).toContain('status-badge')
    expect(searchElements('block').length).toBeGreaterThan(0)
  })
})
