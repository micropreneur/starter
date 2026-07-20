import { elementCatalog } from '@micropreneur/elements/catalog'
import { themeCatalog } from '@micropreneur/elements/themes'
import { describe, expect, it } from 'vitest'

import {
  getComponent,
  getTheme,
  listComponents,
  listThemes,
  searchComponents,
  searchThemes,
} from './registry'

describe('component registry tools', () => {
  it('lists the free registry with install commands', () => {
    const items = listComponents('http://registry.test/r/')
    expect(items).toHaveLength(elementCatalog.length)
    expect(items[0]?.installCommand).toContain('http://registry.test/r/button.json')
  })

  it('searches ontology and descriptions', () => {
    expect(searchComponents('properties').map((item) => item.name)).toEqual([
      'badge',
      'status-badge',
      'margin-note',
      'index-label',
    ])
    expect(searchComponents('grid').map((item) => item.name)).toEqual(['data-grid'])
  })

  it('fetches exact component metadata', () => {
    expect(getComponent('card')?.docsPath).toBe('/components/card.md')
    expect(getComponent('missing')).toBeUndefined()
  })

  it('lists and searches themes separately from components', () => {
    const themes = listThemes('http://registry.test/r/')
    expect(themes).toHaveLength(themeCatalog.length)
    expect(themes[0]?.installCommand).toContain('/theme-starter.json')
    expect(searchThemes('amber').map((theme) => theme.name)).toEqual(['amber-minimal'])
    expect(searchThemes('tweakcn')).toHaveLength(5)
  })

  it('fetches themes by catalog or registry name', () => {
    expect(getTheme('clean-slate')?.registryName).toBe('theme-clean-slate')
    expect(getTheme('theme-clean-slate')?.name).toBe('clean-slate')
    expect(getTheme('missing')).toBeUndefined()
  })
})
