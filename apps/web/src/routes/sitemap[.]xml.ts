import { createFileRoute } from '@tanstack/react-router'

import { getBlogPosts } from '../lib/blog'
import { getStaticSitemapEntries, renderSitemap } from '../lib/seo'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => {
        const blogEntries = getBlogPosts().map((post) => ({
          changeFrequency: 'monthly' as const,
          lastModified: post.date,
          path: `/blog/${post.slug}`,
          priority: 0.6,
        }))

        return new Response(renderSitemap([...getStaticSitemapEntries(), ...blogEntries]), {
          headers: {
            'cache-control': 'public, max-age=0, s-maxage=3600',
            'content-type': 'application/xml; charset=utf-8',
          },
        })
      },
    },
  },
})
