import { Link } from '@tanstack/react-router'
import { Globe2, Mail } from 'lucide-react'

import { siteConfig, siteLinks } from '../config/site'

const socialLinks = [
  {
    href: siteLinks.social,
    icon: () => <span className="text-xl">𝕏</span>,
    label: `${siteConfig.brandName} on X`,
  },
  {
    href: siteLinks.support,
    icon: Mail,
    label: `Email ${siteConfig.brandName}`,
  },
] as const

export function SiteFooter() {
  return (
    <footer className="grid gap-8 border-t border-border/70 px-6 py-10 text-sm sm:grid-cols-[1fr_auto] sm:items-end sm:px-10 lg:px-16">
      <div>
        <Link className="flex w-fit items-center gap-2 font-medium" to="/">
          <img
            alt=""
            aria-hidden="true"
            className="size-7 rounded-md ring-1 ring-border/40"
            height="28"
            src="/favicon.png"
            width="28"
          />
          {siteConfig.name}
        </Link>
        <p className="mt-3 max-w-sm text-xs text-muted-foreground">{siteConfig.description}</p>
      </div>

      <div className="flex flex-col gap-4 sm:items-end">
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground sm:justify-end"
        >
          <Link className="transition-colors hover:text-foreground" to="/">
            Home
          </Link>
          <Link className="transition-colors hover:text-foreground" to="/blog">
            Blog
          </Link>
          <Link className="transition-colors hover:text-foreground" to="/pricing">
            Pricing
          </Link>
          <Link className="transition-colors hover:text-foreground" to="/faq">
            FAQ
          </Link>
          <Link className="transition-colors hover:text-foreground" to="/legal">
            Legal
          </Link>
          <Link className="transition-colors hover:text-foreground" to="/privacy">
            Privacy
          </Link>
          <Link className="transition-colors hover:text-foreground" to="/terms">
            Terms
          </Link>
          <a
            className="transition-colors hover:text-foreground"
            href={siteLinks.docs}
            rel="noreferrer"
            target="_blank"
          >
            Docs
          </a>
          <a
            className="transition-colors hover:text-foreground"
            href={siteLinks.repository}
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <a
            className="transition-colors hover:text-foreground"
            href={siteLinks.license}
            rel="noreferrer"
            target="_blank"
          >
            MIT License
          </a>
        </nav>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <a
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            href={siteConfig.attribution.url}
            rel="noreferrer"
            target="_blank"
          >
            <Globe2 className="size-3.5" />
            {siteConfig.attribution.label}
          </a>
          <ul className="flex items-center gap-2">
            {socialLinks.map(({ href, icon: Icon, label }) => {
              const external = !href.startsWith('mailto:')

              return (
                <li key={label}>
                  <a
                    aria-label={label}
                    className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-[color,background-color,border-color] hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    href={href}
                    rel={external ? 'noreferrer' : undefined}
                    target={external ? '_blank' : undefined}
                    title={label}
                  >
                    <Icon className="size-4" />
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </footer>
  )
}
