import {
  getThemePreset,
  isThemeModeTokens,
  type ThemeMode,
  type ThemeModeTokens,
  type ThemePreset,
  type TypographyPackName,
  typographyPacks,
} from '@micropreneur/elements/themes'

export interface ThemeDraft {
  basePresetName: string
  dark: ThemeModeTokens
  light: ThemeModeTokens
  typography: TypographyPackName
}

export interface ThemeHistory {
  future: ThemeDraft[]
  past: ThemeDraft[]
  present: ThemeDraft
}

function cloneTokens(tokens: ThemeModeTokens): ThemeModeTokens {
  return { ...tokens }
}

export function draftFromPreset(preset: ThemePreset): ThemeDraft {
  return {
    basePresetName: preset.name,
    light: cloneTokens(preset.light),
    dark: cloneTokens(preset.dark),
    typography: preset.typography,
  }
}

export function draftAsPreset(draft: ThemeDraft): ThemePreset {
  const base = getThemePreset(draft.basePresetName)
  if (base == null) throw new Error(`Unknown base theme: ${draft.basePresetName}`)
  return {
    ...base,
    title: isDraftModified(draft) ? `${base.title} Custom` : base.title,
    light: cloneTokens(draft.light),
    dark: cloneTokens(draft.dark),
    typography: draft.typography,
  }
}

export function createThemeHistory(preset: ThemePreset): ThemeHistory {
  return { past: [], present: draftFromPreset(preset), future: [] }
}

export function updateThemeHistory(
  history: ThemeHistory,
  update: (draft: ThemeDraft) => ThemeDraft,
): ThemeHistory {
  const next = update(history.present)
  if (JSON.stringify(next) === JSON.stringify(history.present)) return history
  return { past: [...history.past, history.present], present: next, future: [] }
}

export function updateThemeMode(
  history: ThemeHistory,
  mode: ThemeMode,
  update: (tokens: ThemeModeTokens) => ThemeModeTokens,
): ThemeHistory {
  return updateThemeHistory(history, (draft) => ({
    ...draft,
    [mode]: update(draft[mode]),
  }))
}

export function undoThemeHistory(history: ThemeHistory): ThemeHistory {
  const previous = history.past.at(-1)
  if (previous == null) return history
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  }
}

export function redoThemeHistory(history: ThemeHistory): ThemeHistory {
  const next = history.future[0]
  if (next == null) return history
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  }
}

export function replaceThemeHistory(preset: ThemePreset): ThemeHistory {
  return createThemeHistory(preset)
}

export function resetThemeHistory(history: ThemeHistory): ThemeHistory {
  const base = getThemePreset(history.present.basePresetName)
  return base == null ? history : updateThemeHistory(history, () => draftFromPreset(base))
}

export function isDraftModified(draft: ThemeDraft): boolean {
  const base = getThemePreset(draft.basePresetName)
  if (base == null) return true
  return (
    draft.typography !== base.typography ||
    JSON.stringify(draft.light) !== JSON.stringify(base.light) ||
    JSON.stringify(draft.dark) !== JSON.stringify(base.dark)
  )
}

export function serializeThemeDraft(draft: ThemeDraft): string {
  return JSON.stringify(draft)
}

export function parseThemeDraft(value: string | null): ThemeDraft | undefined {
  if (value == null) return undefined
  try {
    const candidate = JSON.parse(value) as Partial<ThemeDraft>
    if (
      typeof candidate.basePresetName !== 'string' ||
      getThemePreset(candidate.basePresetName) == null ||
      !isThemeModeTokens(candidate.light) ||
      !isThemeModeTokens(candidate.dark) ||
      !typographyPacks.some((pack) => pack.name === candidate.typography)
    ) {
      return undefined
    }
    return candidate as ThemeDraft
  } catch {
    return undefined
  }
}

export function radiusPixels(tokens: ThemeModeTokens): number {
  return Number.parseFloat(tokens.radius) * 16
}
