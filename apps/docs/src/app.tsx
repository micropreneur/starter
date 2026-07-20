import { EmptyState } from '@micropreneur/elements'
import { type ElementMetadata, elementCatalog } from '@micropreneur/elements/catalog'
import { defaultThemePreset, type ThemeMode, toThemeStyle } from '@micropreneur/elements/themes'
import { Button } from '@micropreneur/ui/components/button'
import { Input } from '@micropreneur/ui/components/input'
import { ToggleGroup, ToggleGroupItem } from '@micropreneur/ui/components/toggle-group'
import { cn } from '@micropreneur/ui/lib/utils'
import { CheckIcon, CopyIcon, MoonIcon, SearchIcon, SunIcon } from 'lucide-react'
import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import {
  countByOntology,
  filterCatalog,
  isOntologyFilter,
  type OntologyFilter,
  ontologyFilters,
} from './catalog-state'
import { elementPageHref, getElementsRegistryOrigin } from './lib/elements'
import { ElementPreview } from './previews'
import { ThemeLab } from './theme-lab'
import {
  createThemeHistory,
  draftAsPreset,
  parseThemeDraft,
  serializeThemeDraft,
  type ThemeHistory,
} from './theme-state'

const registryCommand = 'pnpm --filter docs registry:stage && pnpm --filter docs dev'

function initialThemeHistory(): ThemeHistory {
  const storedDraft = parseThemeDraft(window.localStorage.getItem('elements-theme-draft'))
  if (storedDraft != null) {
    return { past: [], present: storedDraft, future: [] }
  }
  return createThemeHistory(defaultThemePreset)
}

function selectedNameFromHash() {
  const match = window.location.hash.match(/^#\/components\/([a-z0-9-]+)$/)
  return match?.[1] ?? null
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value)
}

function InstallCommand({
  command,
  copied,
  onCopy,
}: {
  command: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-card p-1.5 shadow-card">
      <code className="min-w-0 flex-1 overflow-x-auto px-2 py-1 font-mono text-xs text-card-foreground">
        <span aria-hidden className="mr-2 text-muted-foreground">
          $
        </span>
        {command}
      </code>
      <Button
        aria-label={copied ? 'Copied' : 'Copy command'}
        onClick={onCopy}
        size="sm"
        type="button"
        variant="outline"
      >
        {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  )
}

function ElementCard({
  copied,
  item,
  onCopy,
  previewStyle,
  selected,
}: {
  copied: boolean
  item: ElementMetadata
  onCopy: () => void
  previewStyle: CSSProperties
  selected: boolean
}) {
  return (
    <article
      className={cn(
        'flex h-full scroll-mt-28 flex-col overflow-hidden rounded-xl border bg-card shadow-card',
        selected && 'border-primary ring-3 ring-primary/15',
      )}
      id={`element-${item.name}`}
    >
      <div
        className="preview-grid flex min-h-64 flex-1 items-center justify-center overflow-auto bg-background p-5 sm:p-7"
        style={previewStyle}
      >
        <ElementPreview name={item.name} />
      </div>
      <div className="flex min-h-36 flex-col border-t px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h2 className="text-base font-medium tracking-[-0.01em] text-card-foreground">
                <a
                  className="rounded-sm outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
                  href={`#/components/${item.name}`}
                >
                  {item.title}
                </a>
              </h2>
              <span className="font-mono text-[0.6875rem] text-primary">{item.ontology}</span>
              <span className="font-mono text-[0.6875rem] text-muted-foreground">{item.kind}</span>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </div>
          <span className="shrink-0 font-mono text-[0.6875rem] text-muted-foreground">
            {item.dependencies.length} deps
          </span>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <p className="truncate font-mono text-[0.6875rem] text-muted-foreground">
            {item.dependencies.length === 0
              ? 'No runtime dependencies'
              : item.dependencies.join(' · ')}
          </p>
          <div className="flex items-center gap-1">
            <Button
              aria-label={
                copied
                  ? `Copied install command for ${item.title}`
                  : `Copy install command for ${item.title}`
              }
              onClick={onCopy}
              size="sm"
              type="button"
              variant="ghost"
            >
              {copied ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <CopyIcon data-icon="inline-start" />
              )}
              {copied ? 'Copied' : 'Copy install'}
            </Button>
            <a
              className="rounded-md px-2 py-1 text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              href={elementPageHref(item)}
            >
              Docs
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}

export function ElementsCatalogApp({
  onThemeChange,
  pageActions,
  theme,
}: {
  onThemeChange: (theme: ThemeMode) => void
  pageActions?: ReactNode
  theme: ThemeMode
}) {
  const registryOrigin = getElementsRegistryOrigin()
  const [query, setQuery] = useState('')
  const [ontology, setOntology] = useState<OntologyFilter>('All')
  const [themeHistory, setThemeHistory] = useState<ThemeHistory>(initialThemeHistory)
  const [copied, setCopied] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string | null>(selectedNameFromHash)
  const searchRef = useRef<HTMLInputElement>(null)

  const visibleItems = useMemo(
    () => filterCatalog(elementCatalog, query, ontology),
    [ontology, query],
  )
  const activeTheme = useMemo(() => draftAsPreset(themeHistory.present), [themeHistory.present])
  const previewStyle = useMemo(
    () => toThemeStyle(activeTheme, theme) as CSSProperties,
    [activeTheme, theme],
  )

  useEffect(() => {
    window.localStorage.setItem('elements-theme-draft', serializeThemeDraft(themeHistory.present))
  }, [themeHistory.present])

  useEffect(() => {
    const onHashChange = () => {
      const nextName = selectedNameFromHash()
      setSelectedName(nextName)
      if (nextName != null) {
        window.requestAnimationFrame(() => {
          document.getElementById(`element-${nextName}`)?.scrollIntoView({ block: 'start' })
        })
      }
    }

    onHashChange()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement

      if (
        (!isTyping && event.key === '/') ||
        ((event.metaKey || event.ctrlKey) && event.key === 'k')
      ) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const copy = async (key: string, value: string) => {
    try {
      await copyText(value)
      setCopied(key)
      window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1600)
    } catch {
      setCopied(null)
    }
  }

  const selectOntology = (value: OntologyFilter) => {
    setOntology(value)
    document.getElementById('catalog')?.scrollIntoView({ block: 'start' })
  }

  return (
    <main className="min-w-0 border-r border-border/70 xl:col-span-2">
      <div className="mx-auto w-full max-w-[100rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="grid gap-8 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.75fr)] lg:items-end">
          <div>
            <div className="mb-5 flex justify-end lg:hidden">{pageActions}</div>
            <h1 className="text-display max-w-[13ch]">Own the interface.</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Source-delivered components and complete application blocks for products you intend to
              keep.
            </p>
          </div>
          <div className="flex flex-col gap-3" id="install">
            <div className="hidden justify-end lg:flex">{pageActions}</div>
            <p className="label-caps text-muted-foreground">Start the local registry</p>
            <InstallCommand
              command={registryCommand}
              copied={copied === 'registry'}
              onCopy={() => void copy('registry', registryCommand)}
            />
          </div>
        </section>

        <section className="scroll-mt-6 pt-6" id="catalog">
          <div className="sticky top-15 z-10 -mx-2 flex flex-col gap-3 bg-background/95 px-2 pb-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="relative flex min-w-0 flex-1 items-center">
                <SearchIcon aria-hidden className="absolute ml-2.5 size-4 text-muted-foreground" />
                <Input
                  aria-label="Search elements"
                  className="h-9 pl-9 pr-16"
                  onChange={(event) => setQuery(event.currentTarget.value)}
                  placeholder="Search elements"
                  ref={searchRef}
                  type="search"
                  value={query}
                />
                <kbd className="pointer-events-none absolute right-3 hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted-foreground sm:block">
                  ⌘K
                </kbd>
              </div>
              <ThemeLab
                colorMode={theme}
                copied={copied}
                history={themeHistory}
                onColorModeChange={onThemeChange}
                onCopy={(key, value) => void copy(key, value)}
                onHistoryChange={setThemeHistory}
                registryOrigin={registryOrigin}
              />
            </div>
            <div className="docs-scrollbar overflow-x-auto pb-1">
              <ToggleGroup
                aria-label="Filter elements by ontology"
                onValueChange={(values) => {
                  const value = values[0]
                  if (value != null && isOntologyFilter(value)) selectOntology(value)
                }}
                spacing={1}
                value={[ontology]}
                variant="outline"
              >
                {ontologyFilters.map((filter) => (
                  <ToggleGroupItem aria-label={filter} key={filter} value={filter}>
                    {filter}
                    <span className="font-mono text-[0.625rem] text-muted-foreground">
                      {countByOntology(elementCatalog, filter)}
                    </span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <p aria-live="polite" className="text-xs text-muted-foreground">
              Showing {visibleItems.length} of {elementCatalog.length} free elements
            </p>
          </div>

          {visibleItems.length > 0 ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {visibleItems.map((item) => (
                <ElementCard
                  copied={copied === item.name}
                  item={item}
                  key={item.name}
                  onCopy={() =>
                    void copy(
                      item.name,
                      `pnpm dlx shadcn@latest add ${registryOrigin}/r/${item.name}.json`,
                    )
                  }
                  previewStyle={previewStyle}
                  selected={selectedName === item.name}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              action={
                <Button
                  onClick={() => {
                    setQuery('')
                    setOntology('All')
                  }}
                  type="button"
                  variant="outline"
                >
                  Clear search
                </Button>
              }
              className="mt-5 min-h-80"
              description="Try another term or return to the complete catalog."
              title="No elements found"
            />
          )}
        </section>

        <footer className="mt-12 flex flex-col gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Public MIT-licensed source from micropreneur/starter.</p>
          <div className="flex items-center gap-2">
            <a className="hover:text-foreground hover:underline" href="/llms.txt">
              llms.txt
            </a>
            <Button
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </Button>
          </div>
        </footer>
      </div>
    </main>
  )
}
