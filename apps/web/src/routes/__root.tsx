import { Badge, buttonVariants } from '@micropreneur/elements'
import { TooltipProvider } from '@micropreneur/elements/tooltip'
import appCss from '@micropreneur/ui/globals.css?url'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRoute, HeadContent, Link, Scripts, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { ArrowUpRight, GitFork } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ThemeToggle } from '../components/theme-toggle'
import { siteConfig, siteLinks } from '../config/site'
import { APP_NOTICE_HEIGHT, SANDBOX_MODE } from '../lib/deployment-mode'
import { isStandaloneAuthPath } from '../lib/site-layout'

const THEME_BOOTSTRAP = `(function(){try{var k='theme';var s=localStorage.getItem(k);var d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`
const FLOATING_HEADER_THRESHOLD = 50

export const Route = createRootRoute({
  head: () => ({
    links: [
      { href: appCss, rel: 'stylesheet' },
      { href: '/favicon.png', rel: 'icon', type: 'image/png' },
    ],
    meta: [
      { charSet: 'utf-8' },
      { content: 'width=device-width, initial-scale=1', name: 'viewport' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const keepNoticeVisible = pathname.startsWith('/app')

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static FOUC-prevention bootstrap; no user input */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>
          {SANDBOX_MODE ? <SandboxNotice sticky={keepNoticeVisible} /> : null}
          <SiteHeader />
          {children}
        </TooltipProvider>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[{ name: 'TanStack Router', render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  )
}

function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [isFloating, setIsFloating] = useState(false)

  useEffect(() => {
    const updateHeader = () => {
      setIsFloating(window.scrollY > FLOATING_HEADER_THRESHOLD)
    }

    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })

    return () => window.removeEventListener('scroll', updateHeader)
  }, [])

  if (pathname.startsWith('/app') || isStandaloneAuthPath(pathname)) return null

  return (
    <>
      {!SANDBOX_MODE ? (
        <div className="dark border-b border-border/70 bg-background px-4 py-2 text-foreground">
          <a
            className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
            href={siteLinks.repository}
            rel="noreferrer"
            target="_blank"
          >
            Open source, MIT licensed, and built for the next micro SaaS
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      ) : null}
      <div className="h-14">
        <header
          className="relative z-20 h-14 border-b border-border/70 bg-background transition-[background-color,border-color,padding] duration-300 ease-out data-[floating=true]:fixed data-[floating=true]:inset-x-0 data-[floating=true]:top-4 data-[floating=true]:z-50 data-[floating=true]:h-auto data-[floating=true]:border-b-0 data-[floating=true]:bg-transparent data-[floating=true]:px-4 data-[floating=true]:sm:px-6"
          data-floating={isFloating}
        >
          <nav
            className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 transition-[height,max-width,border-radius,background-color,border-color,box-shadow,padding] duration-300 ease-out data-[floating=true]:h-12 data-[floating=true]:max-w-6xl data-[floating=true]:rounded-xl data-[floating=true]:border data-[floating=true]:bg-background/95 data-[floating=true]:px-3 data-[floating=true]:shadow-overlay data-[floating=true]:backdrop-blur sm:px-6"
            data-floating={isFloating}
          >
            <Link className="group flex items-center gap-2.5" to="/">
              <span className="text-xl font-semibold tracking-[-0.035em] text-foreground">
                {siteConfig.brandName}
              </span>
              <Badge
                className="hidden bg-muted/60 text-[0.625rem] tracking-[0.14em] text-muted-foreground sm:inline-flex"
                variant="outline"
              >
                {siteConfig.badge.toUpperCase()}
              </Badge>
            </Link>

            <div className="hidden items-center gap-1 lg:flex">
              <a
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                href="/#stack"
              >
                Stack
              </a>
              <a
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                href="/#elements"
              >
                Elements
              </a>
              <a
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                href="/#agents"
              >
                AI-native
              </a>
              <Link
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                to="/pricing"
              >
                Pricing
              </Link>
              <Link
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                to="/faq"
              >
                FAQ
              </Link>
              <Link
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                to="/blog"
              >
                Blog
              </Link>
              <a
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                href={siteLinks.docs}
                rel="noreferrer"
                target="_blank"
              >
                Docs
              </a>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <a
                aria-label={`View ${siteConfig.name} on GitHub`}
                className={buttonVariants({ size: 'icon', variant: 'ghost' })}
                href={siteLinks.repository}
                rel="noreferrer"
                target="_blank"
              >
                <GitFork className="size-4" />
              </a>
              <ThemeToggle />
              <Link className={buttonVariants()} to="/sign-in">
                Open app
              </Link>
            </div>
          </nav>
        </header>
      </div>
    </>
  )
}

function SandboxNotice({ sticky }: { sticky: boolean }) {
  return (
    <div
      className={`flex items-center justify-center border-b border-amber-400/30 bg-amber-100 px-4 py-1 text-center text-xs font-medium text-amber-950 dark:bg-amber-950 dark:text-amber-100 ${sticky ? 'sticky top-0 z-30' : ''}`}
      role="status"
      style={{ minHeight: APP_NOTICE_HEIGHT }}
    >
      Public sandbox · Test data may be reset · Stripe checkout uses test mode and never creates a
      real charge
    </div>
  )
}
