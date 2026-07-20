import { defaultThemePreset } from '@micropreneur/elements/themes'
import { describe, expect, it } from 'vitest'

import {
  createThemeHistory,
  draftAsPreset,
  isDraftModified,
  parseThemeDraft,
  radiusPixels,
  redoThemeHistory,
  resetThemeHistory,
  serializeThemeDraft,
  undoThemeHistory,
  updateThemeHistory,
  updateThemeMode,
} from './theme-state'

describe('theme editor state', () => {
  const starter = defaultThemePreset

  it('tracks undo, redo, and reset without mutating the preset', () => {
    const initial = createThemeHistory(starter)
    const edited = updateThemeMode(initial, 'light', (tokens) => ({
      ...tokens,
      primary: '#7c3aed',
    }))
    expect(edited.present.light.primary).toBe('#7c3aed')
    expect(starter.light.primary).not.toBe('#7c3aed')
    expect(undoThemeHistory(edited).present.light.primary).toBe(starter.light.primary)
    expect(redoThemeHistory(undoThemeHistory(edited)).present.light.primary).toBe('#7c3aed')
    expect(resetThemeHistory(edited).present.light.primary).toBe(starter.light.primary)
  })

  it('tracks typography and reports a custom draft', () => {
    const history = updateThemeHistory(createThemeHistory(starter), (draft) => ({
      ...draft,
      typography: 'system',
    }))
    expect(isDraftModified(history.present)).toBe(true)
    expect(draftAsPreset(history.present).title).toContain('Custom')
  })

  it('round-trips validated local state and rejects tampering', () => {
    const draft = createThemeHistory(starter).present
    expect(parseThemeDraft(serializeThemeDraft(draft))).toEqual(draft)
    expect(parseThemeDraft('{')).toBeUndefined()
    expect(
      parseThemeDraft(
        JSON.stringify({
          ...draft,
          light: { ...draft.light, primary: 'url(https://tracker.invalid)' },
        }),
      ),
    ).toBeUndefined()
  })

  it('converts rem radius to the editor pixel scale', () => {
    expect(radiusPixels(starter.light)).toBe(10)
  })
})
