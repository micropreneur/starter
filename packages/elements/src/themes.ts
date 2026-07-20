export const themeColorTokenNames = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
] as const

export type ThemeColorToken = (typeof themeColorTokenNames)[number]
export type ThemeMode = 'dark' | 'light'
export type ThemeSource = 'micropreneur' | 'tweakcn'
export type ThemeDepth = 'flat' | 'lifted' | 'soft'
export type TypographyPackName = 'editorial' | 'humanist' | 'system'

export interface ThemeModeTokens extends Record<ThemeColorToken, string> {
  radius: string
  'shadow-card': string
  'shadow-overlay': string
}

export interface TypographyPack {
  dependencies: readonly string[]
  description: string
  label: string
  mono: string
  name: TypographyPackName
  sans: string
  serif: string
}

export interface ThemePreset {
  dark: ThemeModeTokens
  description: string
  license: 'Apache-2.0' | 'MIT'
  light: ThemeModeTokens
  name: string
  registryName: string
  source: ThemeSource
  sourceUrl: string
  swatches: readonly [string, string, string]
  title: string
  typography: TypographyPackName
}

export interface ThemeRegistryItem {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json'
  cssVars: {
    dark: ThemeModeTokens
    light: ThemeModeTokens
    theme: Record<'font-mono' | 'font-sans' | 'font-serif', string>
  }
  dependencies: readonly string[]
  description: string
  meta: {
    license: ThemePreset['license']
    source: ThemeSource
    sourceUrl: string
    tier: 'free'
  }
  name: string
  title: string
  type: 'registry:theme'
}

export const typographyPacks = [
  {
    name: 'editorial',
    label: 'Editorial',
    description: 'Clean system sans with a literary display serif.',
    sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    serif: '"Iowan Old Style", "Palatino Linotype", Georgia, serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    dependencies: [],
  },
  {
    name: 'system',
    label: 'System',
    description: 'Native platform type with no font download.',
    sans: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    serif: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    dependencies: [],
  },
  {
    name: 'humanist',
    label: 'Humanist',
    description: 'A warmer system stack for product interfaces.',
    sans: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
    serif: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif',
    mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
    dependencies: [],
  },
] as const satisfies readonly TypographyPack[]

export const themeDepths = ['flat', 'soft', 'lifted'] as const satisfies readonly ThemeDepth[]

const depthRecipes: Record<ThemeDepth, Pick<ThemeModeTokens, 'shadow-card' | 'shadow-overlay'>> = {
  flat: {
    'shadow-card': 'inset 0 1px 0 color-mix(in srgb, currentColor 5%, transparent)',
    'shadow-overlay': '0 1px 2px rgb(0 0 0 / 0.08)',
  },
  soft: {
    'shadow-card': '0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px -16px rgb(0 0 0 / 0.2)',
    'shadow-overlay': '0 8px 32px -10px rgb(0 0 0 / 0.28)',
  },
  lifted: {
    'shadow-card': '0 2px 4px rgb(0 0 0 / 0.08), 0 14px 32px -18px rgb(0 0 0 / 0.35)',
    'shadow-overlay': '0 18px 48px -14px rgb(0 0 0 / 0.4)',
  },
}

interface ModeInput {
  accent: string
  accentForeground: string
  background: string
  border: string
  charts: readonly [string, string, string, string, string]
  depth?: ThemeDepth
  destructive?: string
  destructiveForeground?: string
  foreground: string
  muted: string
  mutedForeground: string
  primary: string
  primaryForeground: string
  radius?: string
  ring?: string
  secondary: string
  secondaryForeground: string
  sidebar?: string
  sidebarAccent?: string
  sidebarAccentForeground?: string
  sidebarForeground?: string
  sidebarPrimary?: string
  sidebarPrimaryForeground?: string
  surface: string
}

function createMode(input: ModeInput): ThemeModeTokens {
  const shadows = depthRecipes[input.depth ?? 'flat']
  return {
    background: input.background,
    foreground: input.foreground,
    card: input.surface,
    'card-foreground': input.foreground,
    popover: input.surface,
    'popover-foreground': input.foreground,
    primary: input.primary,
    'primary-foreground': input.primaryForeground,
    secondary: input.secondary,
    'secondary-foreground': input.secondaryForeground,
    muted: input.muted,
    'muted-foreground': input.mutedForeground,
    accent: input.accent,
    'accent-foreground': input.accentForeground,
    destructive: input.destructive ?? '#dc2626',
    'destructive-foreground': input.destructiveForeground ?? '#ffffff',
    border: input.border,
    input: input.border,
    ring: input.ring ?? input.primary,
    'chart-1': input.charts[0],
    'chart-2': input.charts[1],
    'chart-3': input.charts[2],
    'chart-4': input.charts[3],
    'chart-5': input.charts[4],
    sidebar: input.sidebar ?? input.background,
    'sidebar-foreground': input.sidebarForeground ?? input.foreground,
    'sidebar-primary': input.sidebarPrimary ?? input.primary,
    'sidebar-primary-foreground': input.sidebarPrimaryForeground ?? input.primaryForeground,
    'sidebar-accent': input.sidebarAccent ?? input.accent,
    'sidebar-accent-foreground': input.sidebarAccentForeground ?? input.accentForeground,
    'sidebar-border': input.border,
    'sidebar-ring': input.primary,
    radius: input.radius ?? '0.625rem',
    ...shadows,
  }
}

const tweakcnSource = 'https://github.com/jnsahaj/tweakcn/blob/main/utils/theme-presets.ts'

export const themeCatalog = [
  {
    name: 'starter',
    registryName: 'theme-starter',
    title: 'Starter',
    description: 'The warm editorial default shipped with Micropreneur Starter.',
    source: 'micropreneur',
    sourceUrl: 'https://github.com/micropreneur/starter',
    license: 'MIT',
    typography: 'editorial',
    swatches: ['#2563eb', '#e3722c', '#f8f6f1'],
    light: createMode({
      background: '#ffffff',
      foreground: '#1b1f27',
      surface: '#fdfcf9',
      primary: '#2563eb',
      primaryForeground: '#ffffff',
      secondary: '#ebe6dd',
      secondaryForeground: '#1b1f27',
      muted: '#eeeae3',
      mutedForeground: '#646975',
      accent: '#d96d2b',
      accentForeground: '#ffffff',
      border: '#d9d4cb',
      charts: ['#2563eb', '#d96d2b', '#64748b', '#8b5cf6', '#0f766e'],
      sidebar: '#faf8f4',
      sidebarAccent: '#eeeae3',
    }),
    dark: createMode({
      background: '#10131a',
      foreground: '#eeeae3',
      surface: '#171b24',
      primary: '#60a5fa',
      primaryForeground: '#0f172a',
      secondary: '#232936',
      secondaryForeground: '#eeeae3',
      muted: '#232936',
      mutedForeground: '#9aa3b2',
      accent: '#f28b45',
      accentForeground: '#10131a',
      destructive: '#ef6461',
      destructiveForeground: '#10131a',
      border: '#303747',
      charts: ['#60a5fa', '#f28b45', '#a78bfa', '#2dd4bf', '#facc15'],
      sidebar: '#090b10',
      sidebarAccent: '#232936',
    }),
  },
  {
    name: 'modern-minimal',
    registryName: 'theme-modern-minimal',
    title: 'Modern Minimal',
    description: 'A crisp blue interface with restrained radius and neutral surfaces.',
    source: 'tweakcn',
    sourceUrl: tweakcnSource,
    license: 'Apache-2.0',
    typography: 'system',
    swatches: ['#3b82f6', '#f3f4f6', '#171717'],
    light: createMode({
      background: '#ffffff',
      foreground: '#333333',
      surface: '#ffffff',
      primary: '#3b82f6',
      primaryForeground: '#ffffff',
      secondary: '#f3f4f6',
      secondaryForeground: '#4b5563',
      muted: '#f9fafb',
      mutedForeground: '#6b7280',
      accent: '#e0f2fe',
      accentForeground: '#1e3a8a',
      border: '#e5e7eb',
      charts: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
      radius: '0.375rem',
      sidebar: '#f9fafb',
      sidebarAccent: '#e0f2fe',
    }),
    dark: createMode({
      background: '#171717',
      foreground: '#e5e5e5',
      surface: '#262626',
      primary: '#3b82f6',
      primaryForeground: '#ffffff',
      secondary: '#262626',
      secondaryForeground: '#e5e5e5',
      muted: '#1f1f1f',
      mutedForeground: '#a3a3a3',
      accent: '#1e3a8a',
      accentForeground: '#bfdbfe',
      border: '#404040',
      charts: ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'],
      radius: '0.375rem',
      sidebar: '#171717',
      sidebarAccent: '#1e3a8a',
    }),
  },
  {
    name: 'amber-minimal',
    registryName: 'theme-amber-minimal',
    title: 'Amber Minimal',
    description: 'Warm amber actions over a compact, quiet product canvas.',
    source: 'tweakcn',
    sourceUrl: tweakcnSource,
    license: 'Apache-2.0',
    typography: 'humanist',
    swatches: ['#f59e0b', '#fffbeb', '#171717'],
    light: createMode({
      background: '#ffffff',
      foreground: '#262626',
      surface: '#ffffff',
      primary: '#f59e0b',
      primaryForeground: '#000000',
      secondary: '#f3f4f6',
      secondaryForeground: '#4b5563',
      muted: '#f9fafb',
      mutedForeground: '#6b7280',
      accent: '#fffbeb',
      accentForeground: '#92400e',
      border: '#e5e7eb',
      charts: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
      radius: '0.375rem',
      ring: '#b45309',
      sidebar: '#f9fafb',
      sidebarAccent: '#fffbeb',
      depth: 'soft',
    }),
    dark: createMode({
      background: '#171717',
      foreground: '#e5e5e5',
      surface: '#262626',
      primary: '#f59e0b',
      primaryForeground: '#000000',
      secondary: '#262626',
      secondaryForeground: '#e5e5e5',
      muted: '#1f1f1f',
      mutedForeground: '#a3a3a3',
      accent: '#92400e',
      accentForeground: '#fde68a',
      border: '#404040',
      charts: ['#fbbf24', '#d97706', '#92400e', '#b45309', '#78350f'],
      radius: '0.375rem',
      sidebar: '#0f0f0f',
      sidebarAccent: '#92400e',
      depth: 'soft',
    }),
  },
  {
    name: 'clean-slate',
    registryName: 'theme-clean-slate',
    title: 'Clean Slate',
    description: 'Cool slate surfaces and an indigo signal color for dense applications.',
    source: 'tweakcn',
    sourceUrl: tweakcnSource,
    license: 'Apache-2.0',
    typography: 'system',
    swatches: ['#6366f1', '#f8fafc', '#1e293b'],
    light: createMode({
      background: '#f8fafc',
      foreground: '#1e293b',
      surface: '#ffffff',
      primary: '#6366f1',
      primaryForeground: '#ffffff',
      secondary: '#e5e7eb',
      secondaryForeground: '#374151',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      accent: '#e0e7ff',
      accentForeground: '#374151',
      border: '#d1d5db',
      charts: ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'],
      radius: '0.5rem',
      sidebar: '#f3f4f6',
      sidebarAccent: '#e0e7ff',
      depth: 'soft',
    }),
    dark: createMode({
      background: '#0f172a',
      foreground: '#e2e8f0',
      surface: '#1e293b',
      primary: '#818cf8',
      primaryForeground: '#0f172a',
      secondary: '#2d3748',
      secondaryForeground: '#d1d5db',
      muted: '#152032',
      mutedForeground: '#9ca3af',
      accent: '#374151',
      accentForeground: '#d1d5db',
      border: '#4b5563',
      charts: ['#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3'],
      radius: '0.5rem',
      sidebar: '#1e293b',
      sidebarAccent: '#374151',
      depth: 'soft',
    }),
  },
  {
    name: 'caffeine',
    registryName: 'theme-caffeine',
    title: 'Caffeine',
    description: 'Coffee-toned neutrals with soft cream highlights and compact geometry.',
    source: 'tweakcn',
    sourceUrl: tweakcnSource,
    license: 'Apache-2.0',
    typography: 'editorial',
    swatches: ['#644a40', '#ffdfb5', '#202020'],
    light: createMode({
      background: '#f9f9f9',
      foreground: '#202020',
      surface: '#fcfcfc',
      primary: '#644a40',
      primaryForeground: '#ffffff',
      secondary: '#ffdfb5',
      secondaryForeground: '#582d1d',
      muted: '#efefef',
      mutedForeground: '#646464',
      accent: '#e8e8e8',
      accentForeground: '#202020',
      destructive: '#e54d2e',
      border: '#d8d8d8',
      charts: ['#644a40', '#ffdfb5', '#a27b68', '#ffe6c4', '#66493e'],
      radius: '0.5rem',
      sidebar: '#fbfbfb',
      sidebarPrimary: '#343434',
      sidebarPrimaryForeground: '#fbfbfb',
      sidebarAccent: '#f7f7f7',
    }),
    dark: createMode({
      background: '#111111',
      foreground: '#eeeeee',
      surface: '#191919',
      primary: '#ffe0c2',
      primaryForeground: '#081a1b',
      secondary: '#393028',
      secondaryForeground: '#ffe0c2',
      muted: '#222222',
      mutedForeground: '#b4b4b4',
      accent: '#2a2a2a',
      accentForeground: '#eeeeee',
      destructive: '#e54d2e',
      border: '#484848',
      charts: ['#ffe0c2', '#b89578', '#806858', '#665246', '#fff0df'],
      radius: '0.5rem',
      sidebar: '#18181b',
      sidebarPrimary: '#ffe0c2',
      sidebarPrimaryForeground: '#081a1b',
      sidebarAccent: '#27272a',
    }),
  },
  {
    name: 'ocean-breeze',
    registryName: 'theme-ocean-breeze',
    title: 'Ocean Breeze',
    description: 'Airy blue surfaces balanced by green actions and teal data colors.',
    source: 'tweakcn',
    sourceUrl: tweakcnSource,
    license: 'Apache-2.0',
    typography: 'humanist',
    swatches: ['#22c55e', '#e0f2fe', '#0f172a'],
    light: createMode({
      background: '#f0f8ff',
      foreground: '#374151',
      surface: '#ffffff',
      primary: '#168f46',
      primaryForeground: '#ffffff',
      secondary: '#e0f2fe',
      secondaryForeground: '#374151',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      accent: '#d1fae5',
      accentForeground: '#374151',
      border: '#d6e1ea',
      charts: ['#168f46', '#10b981', '#059669', '#047857', '#065f46'],
      radius: '0.5rem',
      sidebar: '#e0f2fe',
      sidebarAccent: '#d1fae5',
      depth: 'soft',
    }),
    dark: createMode({
      background: '#0f172a',
      foreground: '#d1d5db',
      surface: '#1e293b',
      primary: '#34d399',
      primaryForeground: '#0f172a',
      secondary: '#2d3748',
      secondaryForeground: '#d1d5db',
      muted: '#19212e',
      mutedForeground: '#9ca3af',
      accent: '#374151',
      accentForeground: '#d1d5db',
      border: '#4b5563',
      charts: ['#34d399', '#2dd4bf', '#22c55e', '#10b981', '#059669'],
      radius: '0.5rem',
      sidebar: '#1e293b',
      sidebarAccent: '#374151',
      depth: 'soft',
    }),
  },
] as const satisfies readonly ThemePreset[]

export const defaultThemePreset: ThemePreset = themeCatalog[0]

export function getThemePreset(name: string): ThemePreset | undefined {
  return themeCatalog.find((theme) => theme.name === name)
}

export function getTypographyPack(name: TypographyPackName): TypographyPack {
  const pack = typographyPacks.find((candidate) => candidate.name === name)
  if (pack == null) throw new Error(`Unknown typography pack: ${name}`)
  return pack
}

export function toThemeStyle(
  preset: Pick<ThemePreset, 'dark' | 'light' | 'typography'>,
  mode: ThemeMode,
): Record<`--${string}`, string> {
  const typography = getTypographyPack(preset.typography)
  const tokens = preset[mode]
  return {
    ...Object.fromEntries(Object.entries(tokens).map(([name, value]) => [`--${name}`, value])),
    '--font-sans': typography.sans,
    '--font-serif': typography.serif,
    '--font-mono': typography.mono,
  } as Record<`--${string}`, string>
}

export function toThemeRegistryItem(preset: ThemePreset): ThemeRegistryItem {
  const typography = getTypographyPack(preset.typography)
  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: preset.registryName,
    title: preset.title,
    type: 'registry:theme',
    description: preset.description,
    dependencies: typography.dependencies,
    cssVars: {
      theme: {
        'font-sans': typography.sans,
        'font-serif': typography.serif,
        'font-mono': typography.mono,
      },
      light: preset.light,
      dark: preset.dark,
    },
    meta: {
      tier: 'free',
      source: preset.source,
      sourceUrl: preset.sourceUrl,
      license: preset.license,
    },
  }
}

export function themeToCss(preset: Pick<ThemePreset, 'dark' | 'light' | 'typography'>): string {
  const typography = getTypographyPack(preset.typography)
  const declarations = (tokens: ThemeModeTokens) =>
    Object.entries(tokens)
      .map(([name, value]) => `  --${name}: ${value};`)
      .join('\n')

  return `@theme {\n  --font-sans: ${typography.sans};\n  --font-serif: ${typography.serif};\n  --font-mono: ${typography.mono};\n}\n\n:root {\n${declarations(preset.light)}\n}\n\n.dark {\n${declarations(preset.dark)}\n}\n`
}

export function isHexColor(value: string): boolean {
  return /^#[\da-f]{6}$/i.test(value)
}

function hexChannels(value: string): readonly [number, number, number] {
  if (!isHexColor(value)) throw new Error(`Expected a six-digit hex color, received: ${value}`)
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ]
}

function relativeLuminance(value: string): number {
  const [red, green, blue] = hexChannels(value).map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return red * 0.2126 + green * 0.7152 + blue * 0.0722
}

export function contrastRatio(first: string, second: string): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second))
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second))
  return (lighter + 0.05) / (darker + 0.05)
}

export function readableForeground(background: string): '#000000' | '#ffffff' {
  return contrastRatio(background, '#000000') >= contrastRatio(background, '#ffffff')
    ? '#000000'
    : '#ffffff'
}

function mixHex(first: string, second: string, amount: number): string {
  const [fromRed, fromGreen, fromBlue] = hexChannels(first)
  const [toRed, toGreen, toBlue] = hexChannels(second)
  const mix = (from: number, to: number) => Math.round(from + (to - from) * amount)
  const channels = [mix(fromRed, toRed), mix(fromGreen, toGreen), mix(fromBlue, toBlue)]
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

export function applyBrandColor(tokens: ThemeModeTokens, brand: string): ThemeModeTokens {
  if (!isHexColor(brand)) throw new Error('Brand color must be a six-digit hex value.')
  const foreground = readableForeground(brand)
  const lightMode = relativeLuminance(tokens.background) > 0.5
  return {
    ...tokens,
    primary: brand,
    'primary-foreground': foreground,
    ring: brand,
    'sidebar-primary': brand,
    'sidebar-primary-foreground': foreground,
    'chart-1': brand,
    'chart-2': mixHex(brand, lightMode ? '#000000' : '#ffffff', 0.16),
    'chart-3': mixHex(brand, lightMode ? '#000000' : '#ffffff', 0.3),
    'chart-4': mixHex(brand, lightMode ? '#ffffff' : '#000000', 0.22),
    'chart-5': mixHex(brand, lightMode ? '#ffffff' : '#000000', 0.38),
  }
}

export function applyCanvasColor(tokens: ThemeModeTokens, canvas: string): ThemeModeTokens {
  if (!isHexColor(canvas)) throw new Error('Canvas color must be a six-digit hex value.')
  return { ...tokens, background: canvas, foreground: readableForeground(canvas) }
}

export function applySurfaceColor(tokens: ThemeModeTokens, surface: string): ThemeModeTokens {
  if (!isHexColor(surface)) throw new Error('Surface color must be a six-digit hex value.')
  const foreground = readableForeground(surface)
  return {
    ...tokens,
    card: surface,
    'card-foreground': foreground,
    popover: surface,
    'popover-foreground': foreground,
  }
}

export function applyRadius(tokens: ThemeModeTokens, pixels: number): ThemeModeTokens {
  if (!Number.isFinite(pixels) || pixels < 0 || pixels > 24) {
    throw new Error('Radius must be between 0 and 24 pixels.')
  }
  return { ...tokens, radius: `${pixels / 16}rem` }
}

export function applyDepth(tokens: ThemeModeTokens, depth: ThemeDepth): ThemeModeTokens {
  return { ...tokens, ...depthRecipes[depth] }
}

export function getThemeDepth(tokens: ThemeModeTokens): ThemeDepth {
  return (
    themeDepths.find(
      (depth) =>
        tokens['shadow-card'] === depthRecipes[depth]['shadow-card'] &&
        tokens['shadow-overlay'] === depthRecipes[depth]['shadow-overlay'],
    ) ?? 'flat'
  )
}

export function isThemeModeTokens(value: unknown): value is ThemeModeTokens {
  if (value == null || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    themeColorTokenNames.every(
      (name) => typeof candidate[name] === 'string' && isHexColor(candidate[name]),
    ) &&
    typeof candidate.radius === 'string' &&
    /^(?:0|\d+(?:\.\d+)?)rem$/.test(candidate.radius) &&
    typeof candidate['shadow-card'] === 'string' &&
    typeof candidate['shadow-overlay'] === 'string' &&
    themeDepths.some(
      (depth) =>
        candidate['shadow-card'] === depthRecipes[depth]['shadow-card'] &&
        candidate['shadow-overlay'] === depthRecipes[depth]['shadow-overlay'],
    )
  )
}
