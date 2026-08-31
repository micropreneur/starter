import { describe, expect, it } from 'vitest'

import {
  absoluteSiteUrl,
  DEFAULT_SITE_ORIGIN,
  getSiteOriginConfigurationError,
  getStaticSitemapEntries,
  INDEXABLE_PUBLIC_PAGE_PATHS,
  legalTemplatePageHead,
  normalizeSiteOrigin,
  PRIVATE_PAGE_PATHS,
  PUBLIC_PAGE_PATHS,
  privatePageHead,
  publicPageHead,
  renderRobotsTxt,
  renderSitemap,
  resolveLegalPagesIndexable,
} from './seo'

describe('route SEO inventory', () => {
  it('excludes unfinished legal templates from the default sitemap inventory', () => {
    expect(getStaticSitemapEntries().map((entry) => entry.path)).toEqual(
      INDEXABLE_PUBLIC_PAGE_PATHS,
    )
    expect(getStaticSitemapEntries(true).map((entry) => entry.path)).toEqual(PUBLIC_PAGE_PATHS)
    expect(getStaticSitemapEntries(false).map((entry) => entry.path)).toEqual(
      INDEXABLE_PUBLIC_PAGE_PATHS,
    )
  })

  it('keeps private pages out of the public route inventory', () => {
    const privatePaths = new Set<string>(PRIVATE_PAGE_PATHS)
    expect(PUBLIC_PAGE_PATHS.filter((path) => privatePaths.has(path))).toEqual([])
  })
})

describe('page metadata', () => {
  it('uses the same absolute URL for canonical and og:url', () => {
    const head = publicPageHead({
      description: 'A specific page description.',
      path: '/pricing',
      title: 'Pricing',
    })

    expect(head.links).toContainEqual({
      href: 'https://starter.micropreneur.dev/pricing',
      rel: 'canonical',
    })
    expect(head.meta).toContainEqual({
      content: 'https://starter.micropreneur.dev/pricing',
      property: 'og:url',
    })
    expect(head.meta).toContainEqual({
      content: 'https://starter.micropreneur.dev/og/starter.png',
      property: 'og:image',
    })
    expect(head.meta).toContainEqual({ content: '1200', property: 'og:image:width' })
    expect(head.meta).toContainEqual({ content: '630', property: 'og:image:height' })
    expect(head.meta).toContainEqual({ content: 'image/png', property: 'og:image:type' })
    expect(head.meta).toContainEqual({ content: 'index, follow', name: 'robots' })
  })

  it('marks private pages noindex without adding a canonical', () => {
    const head = privatePageHead('Account settings')

    expect(head).not.toHaveProperty('links')
    expect(head.meta).toContainEqual({
      content: 'noindex, nofollow, noarchive',
      name: 'robots',
    })
  })

  it('keeps legal templates canonical but noindex until a fork activates them', () => {
    const options = {
      description: 'Replace this legal template before launch.',
      path: '/privacy',
      title: 'Privacy policy template',
    }

    const templateHead = legalTemplatePageHead(options)
    expect(templateHead.links).toContainEqual({
      href: 'https://starter.micropreneur.dev/privacy',
      rel: 'canonical',
    })
    expect(templateHead.meta).toContainEqual({
      content: 'noindex, nofollow, noarchive',
      name: 'robots',
    })
    expect(legalTemplatePageHead(options, true).meta).toContainEqual({
      content: 'index, follow',
      name: 'robots',
    })
  })
})

describe('sitemap and robots output', () => {
  it('renders unique static and dynamic routes as absolute XML locations', () => {
    const sitemap = renderSitemap([
      ...getStaticSitemapEntries(),
      {
        changeFrequency: 'monthly',
        lastModified: '2026-08-30',
        path: '/blog/a-post',
        priority: 0.6,
      },
      { changeFrequency: 'daily', path: '/', priority: 0.2 },
    ])

    expect(sitemap).toContain('<loc>https://starter.micropreneur.dev/blog/a-post</loc>')
    expect(sitemap).toContain('<lastmod>2026-08-30</lastmod>')
    expect(sitemap.split('<loc>https://starter.micropreneur.dev/</loc>')).toHaveLength(2)
    for (const privatePath of PRIVATE_PAGE_PATHS) {
      expect(sitemap).not.toContain(`<loc>${DEFAULT_SITE_ORIGIN}${privatePath}</loc>`)
    }
  })

  it('allows public pages while disallowing API and private page families', () => {
    const robots = renderRobotsTxt('https://example.com/path-that-is-ignored')

    expect(robots).toContain('Allow: /')
    expect(robots).toContain('Disallow: /api/')
    expect(robots).toContain('Disallow: /app')
    expect(robots).toContain('Disallow: /sign-in')
    expect(robots).toContain('Sitemap: https://example.com/sitemap.xml')
  })
})

describe('site URL normalization', () => {
  it('accepts only HTTP origins and removes paths', () => {
    expect(normalizeSiteOrigin('https://example.com/a/path')).toBe('https://example.com')
    expect(absoluteSiteUrl('/faq', 'https://example.com/base')).toBe('https://example.com/faq')
    expect(normalizeSiteOrigin('javascript:alert(1)')).toBe(DEFAULT_SITE_ORIGIN)
    expect(normalizeSiteOrigin('not a URL')).toBe(DEFAULT_SITE_ORIGIN)
  })

  it('requires an explicit canonical origin for non-local forks', () => {
    expect(getSiteOriginConfigurationError('https://starter.micropreneur.dev/pricing')).toBeNull()
    expect(getSiteOriginConfigurationError('http://localhost:3000/pricing')).toBeNull()
    expect(
      getSiteOriginConfigurationError('https://product.example/pricing', 'https://product.example'),
    ).toBeNull()
    expect(getSiteOriginConfigurationError('https://product.example/pricing')).toContain(
      'VITE_PUBLIC_SITE_URL',
    )
  })

  it('activates legal indexing only for an explicit true value', () => {
    expect(resolveLegalPagesIndexable('true')).toBe(true)
    expect(resolveLegalPagesIndexable('TRUE')).toBe(true)
    expect(resolveLegalPagesIndexable(' true ')).toBe(true)
    expect(resolveLegalPagesIndexable('false')).toBe(false)
    expect(resolveLegalPagesIndexable(undefined)).toBe(false)
  })
})
