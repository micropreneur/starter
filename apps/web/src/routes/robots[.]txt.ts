import { createFileRoute } from '@tanstack/react-router'

import { renderRobotsTxt } from '../lib/seo'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(renderRobotsTxt(), {
          headers: {
            'cache-control': 'public, max-age=0, s-maxage=3600',
            'content-type': 'text/plain; charset=utf-8',
          },
        }),
    },
  },
})
