import type { ElementMetadata, ElementOntology } from '@micropreneur/elements/catalog'
import { Badge } from '@micropreneur/ui/components/badge'
import { Button } from '@micropreneur/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@micropreneur/ui/components/dropdown-menu'
import { Input } from '@micropreneur/ui/components/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@micropreneur/ui/components/sheet'
import { cn } from '@micropreneur/ui/lib/utils'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BlocksIcon,
  BotIcon,
  CheckIcon,
  ChevronDownIcon,
  CloudIcon,
  CopyIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GitForkIcon,
  MenuIcon,
  MessageCircleIcon,
  MoonIcon,
  PlugIcon,
  RocketIcon,
  SearchIcon,
  SparklesIcon,
  SunIcon,
  TerminalIcon,
  XIcon,
} from 'lucide-react'
import {
  type ComponentPropsWithoutRef,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { ElementsCatalogApp } from './app'
import { docsMdxComponents, ElementShowcase } from './docs-content'
import {
  type DocGroup,
  type DocPage,
  docGroups,
  getAdjacentPages,
  getDocPage,
  getPagesByGroup,
  pageHref,
  searchDocs,
} from './lib/docs'
import {
  elementOntologies,
  elementPageHref,
  elementSections,
  elementSourcePath,
  getAdjacentElements,
  getElementPage,
  getElementsByOntology,
  getElementsRegistryOrigin,
  getFirstElementPage,
  searchElements,
} from './lib/elements'
import { navigateTo, usePathname } from './lib/navigation'

const groupIcons = {
  'Getting started': RocketIcon,
  Integrations: PlugIcon,
  Cloudflare: CloudIcon,
  Elements: BlocksIcon,
  Agents: BotIcon,
} satisfies Record<DocGroup, typeof RocketIcon>

async function writeClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    return
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    textarea.remove()
    if (!copied) throw new Error('Clipboard access is unavailable.')
  }
}

function initialTheme() {
  const stored = window.localStorage.getItem('micropreneur-docs-theme')
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function DocsApp() {
  const pathname = usePathname()
  const [theme, setTheme] = useState<'dark' | 'light'>(initialTheme)
  const [searchOpen, setSearchOpen] = useState(false)
  const element = getElementPage(pathname)
  const page = element ? undefined : getDocPage(pathname)
  const isGallery = pathname === '/elements/gallery'
  const isElementsRoute = element != null || isGallery

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('micropreneur-docs-theme', theme)
  }, [theme])

  useEffect(() => {
    document.title = element
      ? `${element.title} — Elements — Micropreneur Starter`
      : page
        ? `${page.title} — Micropreneur Starter`
        : pathname === '/elements/gallery'
          ? 'Elements — Micropreneur Starter'
          : 'Page not found — Micropreneur Starter'
  }, [element, page, pathname])

  useEffect(() => {
    if (isGallery) return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement

      if (
        (!typing && event.key === '/') ||
        ((event.metaKey || event.ctrlKey) && event.key === 'k')
      ) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isGallery])

  return (
    <div className="min-h-svh bg-background text-foreground">
      <DocsHeader
        onSearch={() => setSearchOpen(true)}
        onThemeChange={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
        element={element}
        pathname={pathname}
        theme={theme}
      />

      <div className="docs-layout">
        {isElementsRoute ? (
          <ElementNavigation className="docs-left-rail" element={element} />
        ) : (
          <DocsNavigation className="docs-left-rail" pathname={pathname} />
        )}
        {element ? (
          <ElementArticle element={element} rawHref={element.docsPath} />
        ) : isGallery ? (
          <ElementsCatalogApp
            onThemeChange={setTheme}
            pageActions={<AgentPageMenu rawHref="/elements/gallery.md" />}
            theme={theme}
          />
        ) : page ? (
          <DocsArticle page={page} rawHref={`/${page.path}.md`} />
        ) : (
          <DocsNotFound />
        )}
        {element ? (
          <DocsOutline
            page={{ sections: elementSections, sourcePath: elementSourcePath(element) }}
            sourceLabel="Component source"
          />
        ) : page ? (
          <DocsOutline page={page} />
        ) : isGallery ? null : (
          <div className="docs-right-rail" />
        )}
      </div>

      <SearchDialog onOpenChange={setSearchOpen} open={searchOpen} />
    </div>
  )
}

function DocsHeader({
  element,
  onSearch,
  onThemeChange,
  pathname,
  theme,
}: {
  element?: ElementMetadata
  onSearch: () => void
  onThemeChange: () => void
  pathname: string
  theme: 'dark' | 'light'
}) {
  return (
    <header className="docs-header sticky top-0 z-40 flex h-15 items-center border-b bg-background/95 px-3 backdrop-blur sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNavigation element={element} pathname={pathname} />
        <DocsAnchor className="flex min-w-0 items-center gap-2" href="/">
          <span className="truncate text-xl font-semibold tracking-[-0.02em]">Micropreneur</span>
          <Badge
            className="bg-muted font-mono text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground"
            variant="outline"
          >
            Docs
          </Badge>
        </DocsAnchor>
      </div>

      <button
        className="ml-4 hidden h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border bg-muted/35 px-3 text-left text-sm text-muted-foreground outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/40 sm:flex lg:absolute lg:left-1/2 lg:ml-0 lg:w-[min(42rem,46vw)] lg:-translate-x-1/2"
        onClick={onSearch}
        type="button"
      >
        <SearchIcon aria-hidden className="size-4" />
        <span>Search documentation</span>
        <kbd className="ml-auto rounded border bg-background px-1.5 py-0.5 font-mono text-[0.625rem]">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Button
          aria-label="Search documentation"
          className="sm:hidden"
          onClick={onSearch}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <SearchIcon />
        </Button>
        <Button
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          onClick={onThemeChange}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </Button>
        <Button
          nativeButton={false}
          render={
            <a href="https://github.com/micropreneur/starter" rel="noreferrer" target="_blank" />
          }
          size="icon-sm"
          variant="ghost"
        >
          <GitForkIcon />
          <span className="sr-only">View Starter on GitHub</span>
        </Button>
      </div>
    </header>
  )
}

function DocsNavigation({
  className,
  onNavigate,
  pathname,
}: {
  className?: string
  onNavigate?: () => void
  pathname: string
}) {
  const firstElement = getFirstElementPage()

  return (
    <aside className={cn('docs-scrollbar overflow-y-auto', className)}>
      <nav aria-label="Documentation" className="space-y-7 px-4 py-6">
        {docGroups.map((group) => {
          const Icon = groupIcons[group]
          return (
            <section key={group}>
              <div className="mb-2 flex items-center gap-2 px-2 text-xs font-medium text-foreground">
                <Icon aria-hidden className="size-3.5 text-muted-foreground" />
                <h2>{group}</h2>
              </div>
              <div className="ml-[0.9375rem] grid gap-0.5 border-l border-border/70 pl-3">
                {getPagesByGroup(group).map((page) => (
                  <DocsAnchor
                    aria-current={getDocPage(pathname)?.path === page.path ? 'page' : undefined}
                    className={cn(
                      'rounded-md px-2 py-1.5 text-[0.8125rem] leading-5 text-muted-foreground outline-none transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40',
                      getDocPage(pathname)?.path === page.path &&
                        'bg-muted font-medium text-foreground',
                    )}
                    href={pageHref(page)}
                    key={page.path}
                    onClick={onNavigate}
                  >
                    {page.title}
                  </DocsAnchor>
                ))}
                {group === 'Elements' && (
                  <>
                    {firstElement && (
                      <DocsAnchor
                        className="rounded-md px-2 py-1.5 text-[0.8125rem] leading-5 text-muted-foreground outline-none transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
                        href={elementPageHref(firstElement)}
                        onClick={onNavigate}
                      >
                        Component reference
                      </DocsAnchor>
                    )}
                    <DocsAnchor
                      className="rounded-md px-2 py-1.5 text-[0.8125rem] leading-5 text-muted-foreground outline-none transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
                      href="/elements/gallery"
                      onClick={onNavigate}
                    >
                      Component gallery
                    </DocsAnchor>
                  </>
                )}
              </div>
            </section>
          )
        })}
      </nav>
    </aside>
  )
}

function ElementNavigation({
  className,
  element,
  onNavigate,
}: {
  className?: string
  element?: ElementMetadata
  onNavigate?: () => void
}) {
  return (
    <aside className={cn('docs-scrollbar overflow-y-auto', className)}>
      <nav aria-label="Elements component reference" className="px-4 py-5">
        <DocsAnchor
          className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
          href="/elements/installing-free"
          onClick={onNavigate}
        >
          <ArrowLeftIcon
            aria-hidden
            className="size-3.5 transition-transform group-hover:-translate-x-0.5"
          />
          Back to documentation
        </DocsAnchor>

        <div className="mt-5 border-y border-border/70 px-2 py-4">
          <div className="flex items-center gap-2">
            <BlocksIcon aria-hidden className="size-4 text-accent" />
            <p className="text-sm font-semibold tracking-[-0.015em]">Elements Free</p>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Public, source-owned registry reference.
          </p>
          <DocsAnchor
            aria-current={element == null ? 'page' : undefined}
            className={cn(
              'mt-3 inline-flex items-center gap-1 rounded-sm text-xs font-medium text-foreground outline-none hover:text-accent focus-visible:ring-3 focus-visible:ring-ring/40',
              element == null && 'text-accent',
            )}
            href="/elements/gallery"
            onClick={onNavigate}
          >
            Open visual gallery
            <ArrowRightIcon aria-hidden className="size-3" />
          </DocsAnchor>
        </div>

        <div className="mt-6 space-y-6">
          {elementOntologies.map((ontology) => (
            <ElementNavigationGroup
              activeName={element?.name}
              key={ontology}
              onNavigate={onNavigate}
              ontology={ontology}
            />
          ))}
        </div>
      </nav>
    </aside>
  )
}

function ElementNavigationGroup({
  activeName,
  onNavigate,
  ontology,
}: {
  activeName?: string
  onNavigate?: () => void
  ontology: ElementOntology
}) {
  const elements = getElementsByOntology(ontology)
  if (elements.length === 0) return null

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3 px-2">
        <h2 className="font-mono text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {ontology}
        </h2>
        <span className="font-mono text-[0.625rem] text-muted-foreground">{elements.length}</span>
      </div>
      <div className="ml-[0.9375rem] grid gap-0.5 border-l border-border/70 pl-3">
        {elements.map((candidate) => (
          <DocsAnchor
            aria-current={activeName === candidate.name ? 'page' : undefined}
            className={cn(
              'rounded-md px-2 py-1.5 text-[0.8125rem] leading-5 text-muted-foreground outline-none transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40',
              activeName === candidate.name && 'bg-muted font-medium text-foreground',
            )}
            href={elementPageHref(candidate)}
            key={candidate.name}
            onClick={onNavigate}
          >
            {candidate.title}
          </DocsAnchor>
        ))}
      </div>
    </section>
  )
}

function MobileNavigation({ element, pathname }: { element?: ElementMetadata; pathname: string }) {
  const [open, setOpen] = useState(false)
  const isElementsRoute = element != null || pathname === '/elements/gallery'

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger
        render={<Button className="lg:hidden" size="icon-sm" type="button" variant="ghost" />}
      >
        <MenuIcon />
        <span className="sr-only">Open documentation navigation</span>
      </SheetTrigger>
      <SheetContent className="w-[19rem] gap-0" side="left">
        <SheetHeader className="border-b">
          <SheetTitle>{isElementsRoute ? 'Elements reference' : 'Micropreneur Docs'}</SheetTitle>
          <SheetDescription>
            {isElementsRoute
              ? 'Browse every public registry item.'
              : 'Build, configure, and ship your fork.'}
          </SheetDescription>
        </SheetHeader>
        {isElementsRoute ? (
          <ElementNavigation
            className="min-h-0 flex-1"
            element={element}
            onNavigate={() => setOpen(false)}
          />
        ) : (
          <DocsNavigation
            className="min-h-0 flex-1"
            onNavigate={() => setOpen(false)}
            pathname={pathname}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function AgentPageMenu({ rawHref }: { rawHref: string }) {
  const [copyStatus, setCopyStatus] = useState<'content' | 'mcp' | 'url' | null>(null)
  const [copyError, setCopyError] = useState<'content' | 'mcp' | 'url' | null>(null)
  const markdownUrl = new URL(rawHref, window.location.origin).href
  const assistantPrompt = `Read ${markdownUrl} so I can ask questions about it.`
  const chatGptHref = `https://chatgpt.com/?hints=search&q=${encodeURIComponent(assistantPrompt)}`
  const claudeHref = `https://claude.ai/new?q=${encodeURIComponent(assistantPrompt)}`
  const mcpUrl = new URL('/mcp', window.location.origin).href

  const copy = async (target: 'content' | 'mcp' | 'url', value: string) => {
    try {
      await writeClipboard(value)
      setCopyError(null)
      setCopyStatus(target)
      window.setTimeout(
        () => setCopyStatus((current) => (current === target ? null : current)),
        1600,
      )
    } catch {
      setCopyError(target)
      setCopyStatus(null)
    }
  }

  const copyPage = async () => {
    try {
      const response = await fetch(rawHref)
      if (!response.ok) throw new Error(`Markdown request failed with ${response.status}.`)
      await copy('content', await response.text())
    } catch {
      setCopyError('content')
      setCopyStatus(null)
    }
  }

  return (
    <div className="shrink-0">
      <DropdownMenu>
        <div className="inline-flex rounded-md shadow-xs">
          <Button
            aria-live="polite"
            className="rounded-r-none border-r-0"
            onClick={() => void copyPage()}
            size="sm"
            type="button"
            variant="outline"
          >
            {copyStatus === 'content' ? <CheckIcon /> : <CopyIcon />}
            {copyStatus === 'content'
              ? 'Copied'
              : copyError === 'content'
                ? 'Retry copy'
                : 'Copy page'}
          </Button>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label="More page actions"
                className="rounded-l-none px-2"
                size="sm"
                type="button"
                variant="outline"
              />
            }
          >
            <ChevronDownIcon aria-hidden className="size-3.5" />
          </DropdownMenuTrigger>
        </div>
        <DropdownMenuContent align="end" className="w-60" sideOffset={8}>
          <DropdownMenuItem onClick={() => void copy('url', markdownUrl)}>
            {copyStatus === 'url' ? <CheckIcon className="text-accent" /> : <CopyIcon />}
            <span>
              {copyStatus === 'url'
                ? 'Markdown URL copied'
                : copyError === 'url'
                  ? 'Retry Markdown copy'
                  : 'Copy Markdown page'}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href={rawHref} rel="noreferrer" target="_blank" />}>
            <FileTextIcon />
            <span>View as Markdown</span>
            <ExternalLinkIcon className="ml-auto size-3" />
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href={chatGptHref} rel="noreferrer" target="_blank" />}>
            <MessageCircleIcon />
            <span>Open in ChatGPT</span>
            <ExternalLinkIcon className="ml-auto size-3" />
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href={claudeHref} rel="noreferrer" target="_blank" />}>
            <SparklesIcon />
            <span>Open in Claude</span>
            <ExternalLinkIcon className="ml-auto size-3" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void copy('mcp', mcpUrl)}>
            {copyStatus === 'mcp' ? <CheckIcon className="text-accent" /> : <CopyIcon />}
            <span>
              {copyStatus === 'mcp'
                ? 'MCP Server URL copied'
                : copyError === 'mcp'
                  ? 'Retry MCP copy'
                  : 'Copy MCP Server URL'}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href="/agents/mcp-server#client-setup" />}>
            <TerminalIcon />
            <span>Add MCP Server</span>
            <ArrowRightIcon className="ml-auto size-3" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function DocsArticle({ page, rawHref }: { page: DocPage; rawHref: string }) {
  const { next, previous } = getAdjacentPages(page)

  return (
    <main className="min-w-0 border-r border-border/70">
      <article className="mx-auto w-full max-w-[56rem] px-5 py-10 sm:px-8 sm:py-14 lg:px-10 xl:px-12">
        <header className="border-b border-border/70 pb-8">
          <div className="flex items-start justify-between gap-4">
            <p className="flex min-w-0 items-center gap-2 font-mono text-[0.6875rem] text-muted-foreground">
              <span className="size-1.5 shrink-0 rounded-full bg-accent" />
              <span className="truncate">{page.sourcePath}</span>
            </p>
            <AgentPageMenu rawHref={rawHref} />
          </div>
          <p className="mt-8 text-sm font-medium text-accent">{page.group}</p>
          <h1 className="mt-2 text-balance text-4xl leading-[1.03] font-semibold tracking-[-0.045em] sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            {page.description}
          </p>
        </header>

        <div className="docs-prose prose prose-neutral mt-9 max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:tracking-[-0.025em] prose-a:font-medium prose-a:text-foreground prose-a:decoration-accent prose-a:decoration-2 prose-a:underline-offset-4 prose-blockquote:border-l-accent prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-th:font-medium">
          <page.Content components={docsMdxComponents} />
        </div>

        <nav
          aria-label="Previous and next articles"
          className="mt-14 grid gap-3 border-t pt-7 sm:grid-cols-2"
        >
          {previous ? (
            <ArticleDirection direction="previous" page={previous} />
          ) : (
            <span aria-hidden />
          )}
          {next && <ArticleDirection direction="next" page={next} />}
        </nav>
      </article>
    </main>
  )
}

function ElementArticle({ element, rawHref }: { element: ElementMetadata; rawHref: string }) {
  const { next, previous } = getAdjacentElements(element)
  const sourcePath = elementSourcePath(element)
  const installCommand = `pnpm dlx shadcn@latest add ${getElementsRegistryOrigin()}/r/${element.name}.json`

  return (
    <main className="min-w-0 border-r border-border/70">
      <article className="mx-auto w-full max-w-[56rem] px-5 py-10 sm:px-8 sm:py-14 lg:px-10 xl:px-12">
        <header className="border-b border-border/70 pb-8">
          <div className="flex items-start justify-between gap-4">
            <p className="flex min-w-0 items-center gap-2 font-mono text-[0.6875rem] text-muted-foreground">
              <span className="size-1.5 shrink-0 rounded-full bg-accent" />
              <span className="truncate">{sourcePath}</span>
            </p>
            <AgentPageMenu rawHref={rawHref} />
          </div>
          <p className="mt-8 text-sm font-medium text-accent">Elements / {element.ontology}</p>
          <h1 className="mt-2 text-balance text-4xl leading-[1.03] font-semibold tracking-[-0.045em] sm:text-5xl">
            {element.title}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            {element.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-muted-foreground">
            <span className="rounded border bg-muted/40 px-2 py-1">Free</span>
            <span className="rounded border bg-muted/40 px-2 py-1">{element.kind}</span>
            <span className="rounded border bg-muted/40 px-2 py-1">{element.registryType}</span>
          </div>
        </header>

        <div className="docs-prose prose prose-neutral mt-9 max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:tracking-[-0.025em] prose-a:font-medium prose-a:text-foreground prose-a:decoration-accent prose-a:decoration-2 prose-a:underline-offset-4 prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-th:font-medium">
          <h2 id="preview">Preview</h2>
          <p>
            This is the real workspace implementation used to verify the public registry source
            before release.
          </p>
          <ElementShowcase name={element.name} showDocsLink={false} />

          <h2 id="installation">Installation</h2>
          <p>Run this command from a Base UI-configured target project:</p>
          <pre className="docs-code-block not-prose overflow-x-auto rounded-xl border border-white/8 bg-[#11151a] p-4 text-[0.8rem] leading-6 text-[#e6edf3] sm:p-5">
            <code className="rounded-none bg-transparent p-0 font-mono text-inherit before:content-none after:content-none">
              {installCommand}
            </code>
          </pre>
          <p>
            The CLI writes source files into the target project. It does not add this workspace
            package as a runtime dependency.
          </p>

          <h2 id="registry-metadata">Registry metadata</h2>
          <div className="not-prose my-7 overflow-x-auto rounded-lg border border-border/70">
            <dl className="min-w-[32rem] divide-y divide-border/70 text-sm">
              <ElementMetadataRow label="Registry item" value={`${element.name}.json`} />
              <ElementMetadataRow label="Type" value={element.registryType} />
              <ElementMetadataRow label="Ontology" value={element.ontology} />
              <ElementMetadataRow label="Tier" value={element.tier} />
              <ElementMetadataRow
                label="Dependencies"
                value={
                  element.dependencies.length > 0
                    ? element.dependencies.join(' · ')
                    : 'No runtime dependencies'
                }
              />
            </dl>
          </div>

          <h2 id="own-the-source">Own the source</h2>
          <p>
            Treat the installed component as product code. Rename its vocabulary, adjust its visual
            treatment, and preserve its keyboard and semantic behavior as the fork evolves.
          </p>
          <p>
            Review all free elements together in the{' '}
            <DocsAnchor href="/elements/gallery">visual gallery</DocsAnchor>, or edit this component
            at <code>{sourcePath}</code>.
          </p>
        </div>

        <nav
          aria-label="Previous and next components"
          className="mt-14 grid gap-3 border-t pt-7 sm:grid-cols-2"
        >
          {previous ? (
            <ElementDirection direction="previous" element={previous} />
          ) : (
            <span aria-hidden />
          )}
          {next && <ElementDirection direction="next" element={next} />}
        </nav>
      </article>
    </main>
  )
}

function ElementMetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-4 px-4 py-3">
      <dt className="font-medium text-foreground">{label}</dt>
      <dd className="font-mono text-xs leading-5 text-muted-foreground">{value}</dd>
    </div>
  )
}

function ElementDirection({
  direction,
  element,
}: {
  direction: 'next' | 'previous'
  element: ElementMetadata
}) {
  const previous = direction === 'previous'
  return (
    <DocsAnchor
      className={cn(
        'group rounded-lg border p-3.5 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/40',
        !previous && 'text-right',
      )}
      href={elementPageHref(element)}
    >
      <span
        className={cn(
          'flex items-center gap-1.5 text-xs text-muted-foreground',
          !previous && 'justify-end',
        )}
      >
        {previous && (
          <ArrowLeftIcon className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
        )}
        {previous ? 'Previous component' : 'Next component'}
        {!previous && (
          <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        )}
      </span>
      <span className="mt-1 block text-sm font-medium">{element.title}</span>
    </DocsAnchor>
  )
}

function ArticleDirection({ direction, page }: { direction: 'next' | 'previous'; page: DocPage }) {
  const previous = direction === 'previous'
  return (
    <DocsAnchor
      className={cn(
        'group rounded-lg border p-3.5 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/40',
        !previous && 'text-right',
      )}
      href={pageHref(page)}
    >
      <span
        className={cn(
          'flex items-center gap-1.5 text-xs text-muted-foreground',
          !previous && 'justify-end',
        )}
      >
        {previous && (
          <ArrowLeftIcon className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
        )}
        {previous ? 'Previous' : 'Next'}
        {!previous && (
          <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        )}
      </span>
      <span className="mt-1 block text-sm font-medium">{page.title}</span>
    </DocsAnchor>
  )
}

function DocsOutline({
  page,
  sourceLabel = 'Article source',
}: {
  page: Pick<DocPage, 'sections' | 'sourcePath'>
  sourceLabel?: string
}) {
  const sectionIds = useMemo(() => page.sections.map((section) => section.id), [page.sections])
  const { activeSection, visibleSections } = useSectionRange(sectionIds)
  const outlineRef = useRef<HTMLOListElement>(null)
  const [indicator, setIndicator] = useState({ height: 0, top: 0 })
  useEffect(() => {
    const outline = outlineRef.current
    const firstSection = visibleSections[0]
    const lastSection = visibleSections.at(-1)
    const firstItem = outline?.querySelector<HTMLElement>(`[data-section-id="${firstSection}"]`)
    const lastItem = outline?.querySelector<HTMLElement>(`[data-section-id="${lastSection}"]`)
    if (!outline || !firstItem || !lastItem) return

    const updateIndicator = () => {
      const top = firstItem.offsetTop
      setIndicator({
        height: lastItem.offsetTop + lastItem.offsetHeight - top,
        top,
      })
    }

    updateIndicator()
    const resizeObserver = new ResizeObserver(updateIndicator)
    resizeObserver.observe(outline)
    return () => resizeObserver.disconnect()
  }, [visibleSections])

  return (
    <aside className="docs-right-rail docs-scrollbar overflow-y-auto px-5 py-8">
      <p className="font-mono text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        On this page
      </p>
      <nav aria-label="Article sections" className="relative mt-3 border-l border-border/70">
        <span
          aria-hidden
          className="docs-outline-indicator absolute -left-px top-0 w-0.5 rounded-full opacity-0 transition-[transform,height,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            height: indicator.height,
            opacity: indicator.height > 0 ? 1 : 0,
            transform: `translate3d(0, ${indicator.top}px, 0)`,
          }}
        />
        <ol className="grid gap-2.5 pl-3 text-xs leading-5" ref={outlineRef}>
          {page.sections.map((section) => (
            <li data-section-id={section.id} key={section.id}>
              <a
                aria-current={activeSection === section.id ? 'location' : undefined}
                className={cn(
                  'block text-muted-foreground transition-[color,transform] duration-300 hover:text-foreground motion-reduce:transition-none',
                  visibleSections.includes(section.id) && 'text-foreground',
                  activeSection === section.id &&
                    'translate-x-0.5 font-medium motion-reduce:translate-x-0',
                )}
                href={`#${section.id}`}
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 border-t pt-5">
        <p className="font-mono text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {sourceLabel}
        </p>
        <a
          className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground transition-colors hover:text-foreground"
          href={`https://github.com/micropreneur/starter/blob/main/${page.sourcePath}`}
          rel="noreferrer"
          target="_blank"
        >
          <GitForkIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>Edit on GitHub</span>
          <ExternalLinkIcon aria-hidden className="mt-0.5 size-3 shrink-0" />
        </a>
      </div>
    </aside>
  )
}

function useSectionRange(sectionIds: readonly string[]) {
  const firstSection = sectionIds[0] ?? ''
  const [sectionRange, setSectionRange] = useState({
    activeSection: firstSection,
    visibleSections: firstSection ? [firstSection] : [],
  })

  useEffect(() => {
    let animationFrame = 0

    const updateSectionRange = () => {
      const firstSection = sectionIds[0]
      if (!firstSection) return

      let nextSection = firstSection
      const readingLine = 112
      const visibleTop = 72
      const visibleBottom = window.innerHeight - 48
      const sectionRects = sectionIds.map((sectionId) => ({
        id: sectionId,
        rect: document.getElementById(sectionId)?.getBoundingClientRect(),
      }))

      for (const section of sectionRects) {
        if (!section.rect || section.rect.top > readingLine) break
        nextSection = section.id
      }

      const reachedPageEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (reachedPageEnd) nextSection = sectionIds.at(-1) ?? nextSection

      const activeIndex = sectionIds.indexOf(nextSection)
      const visibleIndexes = sectionRects.flatMap((section, index) =>
        section.rect && section.rect.bottom >= visibleTop && section.rect.top <= visibleBottom
          ? [index]
          : [],
      )
      const rangeStart = Math.min(activeIndex, ...visibleIndexes)
      const rangeEnd = Math.max(activeIndex, ...visibleIndexes)
      const nextVisibleSections = sectionIds.slice(rangeStart, rangeEnd + 1)

      setSectionRange((current) => {
        const rangeIsUnchanged =
          current.activeSection === nextSection &&
          current.visibleSections.length === nextVisibleSections.length &&
          current.visibleSections.every(
            (sectionId, index) => sectionId === nextVisibleSections[index],
          )

        return rangeIsUnchanged
          ? current
          : { activeSection: nextSection, visibleSections: nextVisibleSections }
      })
    }

    const scheduleUpdate = () => {
      if (animationFrame) return
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0
        updateSectionRange()
      })
    }

    updateSectionRange()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('hashchange', scheduleUpdate)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('hashchange', scheduleUpdate)
    }
  }, [sectionIds])

  return sectionRange
}

function SearchDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const results = useMemo(
    () => [
      ...searchDocs(query).map((page) => ({ kind: 'guide' as const, page })),
      ...searchElements(query).map((element) => ({ element, kind: 'element' as const })),
    ],
    [query],
  )

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    window.requestAnimationFrame(() => inputRef.current?.focus())
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onOpenChange, open])

  if (!open) return null

  return (
    <div
      aria-label="Search documentation"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 px-4 pt-[12vh] backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onOpenChange(false)
      }}
      role="dialog"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-xl border bg-popover shadow-xl">
        <div className="flex items-center gap-2 border-b px-3">
          <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
          <Input
            aria-label="Search articles"
            className="h-12 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search setup, providers, Cloudflare…"
            ref={inputRef}
            type="search"
            value={query}
          />
          <Button
            aria-label="Close search"
            onClick={() => onOpenChange(false)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <XIcon />
          </Button>
        </div>
        <div className="docs-scrollbar max-h-[24rem] overflow-y-auto p-2">
          {results.length ? (
            results.map((result) => (
              <button
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left outline-none hover:bg-muted focus-visible:bg-muted"
                key={result.kind === 'guide' ? result.page.path : `element-${result.element.name}`}
                onClick={() => {
                  navigateTo(
                    result.kind === 'guide'
                      ? pageHref(result.page)
                      : elementPageHref(result.element),
                  )
                  onOpenChange(false)
                }}
                type="button"
              >
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {result.kind === 'guide' ? result.page.title : result.element.title}
                  </span>
                  <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                    {result.kind === 'guide' ? result.page.description : result.element.description}
                  </span>
                </span>
                <span className="ml-auto shrink-0 font-mono text-[0.625rem] text-muted-foreground">
                  {result.kind === 'guide' ? result.page.group : 'Element'}
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No documentation matches “{query}”.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function DocsNotFound() {
  return (
    <main className="flex min-h-[calc(100svh-3.75rem)] items-center justify-center border-r px-6 text-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">404 · docs</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">
          That article is not here.
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Search the documentation or return to the introduction.
        </p>
        <Button className="mt-6" onClick={() => navigateTo('/')} type="button">
          Read the introduction
        </Button>
      </div>
    </main>
  )
}

function DocsAnchor({ href, onClick, ...props }: ComponentPropsWithoutRef<'a'>) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    event.preventDefault()
    navigateTo(href ?? '/')
  }

  return <a {...props} href={href} onClick={handleClick} />
}
