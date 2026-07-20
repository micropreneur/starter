import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { type ElementKind, type ElementOntology, elementCatalog } from './catalog'

interface RegistryItem {
  categories?: string[]
  dependencies?: string[]
  description?: string
  files?: Array<{ path: string; target?: string; type: string }>
  meta?: {
    docs?: string
    kind?: ElementKind
    ontology?: ElementOntology
    tier?: string
  }
  name: string
  title?: string
  type: 'registry:block' | 'registry:component' | 'registry:lib' | 'registry:ui'
}

interface RegistryManifest {
  items: RegistryItem[]
}

const registry = JSON.parse(
  readFileSync(new URL('../registry/free/registry.json', import.meta.url), 'utf8'),
) as RegistryManifest

const publicRegistryItems = registry.items.filter((item) => item.name !== 'utils')

function inferredKind(item: RegistryItem): ElementKind {
  if (item.meta?.kind != null) return item.meta.kind
  if (item.type === 'registry:ui') return 'primitive'
  return 'component'
}

describe('free elements catalog', () => {
  it('keeps names unique and machine-readable', () => {
    const names = elementCatalog.map((item) => item.name)
    expect(new Set(names).size).toBe(names.length)
    expect(names).toEqual([
      'button',
      'card',
      'badge',
      'table',
      'status-badge',
      'data-grid',
      'ledger-list',
      'margin-note',
      'index-label',
      'milestone-marker',
      'empty-state',
      'dashboard-shell',
      'auth-card',
      'settings-layout',
      'filterable-data-table',
    ])
    expect(elementCatalog.every((item) => item.tier === 'free')).toBe(true)
  })

  it('matches the public registry manifest exactly', () => {
    expect(publicRegistryItems.map((item) => item.name)).toEqual(
      expect.arrayContaining(elementCatalog.map((item) => item.name)),
    )
    expect(publicRegistryItems).toHaveLength(elementCatalog.length)

    for (const catalogItem of elementCatalog) {
      const registryItem = publicRegistryItems.find((item) => item.name === catalogItem.name)
      expect(registryItem, `${catalogItem.name} is missing from the registry`).toBeDefined()
      expect(registryItem?.title).toBe(catalogItem.title)
      expect(registryItem?.description).toBe(catalogItem.description)
      expect(registryItem?.type).toBe(catalogItem.registryType)
      expect(registryItem?.dependencies ?? []).toEqual(catalogItem.dependencies)
      expect(registryItem?.categories?.[0]).toBe(catalogItem.ontology)
      expect(registryItem?.meta?.ontology).toBe(catalogItem.ontology)
      expect(registryItem?.meta?.tier).toBe(catalogItem.tier)
      expect(registryItem?.meta?.docs).toBe(catalogItem.docsPath)
      expect(registryItem == null ? undefined : inferredKind(registryItem)).toBe(catalogItem.kind)
      expect(registryItem?.files?.length).toBeGreaterThan(0)
    }
  })

  it('keeps a readable Markdown page for every catalog entry', () => {
    for (const item of elementCatalog) {
      expect(item.docsPath).toBe(`/components/${item.name}.md`)
      const content = readFileSync(
        new URL(`../../../apps/docs/public${item.docsPath}`, import.meta.url),
        'utf8',
      )
      expect(content).toContain(`# ${item.title}`)
      expect(content).toContain(`Ontology: **${item.ontology}**`)
      expect(content).toContain(`/r/${item.name}.json`)
    }
  })
})
