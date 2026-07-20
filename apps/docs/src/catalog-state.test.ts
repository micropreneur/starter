import { elementCatalog } from '@micropreneur/elements/catalog'
import { describe, expect, it } from 'vitest'

import { countByOntology, filterCatalog, isOntologyFilter } from './catalog-state'
import { previewNames } from './previews'

describe('Elements gallery catalog state', () => {
  it('searches titles, descriptions, kinds, and dependencies', () => {
    expect(
      filterCatalog(elementCatalog, 'provider-neutral', 'All').map((item) => item.name),
    ).toEqual(['auth-card'])
    expect(filterCatalog(elementCatalog, 'block', 'All').map((item) => item.kind)).toEqual([
      'block',
      'block',
      'block',
      'block',
    ])
    expect(filterCatalog(elementCatalog, 'lucide', 'All').map((item) => item.name)).toEqual([
      'filterable-data-table',
    ])
  })

  it('combines ontology filtering with search', () => {
    expect(filterCatalog(elementCatalog, 'status', 'Properties').map((item) => item.name)).toEqual([
      'status-badge',
    ])
    expect(filterCatalog(elementCatalog, 'status', 'Actions')).toEqual([])
  })

  it('reports stable filter counts and rejects invalid values', () => {
    expect(countByOntology(elementCatalog, 'All')).toBe(elementCatalog.length)
    expect(countByOntology(elementCatalog, 'Interfaces')).toBeGreaterThan(0)
    expect(isOntologyFilter('Objects')).toBe(true)
    expect(isOntologyFilter('Premium')).toBe(false)
  })

  it('keeps a rendered preview for every catalog item', () => {
    expect(previewNames.toSorted()).toEqual(elementCatalog.map((item) => item.name).toSorted())
  })
})
