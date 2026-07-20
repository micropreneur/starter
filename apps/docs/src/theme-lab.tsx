import {
  applyBrandColor,
  applyCanvasColor,
  applyDepth,
  applyRadius,
  applySurfaceColor,
  contrastRatio,
  defaultThemePreset,
  getThemeDepth,
  getThemePreset,
  type ThemeDepth,
  type ThemeMode,
  type TypographyPackName,
  themeCatalog,
  themeDepths,
  themeToCss,
  toThemeRegistryItem,
  typographyPacks,
} from '@micropreneur/elements/themes'
import { Button } from '@micropreneur/ui/components/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@micropreneur/ui/components/field'
import { Input } from '@micropreneur/ui/components/input'
import { NativeSelect, NativeSelectOption } from '@micropreneur/ui/components/native-select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@micropreneur/ui/components/sheet'
import { Slider } from '@micropreneur/ui/components/slider'
import { ToggleGroup, ToggleGroupItem } from '@micropreneur/ui/components/toggle-group'
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  MoonIcon,
  Redo2Icon,
  RotateCcwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  SunIcon,
  Undo2Icon,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  draftAsPreset,
  isDraftModified,
  radiusPixels,
  redoThemeHistory,
  replaceThemeHistory,
  resetThemeHistory,
  type ThemeHistory,
  undoThemeHistory,
  updateThemeHistory,
  updateThemeMode,
} from './theme-state'

interface ThemeLabProps {
  colorMode: ThemeMode
  copied: string | null
  history: ThemeHistory
  onColorModeChange: (mode: ThemeMode) => void
  onCopy: (key: string, value: string) => void
  onHistoryChange: (history: ThemeHistory) => void
  registryOrigin: string
}

function ThemeSwatches({ swatches }: { swatches: readonly [string, string, string] }) {
  return (
    <span aria-hidden className="flex -space-x-1">
      {swatches.map((color) => (
        <span
          className="size-4 rounded-full border border-background ring-1 ring-border"
          key={color}
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  )
}

function ColorControl({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <Field orientation="horizontal">
      <FieldLabel className="min-w-20" htmlFor={`theme-${label.toLowerCase()}`}>
        {label}
      </FieldLabel>
      <div className="ml-auto flex items-center gap-2">
        <Input
          aria-label={`${label} color`}
          className="size-8 cursor-pointer p-1"
          id={`theme-${label.toLowerCase()}`}
          onChange={(event) => onChange(event.currentTarget.value)}
          type="color"
          value={value}
        />
        <code className="w-20 rounded-md border bg-muted px-2 py-1 text-center text-xs text-muted-foreground">
          {value}
        </code>
      </div>
    </Field>
  )
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

export function ThemeLab({
  colorMode,
  copied,
  history,
  onColorModeChange,
  onCopy,
  onHistoryChange,
  registryOrigin,
}: ThemeLabProps) {
  const [query, setQuery] = useState('')
  const draft = history.present
  const activeTheme = draftAsPreset(draft)
  const baseTheme = getThemePreset(draft.basePresetName) ?? defaultThemePreset
  const tokens = draft[colorMode]
  const modified = isDraftModified(draft)
  const installCommand = `pnpm dlx shadcn@latest add ${registryOrigin}/r/${baseTheme.registryName}.json`
  const themeCss = themeToCss(activeTheme)
  const customRegistryItem = {
    ...toThemeRegistryItem(activeTheme),
    name: `theme-${baseTheme.name}-custom`,
    title: `${baseTheme.title} Custom`,
  }
  const visibleThemes = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return themeCatalog
    return themeCatalog.filter((theme) =>
      [theme.title, theme.description, theme.source].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    )
  }, [query])

  const updateMode = (update: Parameters<typeof updateThemeMode>[2]) => {
    onHistoryChange(updateThemeMode(history, colorMode, update))
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button aria-label={`Customize ${activeTheme.title}`} type="button" variant="outline" />
        }
      >
        <ThemeSwatches swatches={baseTheme.swatches} />
        <span className="max-w-28 truncate">{activeTheme.title}</span>
        <SlidersHorizontalIcon data-icon="inline-end" />
      </SheetTrigger>
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>Theme Lab</SheetTitle>
          <SheetDescription>
            Preview a free preset, then tune it locally and export owned source.
          </SheetDescription>
        </SheetHeader>

        <div className="docs-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
          <ToggleGroup
            aria-label="Preview color mode"
            className="w-full"
            onValueChange={(values) => {
              const value = values[0]
              if (value === 'light' || value === 'dark') onColorModeChange(value)
            }}
            spacing={0}
            value={[colorMode]}
            variant="outline"
          >
            <ToggleGroupItem className="flex-1" value="light">
              <SunIcon data-icon="inline-start" />
              Light
            </ToggleGroupItem>
            <ToggleGroupItem className="flex-1" value="dark">
              <MoonIcon data-icon="inline-start" />
              Dark
            </ToggleGroupItem>
          </ToggleGroup>

          <section className="flex flex-col gap-3" aria-labelledby="theme-presets-title">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium" id="theme-presets-title">
                  Presets
                </h3>
                <p className="text-xs text-muted-foreground">
                  Six complete light and dark token sets.
                </p>
              </div>
              <Button
                disabled={draft.basePresetName === defaultThemePreset.name && !modified}
                onClick={() => onHistoryChange(replaceThemeHistory(defaultThemePreset))}
                className="h-7 px-2 text-xs"
                size="sm"
                type="button"
                variant="ghost"
              >
                Reset to Starter
              </Button>
            </div>
            <div className="relative flex items-center">
              <SearchIcon aria-hidden className="absolute left-2.5 size-4 text-muted-foreground" />
              <Input
                aria-label="Search themes"
                className="pl-9"
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Search themes"
                type="search"
                value={query}
              />
            </div>
            {visibleThemes.length > 0 ? (
              <ToggleGroup
                aria-label="Choose a theme preset"
                className="w-full"
                onValueChange={(values) => {
                  const name = values[0]
                  const preset = name == null ? undefined : getThemePreset(name)
                  if (preset != null) onHistoryChange(replaceThemeHistory(preset))
                }}
                orientation="vertical"
                spacing={1}
                value={[draft.basePresetName]}
                variant="outline"
              >
                {visibleThemes.map((theme) => (
                  <ToggleGroupItem
                    className="h-auto w-full justify-start px-3 py-2 text-left"
                    key={theme.name}
                    value={theme.name}
                  >
                    <ThemeSwatches swatches={theme.swatches} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{theme.title}</span>
                      <span className="block truncate text-[0.6875rem] font-normal text-muted-foreground">
                        {theme.source === 'tweakcn' ? 'TweakCN · Apache-2.0' : 'Micropreneur · MIT'}
                      </span>
                    </span>
                    {draft.basePresetName === theme.name ? <CheckIcon /> : null}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No themes match “{query}”.
              </p>
            )}
          </section>

          <section
            className="flex flex-col gap-4 border-t pt-5"
            aria-labelledby="theme-colors-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium" id="theme-colors-title">
                  Colors
                </h3>
                <p className="text-xs text-muted-foreground">
                  Editing the {colorMode} token set only.
                </p>
              </div>
              <span className="rounded-full bg-muted px-2 py-1 font-mono text-[0.625rem] text-muted-foreground">
                {contrastRatio(tokens.primary, tokens['primary-foreground']).toFixed(1)}:1
              </span>
            </div>
            <FieldGroup className="gap-3">
              <ColorControl
                label="Brand"
                onChange={(value) => updateMode((current) => applyBrandColor(current, value))}
                value={tokens.primary}
              />
              <ColorControl
                label="Canvas"
                onChange={(value) => updateMode((current) => applyCanvasColor(current, value))}
                value={tokens.background}
              />
              <ColorControl
                label="Surface"
                onChange={(value) => updateMode((current) => applySurfaceColor(current, value))}
                value={tokens.card}
              />
            </FieldGroup>
          </section>

          <section
            className="flex flex-col gap-4 border-t pt-5"
            aria-labelledby="theme-shape-title"
          >
            <div>
              <h3 className="text-sm font-medium" id="theme-shape-title">
                Shape and depth
              </h3>
              <p className="text-xs text-muted-foreground">
                Constrained recipes keep output valid.
              </p>
            </div>
            <FieldGroup>
              <Field>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel>Radius</FieldLabel>
                  <span className="font-mono text-xs text-muted-foreground">
                    {radiusPixels(tokens).toFixed(0)}px
                  </span>
                </div>
                <Slider
                  aria-label="Corner radius"
                  max={24}
                  min={0}
                  onValueChange={(value) =>
                    updateMode((current) => applyRadius(current, value as number))
                  }
                  step={1}
                  value={radiusPixels(tokens)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="theme-depth">Depth</FieldLabel>
                <NativeSelect
                  className="w-full"
                  id="theme-depth"
                  onChange={(event) =>
                    updateMode((current) =>
                      applyDepth(current, event.currentTarget.value as ThemeDepth),
                    )
                  }
                  value={getThemeDepth(tokens)}
                >
                  {themeDepths.map((depth) => (
                    <NativeSelectOption key={depth} value={depth}>
                      {depth[0]?.toUpperCase()}
                      {depth.slice(1)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </FieldGroup>
          </section>

          <section className="flex flex-col gap-4 border-t pt-5" aria-labelledby="theme-type-title">
            <div>
              <h3 className="text-sm font-medium" id="theme-type-title">
                Typography
              </h3>
              <p className="text-xs text-muted-foreground">
                Local system stacks with no runtime font request.
              </p>
            </div>
            <Field>
              <FieldLabel htmlFor="theme-typography">Type recipe</FieldLabel>
              <NativeSelect
                className="w-full"
                id="theme-typography"
                onChange={(event) =>
                  onHistoryChange(
                    updateThemeHistory(history, (current) => ({
                      ...current,
                      typography: event.currentTarget.value as TypographyPackName,
                    })),
                  )
                }
                value={draft.typography}
              >
                {typographyPacks.map((pack) => (
                  <NativeSelectOption key={pack.name} value={pack.name}>
                    {pack.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldDescription>
                {typographyPacks.find((pack) => pack.name === draft.typography)?.description}
              </FieldDescription>
            </Field>
          </section>
        </div>

        <SheetFooter className="border-t">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                aria-label="Undo theme change"
                disabled={history.past.length === 0}
                onClick={() => onHistoryChange(undoThemeHistory(history))}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <Undo2Icon />
              </Button>
              <Button
                aria-label="Redo theme change"
                disabled={history.future.length === 0}
                onClick={() => onHistoryChange(redoThemeHistory(history))}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <Redo2Icon />
              </Button>
              <Button
                aria-label="Reset selected theme"
                disabled={!modified}
                onClick={() => onHistoryChange(resetThemeHistory(history))}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <RotateCcwIcon />
              </Button>
            </div>
            <Button
              onClick={() => onCopy('theme-install', installCommand)}
              size="sm"
              type="button"
              variant="outline"
            >
              {copied === 'theme-install' ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <CopyIcon data-icon="inline-start" />
              )}
              {copied === 'theme-install' ? 'Copied' : 'Preset install'}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => onCopy('theme-css', themeCss)} type="button" variant="outline">
              {copied === 'theme-css' ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <CopyIcon data-icon="inline-start" />
              )}
              {copied === 'theme-css' ? 'Copied CSS' : 'Copy CSS'}
            </Button>
            <Button
              onClick={() => downloadJson(`${customRegistryItem.name}.json`, customRegistryItem)}
              type="button"
            >
              <DownloadIcon data-icon="inline-start" />
              Download JSON
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
