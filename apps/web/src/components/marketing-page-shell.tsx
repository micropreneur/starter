import { Badge } from '@micropreneur/elements'
import type { ReactNode } from 'react'

import { SiteFooter } from './site-footer'

export function MarketingPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="overflow-x-clip">
      <div className="mx-auto min-h-screen w-full max-w-7xl border-x border-border/60">
        {children}
        <SiteFooter />
      </div>
    </main>
  )
}

export function MarketingPageHero({
  children,
  description,
  eyebrow,
  title,
}: {
  children?: ReactNode
  description: string
  eyebrow: string
  title: ReactNode
}) {
  return (
    <header className="px-6 pt-20 pb-14 sm:px-10 sm:pt-24 sm:pb-16 lg:px-16">
      <Badge variant="outline">{eyebrow}</Badge>
      <h1 className="mt-6 max-w-[15ch] text-balance text-5xl leading-[0.98] font-semibold tracking-[-0.055em] sm:text-6xl lg:text-7xl">
        {title}
      </h1>
      <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
        {description}
      </p>
      {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
    </header>
  )
}
