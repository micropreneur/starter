import { type SiteConfiguration, siteConfig } from '../config/site'

export const SITE_NAME = siteConfig.name
export const DEFAULT_SITE_ORIGIN = siteConfig.defaultOrigin

const configuredSiteOrigin = import.meta.env.VITE_PUBLIC_SITE_URL?.trim()
const configuredLegalPagesIndexable = import.meta.env.VITE_PUBLIC_LEGAL_PAGES_INDEXABLE?.trim()

export const SITE_ORIGIN = normalizeSiteOrigin(configuredSiteOrigin ?? DEFAULT_SITE_ORIGIN)
export const LEGAL_PAGES_INDEXABLE = resolveLegalPagesIndexable(configuredLegalPagesIndexable)

export const INDEXABLE_PUBLIC_PAGE_PATHS = ['/', '/pricing', '/faq', '/blog'] as const

export const LEGAL_TEMPLATE_PAGE_PATHS = ['/legal', '/privacy', '/terms'] as const

export const PUBLIC_PAGE_PATHS = [
  ...INDEXABLE_PUBLIC_PAGE_PATHS,
  ...LEGAL_TEMPLATE_PAGE_PATHS,
] as const

export const PRIVATE_PAGE_PATHS = [
  '/app',
  '/onboarding',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
] as const

export type SitemapEntry = {
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  lastModified?: string
  path: string
  priority: number
}

const INDEXABLE_SITEMAP_ENTRIES = [
  { changeFrequency: 'weekly', path: '/', priority: 1 },
  { changeFrequency: 'monthly', path: '/pricing', priority: 0.8 },
  { changeFrequency: 'monthly', path: '/faq', priority: 0.7 },
  { changeFrequency: 'weekly', path: '/blog', priority: 0.7 },
] as const satisfies ReadonlyArray<SitemapEntry>

const LEGAL_TEMPLATE_SITEMAP_ENTRIES = [
  { changeFrequency: 'yearly', path: '/legal', priority: 0.3 },
  { changeFrequency: 'yearly', path: '/privacy', priority: 0.3 },
  { changeFrequency: 'yearly', path: '/terms', priority: 0.3 },
] as const satisfies ReadonlyArray<SitemapEntry>

type PublicPageHeadOptions = {
  description: string
  imageAlt?: string
  path: string
  publishedTime?: string
  title: string
  type?: 'article' | 'website'
}

export function legalTemplatePageHead(
  options: PublicPageHeadOptions,
  indexable = LEGAL_PAGES_INDEXABLE,
) {
  return pageHead(options, indexable)
}

export function publicPageHead(options: PublicPageHeadOptions) {
  return pageHead(options, true)
}

function pageHead(
  {
    description,
    imageAlt = siteConfig.socialImage.alt,
    path,
    publishedTime,
    title,
    type = 'website',
  }: PublicPageHeadOptions,
  indexable: boolean,
) {
  const pageTitle = title === SITE_NAME ? title : `${title} · ${SITE_NAME}`
  const url = absoluteSiteUrl(path)
  const image = absoluteSiteUrl(siteConfig.socialImage.path)

  return {
    links: [{ href: url, rel: 'canonical' }],
    meta: [
      { title: pageTitle },
      { content: description, name: 'description' },
      {
        content: indexable ? 'index, follow' : 'noindex, nofollow, noarchive',
        name: 'robots',
      },
      { content: pageTitle, property: 'og:title' },
      { content: description, property: 'og:description' },
      { content: type, property: 'og:type' },
      { content: url, property: 'og:url' },
      { content: SITE_NAME, property: 'og:site_name' },
      { content: image, property: 'og:image' },
      { content: imageAlt, property: 'og:image:alt' },
      { content: '1200', property: 'og:image:width' },
      { content: '630', property: 'og:image:height' },
      { content: 'image/png', property: 'og:image:type' },
      ...(publishedTime ? [{ content: publishedTime, property: 'article:published_time' }] : []),
      { content: 'summary_large_image', name: 'twitter:card' },
      { content: pageTitle, name: 'twitter:title' },
      { content: description, name: 'twitter:description' },
      { content: image, name: 'twitter:image' },
      { content: imageAlt, name: 'twitter:image:alt' },
    ],
  }
}

export function getStaticSitemapEntries(
  includeLegalTemplates = LEGAL_PAGES_INDEXABLE,
): ReadonlyArray<SitemapEntry> {
  return includeLegalTemplates
    ? [...INDEXABLE_SITEMAP_ENTRIES, ...LEGAL_TEMPLATE_SITEMAP_ENTRIES]
    : INDEXABLE_SITEMAP_ENTRIES
}

export function privatePageHead(title: string) {
  return {
    meta: [
      { title: `${title} · ${SITE_NAME}` },
      { content: 'noindex, nofollow, noarchive', name: 'robots' },
    ],
  }
}

export function absoluteSiteUrl(path: string, origin = SITE_ORIGIN): string {
  const normalizedPath = path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}`
  return new URL(normalizedPath, `${normalizeSiteOrigin(origin)}/`).toString()
}

export function normalizeSiteOrigin(value: string): string {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return DEFAULT_SITE_ORIGIN
    return url.origin
  } catch {
    return DEFAULT_SITE_ORIGIN
  }
}

export function resolveLegalPagesIndexable(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true'
}

export function getIndexableSiteConfigurationError(
  requestUrl: string,
  configuredOrigin = SITE_ORIGIN,
  identity: SiteConfiguration = siteConfig,
  legalPagesIndexable = LEGAL_PAGES_INDEXABLE,
): string | null {
  const request = new URL(requestUrl)
  if (
    isLocalHostname(request.hostname) ||
    !isIndexablePublicPath(request.pathname, legalPagesIndexable)
  ) {
    return null
  }

  const origin = normalizeSiteOrigin(configuredOrigin)
  if (origin === DEFAULT_SITE_ORIGIN && request.origin !== DEFAULT_SITE_ORIGIN) {
    return `This deployment is serving ${request.origin} while VITE_PUBLIC_SITE_URL still points to ${DEFAULT_SITE_ORIGIN}. Set VITE_PUBLIC_SITE_URL to this fork's final HTTPS origin and rebuild. Authentication, API, and application routes remain available while public indexing is blocked.`
  }

  if (request.origin === DEFAULT_SITE_ORIGIN) return null

  const unchangedFields = getUnchangedUpstreamIdentityFields(identity)
  if (unchangedFields.length === 0) return null

  return `This fork is still using upstream identity values in site.config.mjs: ${unchangedFields.join(', ')}. Customize them and rebuild before indexing public pages.`
}

export function isIndexablePublicPath(
  pathname: string,
  legalPagesIndexable = LEGAL_PAGES_INDEXABLE,
): boolean {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/u, '') : pathname

  if (normalizedPath === '/sitemap.xml' || normalizedPath === '/robots.txt') return true
  if (normalizedPath === '/blog' || normalizedPath.startsWith('/blog/')) return true
  if ((INDEXABLE_PUBLIC_PAGE_PATHS as ReadonlyArray<string>).includes(normalizedPath)) return true

  return (
    legalPagesIndexable &&
    (LEGAL_TEMPLATE_PAGE_PATHS as ReadonlyArray<string>).includes(normalizedPath)
  )
}

export function renderSitemap(entries: ReadonlyArray<SitemapEntry>, origin = SITE_ORIGIN): string {
  const uniqueEntries = [...new Map(entries.map((entry) => [entry.path, entry])).values()]
  const urls = uniqueEntries
    .map((entry) => {
      const lastModified = entry.lastModified
        ? `\n    <lastmod>${escapeXml(entry.lastModified)}</lastmod>`
        : ''

      return `  <url>\n    <loc>${escapeXml(absoluteSiteUrl(entry.path, origin))}</loc>${lastModified}\n    <changefreq>${entry.changeFrequency}</changefreq>\n    <priority>${entry.priority.toFixed(1)}</priority>\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export function renderRobotsTxt(origin = SITE_ORIGIN): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    ...PRIVATE_PAGE_PATHS.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${absoluteSiteUrl('/sitemap.xml', origin)}`,
    '',
  ].join('\n')
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

function getUnchangedUpstreamIdentityFields(identity: SiteConfiguration): Array<string> {
  const upstreamIdentity = {
    brandName: 'Micropreneur',
    description:
      'The public, fork-and-go foundation for building a smaller business and owning a bigger life.',
    docsUrl: 'https://docs.micropreneur.dev',
    name: 'Micropreneur Starter',
    repositoryUrl: 'https://github.com/micropreneur/starter',
    socialImageAlt: 'Micropreneur Starter, a fork-and-go SaaS foundation',
    socialUrl: 'https://www.x.com/micropreneurial',
    supportEmail: 'dan@micropreneur.dev',
  } as const

  const configuredIdentity = {
    brandName: identity.brandName,
    description: identity.description,
    docsUrl: identity.docsUrl,
    name: identity.name,
    repositoryUrl: identity.repositoryUrl,
    socialImageAlt: identity.socialImage.alt,
    socialUrl: identity.socialUrl,
    supportEmail: identity.supportEmail,
  } as const

  return Object.entries(upstreamIdentity)
    .filter(
      ([field, value]) => configuredIdentity[field as keyof typeof configuredIdentity] === value,
    )
    .map(([field]) => field)
}
