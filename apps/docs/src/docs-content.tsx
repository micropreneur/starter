import { elementCatalog } from '@micropreneur/elements/catalog'
import { Button } from '@micropreneur/ui/components/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@micropreneur/ui/components/tabs'
import { cn } from '@micropreneur/ui/lib/utils'
import { ArrowRightIcon, CheckIcon, CopyIcon } from 'lucide-react'
import type { MDXComponents } from 'mdx/types.js'
import {
  Children,
  type ComponentPropsWithoutRef,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useState,
} from 'react'
import { elementPageHref, getElementsRegistryOrigin } from './lib/elements'
import { navigateTo } from './lib/navigation'
import { ElementPreview } from './previews'

export const docsMdxComponents: MDXComponents = {
  a: DocsLink,
  blockquote: ({ children }) => (
    <blockquote className="not-italic [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
      {children}
    </blockquote>
  ),
  h2: ({ children }) => <DocsHeading level={2}>{children}</DocsHeading>,
  h3: ({ children }) => <DocsHeading level={3}>{children}</DocsHeading>,
  img: ({ alt, ...props }) => (
    <img
      {...props}
      alt={alt ?? ''}
      className="my-8 w-full rounded-xl border border-border/70 bg-muted/20"
      loading="lazy"
    />
  ),
  pre: ({ children }) => (
    <pre className="docs-code-block overflow-x-auto rounded-xl border border-white/8 bg-[#11151a] p-4 text-[0.8rem] leading-6 text-[#e6edf3] sm:p-5 [&>code]:rounded-none [&>code]:bg-transparent [&>code]:p-0 [&>code]:font-mono [&>code]:text-inherit">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-7 overflow-x-auto rounded-lg border border-border/70">
      <table className="!my-0 min-w-[40rem] [&_td]:!px-4 [&_td]:!py-2.5 [&_th]:!px-4 [&_th]:!py-3">
        {children}
      </table>
    </div>
  ),
  Callout,
  CodeGroup,
  CodeTab,
  ElementShowcase,
  Step,
  Steps,
}

function DocsLink({ children, href, onClick, ...props }: ComponentPropsWithoutRef<'a'>) {
  const internal = Boolean(href?.startsWith('/') && !href.startsWith('//'))
  const external = Boolean(href?.startsWith('http://') || href?.startsWith('https://'))

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (
      !internal ||
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

  return (
    <a
      {...props}
      href={href}
      onClick={handleClick}
      rel={external ? 'noreferrer' : undefined}
      target={external ? '_blank' : undefined}
    >
      {children}
    </a>
  )
}

function DocsHeading({ children, level }: { children: ReactNode; level: 2 | 3 }) {
  const id = headingId(children)
  if (level === 2) return <h2 id={id}>{children}</h2>
  return <h3 id={id}>{children}</h3>
}

function headingId(children: ReactNode) {
  if (typeof children !== 'string') return undefined
  return children
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function Callout({
  children,
  title = 'Note',
  type = 'note',
}: {
  children: ReactNode
  title?: string
  type?: 'note' | 'warning'
}) {
  return (
    <aside
      className={cn(
        'not-prose my-7 rounded-lg border bg-muted/25 px-4 py-3.5 text-sm leading-6',
        type === 'warning' && 'border-accent/40 bg-accent/5',
      )}
    >
      <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-foreground">
        {title}
      </p>
      <div className="mt-1.5 text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5">
        {children}
      </div>
    </aside>
  )
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="docs-steps not-prose my-8">{children}</ol>
}

function Step({ children, title }: { children: ReactNode; title: string }) {
  return (
    <li className="docs-step">
      <h3 className="text-sm font-semibold tracking-[-0.015em] text-foreground">{title}</h3>
      <div className="mt-1.5 text-sm leading-6 text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_p]:my-0">
        {children}
      </div>
    </li>
  )
}

interface CodeTabProps {
  children: ReactNode
  label: string
}

function CodeTab(_: CodeTabProps) {
  return null
}

function CodeGroup({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter((child): child is ReactElement<CodeTabProps> =>
    isValidElement<CodeTabProps>(child),
  )
  const initialTab = items[0]?.props.label
  if (!initialTab) return null

  return (
    <Tabs className="not-prose my-7 gap-0" defaultValue={initialTab}>
      <div className="flex min-h-10 items-center border border-b-0 border-white/8 bg-[#11151a] px-2.5">
        <span className="mr-2 size-1.5 rounded-full bg-accent" />
        <TabsList className="h-auto gap-0 bg-transparent p-0" variant="line">
          {items.map((item) => (
            <TabsTrigger
              className="h-9 rounded-none px-2.5 font-mono text-[0.6875rem] text-[#8b949e] data-active:text-[#e6edf3] after:bottom-0 after:bg-accent"
              key={item.props.label}
              value={item.props.label}
            >
              {item.props.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {items.map((item) => (
        <TabsContent
          className="rounded-b-xl border border-white/8 bg-[#11151a] [&_.docs-code-block]:m-0 [&_.docs-code-block]:rounded-t-none [&_.docs-code-block]:border-0"
          key={item.props.label}
          value={item.props.label}
        >
          {item.props.children}
        </TabsContent>
      ))}
    </Tabs>
  )
}

export function ElementShowcase({
  name,
  showDocsLink = true,
}: {
  name: string
  showDocsLink?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const item = elementCatalog.find((candidate) => candidate.name === name)

  if (!item) {
    return (
      <Callout title="Preview unavailable" type="warning">
        No free registry item named <code>{name}</code> exists.
      </Callout>
    )
  }

  const command = `pnpm dlx shadcn@latest add ${getElementsRegistryOrigin()}/r/${item.name}.json`
  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-border/70 bg-card shadow-card">
      <figcaption className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold tracking-[-0.015em] text-card-foreground">
              {item.title}
            </span>
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-accent">
              {item.ontology}
            </span>
            <span className="font-mono text-[0.625rem] text-muted-foreground">{item.kind}</span>
          </div>
          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
            {item.description}
          </p>
        </div>
        {showDocsLink && (
          <DocsLink
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
            href={elementPageHref(item)}
          >
            Component docs
            <ArrowRightIcon aria-hidden className="size-3" />
          </DocsLink>
        )}
      </figcaption>

      <div className="preview-grid flex min-h-56 items-center justify-center overflow-auto bg-background p-6 sm:p-8">
        <ElementPreview name={item.name} />
      </div>

      <div className="flex min-w-0 items-center gap-2 border-t bg-muted/25 p-2">
        <code className="min-w-0 flex-1 overflow-x-auto px-2 font-mono text-[0.6875rem] whitespace-nowrap text-muted-foreground">
          <span aria-hidden className="mr-2 text-accent">
            $
          </span>
          {command}
        </code>
        <Button
          aria-label={
            copied
              ? `Copied install command for ${item.title}`
              : `Copy install command for ${item.title}`
          }
          onClick={copyCommand}
          size="sm"
          type="button"
          variant="outline"
        >
          {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
          <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
    </figure>
  )
}
