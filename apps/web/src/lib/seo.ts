export const SITE_NAME = 'Micropreneur Starter'
export const DEFAULT_SITE_ORIGIN = 'https://starter.micropreneur.dev'

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
    imageAlt = 'Micropreneur Starter, a fork-and-go SaaS foundation',
    path,
    publishedTime,
    title,
    type = 'website',
  }: PublicPageHeadOptions,
  indexable: boolean,
) {
  const pageTitle = title === SITE_NAME ? title : `${title} · ${SITE_NAME}`
  const url = absoluteSiteUrl(path)
  const image = absoluteSiteUrl('/og/starter.png')

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

export function getSiteOriginConfigurationError(
  requestUrl: string,
  configuredOrigin = SITE_ORIGIN,
): string | null {
  const request = new URL(requestUrl)
  if (isLocalHostname(request.hostname)) return null

  const origin = normalizeSiteOrigin(configuredOrigin)
  if (origin !== DEFAULT_SITE_ORIGIN || request.origin === DEFAULT_SITE_ORIGIN) return null

  return `This deployment is serving ${request.origin} while VITE_PUBLIC_SITE_URL still points to ${DEFAULT_SITE_ORIGIN}. Set VITE_PUBLIC_SITE_URL to this fork's final HTTPS origin and rebuild.`
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
