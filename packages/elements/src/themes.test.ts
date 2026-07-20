import { readFileSync } from 'node:fs'
import { registrySchema } from 'shadcn/schema'
import { describe, expect, it } from 'vitest'

import {
  applyBrandColor,
  applyCanvasColor,
  applyDepth,
  applyRadius,
  applySurfaceColor,
  contrastRatio,
  defaultThemePreset,
  readableForeground,
  themeCatalog,
  themeColorTokenNames,
  themeToCss,
  toThemeRegistryItem,
  toThemeStyle,
  typographyPacks,
} from './themes'

interface ThemeManifest {
  items: Array<
    ReturnType<typeof toThemeRegistryItem> & {
      categories?: string[]
      meta: ReturnType<typeof toThemeRegistryItem>['meta'] & { docs?: string }
    }
  >
}

const manifest = JSON.parse(
  readFileSync(new URL('../registry/free/themes/registry.json', import.meta.url), 'utf8'),
) as ThemeManifest

describe('Elements theme catalog', () => {
  it('ships six complete, uniquely named free presets', () => {
    expect(themeCatalog).toHaveLength(6)
    expect(new Set(themeCatalog.map((theme) => theme.name))).toHaveLength(themeCatalog.length)
    expect(new Set(themeCatalog.map((theme) => theme.registryName))).toHaveLength(
      themeCatalog.length,
    )

    for (const preset of themeCatalog) {
      for (const mode of [preset.light, preset.dark]) {
        expect(Object.keys(mode)).toEqual(
          expect.arrayContaining([
            ...themeColorTokenNames,
            'radius',
            'shadow-card',
            'shadow-overlay',
          ]),
        )
      }
    }
  })

  it('keeps the generated registry manifest aligned and schema-valid', () => {
    expect(registrySchema.safeParse(manifest).success).toBe(true)
    expect(manifest.items.map((item) => item.name)).toEqual(
      themeCatalog.map((preset) => preset.registryName),
    )

    for (const preset of themeCatalog) {
      const item = manifest.items.find((candidate) => candidate.name === preset.registryName)
      const expected = toThemeRegistryItem(preset)
      expect(item?.type).toBe('registry:theme')
      expect(item?.cssVars).toEqual(expected.cssVars)
      expect(item?.meta.tier).toBe('free')
      expect(item?.meta.license).toBe(preset.license)
      expect(item?.meta.docs).toBe(`/themes.md#${preset.name}`)
    }
  })

  it('documents the imported Apache-2.0 palettes without changing the Starter license', () => {
    const imported = themeCatalog.filter((theme) => theme.source === 'tweakcn')
    expect(imported).toHaveLength(5)
    expect(imported.every((theme) => theme.license === 'Apache-2.0')).toBe(true)
    expect(themeCatalog.find((theme) => theme.name === 'starter')?.license).toBe('MIT')
  })

  it('meets the declared contrast floor for core interface pairs', () => {
    for (const preset of themeCatalog) {
      for (const [modeName, tokens] of [
        ['light', preset.light],
        ['dark', preset.dark],
      ] as const) {
        expect(
          contrastRatio(tokens.background, tokens.foreground),
          `${preset.name} ${modeName} canvas`,
        ).toBeGreaterThanOrEqual(4.5)
        expect(
          contrastRatio(tokens.primary, tokens['primary-foreground']),
          `${preset.name} ${modeName} primary`,
        ).toBeGreaterThanOrEqual(3)
        expect(
          contrastRatio(tokens.destructive, tokens['destructive-foreground']),
          `${preset.name} ${modeName} destructive`,
        ).toBeGreaterThanOrEqual(3)
        expect(
          contrastRatio(tokens.background, tokens.ring),
          `${preset.name} ${modeName} ring`,
        ).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('creates scoped variables, deterministic CSS, and valid registry exports', () => {
    const starter = defaultThemePreset
    expect(toThemeStyle(starter, 'light')['--primary']).toBe(starter.light.primary)
    expect(themeToCss(starter)).toContain(':root {')
    expect(themeToCss(starter)).toContain('.dark {')
    expect(toThemeRegistryItem(starter).cssVars.dark).toEqual(starter.dark)
    expect(typographyPacks.every((pack) => Array.isArray(pack.dependencies))).toBe(true)
  })
})

describe('theme customization helpers', () => {
  const tokens = defaultThemePreset.light

  it('generates an accessible foreground and related brand tokens', () => {
    expect(readableForeground('#ffffff')).toBe('#000000')
    expect(readableForeground('#111111')).toBe('#ffffff')
    const next = applyBrandColor(tokens, '#7c3aed')
    expect(next.primary).toBe('#7c3aed')
    expect(next['primary-foreground']).toBe('#ffffff')
    expect(next['chart-2']).not.toBe(next['chart-1'])
  })

  it('updates only the intended canvas, surface, radius, and depth seams', () => {
    expect(applyCanvasColor(tokens, '#fafafa').background).toBe('#fafafa')
    expect(applySurfaceColor(tokens, '#f5f5f5').card).toBe('#f5f5f5')
    expect(applyRadius(tokens, 12).radius).toBe('0.75rem')
    expect(applyDepth(tokens, 'lifted')['shadow-card']).not.toBe(tokens['shadow-card'])
  })

  it('rejects unsafe or malformed custom values', () => {
    expect(() => applyBrandColor(tokens, 'url(javascript:alert(1))')).toThrow()
    expect(() => applyCanvasColor(tokens, '#fff')).toThrow()
    expect(() => applySurfaceColor(tokens, '<script>')).toThrow()
    expect(() => applyRadius(tokens, 25)).toThrow()
  })
})
