import type { MDXComponents } from 'mdx/types.js'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

export const blogMdxComponents: MDXComponents = {
  a: BlogLink,
  blockquote: ({ children }) => (
    <blockquote className="not-italic [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
      {children}
    </blockquote>
  ),
  h2: ({ children }) => <BlogHeading level={2}>{children}</BlogHeading>,
  h3: ({ children }) => <BlogHeading level={3}>{children}</BlogHeading>,
  img: ({ alt, ...props }) => (
    <img
      {...props}
      alt={alt ?? ''}
      className="my-10 w-full rounded-2xl border border-border/70 bg-muted/20"
      loading="lazy"
    />
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-[#11151a] p-5 text-[0.82rem] leading-6 text-[#e6edf3] shadow-none sm:p-6 [&>code]:rounded-none [&>code]:bg-transparent [&>code]:p-0 [&>code]:font-mono [&>code]:text-inherit">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-8 overflow-x-auto rounded-xl border border-border/70">
      <table className="my-0 min-w-[42rem]">{children}</table>
    </div>
  ),
}

function BlogLink({ children, href, ...props }: ComponentPropsWithoutRef<'a'>) {
  const external = href?.startsWith('http')

  return (
    <a
      {...props}
      href={href}
      rel={external ? 'noreferrer' : undefined}
      target={external ? '_blank' : undefined}
    >
      {children}
    </a>
  )
}

function BlogHeading({ children, level }: { children: ReactNode; level: 2 | 3 }) {
  const id = headingId(children)

  if (level === 2) {
    return <h2 id={id}>{children}</h2>
  }

  return <h3 id={id}>{children}</h3>
}

function headingId(children: ReactNode): string | undefined {
  if (typeof children !== 'string') return undefined

  return children
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
