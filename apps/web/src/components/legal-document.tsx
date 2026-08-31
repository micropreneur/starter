import { Badge } from '@micropreneur/elements'
import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

export function LegalTemplateNotice() {
  return (
    <aside className="border-y border-amber-500/30 bg-amber-50 px-6 py-6 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100 sm:px-10 lg:px-16">
      <div className="flex max-w-3xl items-start gap-4">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium">Replace this template before launch</p>
          <p className="mt-1 text-sm leading-6 opacity-80">
            This copy is a drafting aid, not legal advice. Replace every bracketed field, remove
            sections that do not match your product, add the terms your jurisdiction requires, and
            ask qualified counsel to review the result.
          </p>
        </div>
      </div>
    </aside>
  )
}

export function LegalDocument({
  children,
  effectiveDate = '[Effective date]',
}: {
  children: ReactNode
  effectiveDate?: string
}) {
  return (
    <article className="px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
      <div className="grid gap-12 lg:grid-cols-[12rem_minmax(0,45rem)] lg:items-start lg:justify-center">
        <aside className="lg:sticky lg:top-24">
          <Badge variant="outline">Starter template</Badge>
          <p className="mt-4 font-mono text-xs text-muted-foreground">Effective: {effectiveDate}</p>
        </aside>
        <div className="grid gap-12">{children}</div>
      </div>
    </article>
  )
}

export function LegalSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">{title}</h2>
      <div className="mt-4 grid gap-4 text-sm leading-7 text-muted-foreground sm:text-base">
        {children}
      </div>
    </section>
  )
}
