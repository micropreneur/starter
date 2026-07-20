import type { IncomingMessage, ServerResponse } from 'node:http'
import { cloudflare } from '@cloudflare/vite-plugin'
import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import remarkGfm from 'remark-gfm'
import { defineConfig, type Plugin } from 'vite'

export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkGfm] }) },
    cloudflare(),
    tailwindcss(),
    react({ include: /\.(js|jsx|md|mdx|ts|tsx)$/ }),
    utf8MachineReadableAssets(),
  ],
})

function utf8MachineReadableAssets(): Plugin {
  return {
    name: 'micropreneur:utf8-machine-readable-assets',
    configurePreviewServer(server) {
      server.middlewares.use(withUtf8ContentType)
    },
    configureServer(server) {
      server.middlewares.use(withUtf8ContentType)
    },
  }
}

function withUtf8ContentType(request: IncomingMessage, response: ServerResponse, next: () => void) {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname

  if (pathname.endsWith('.md')) {
    response.setHeader('Content-Type', 'text/markdown; charset=utf-8')
  } else if (pathname === '/llms.txt' || pathname === '/llms-full.txt') {
    response.setHeader('Content-Type', 'text/plain; charset=utf-8')
  } else if (
    pathname === '/agent-content.json' ||
    pathname === '/skills/index.json' ||
    pathname.endsWith('/.well-known/agent-skills/index.json') ||
    pathname.endsWith('/.well-known/skills/index.json')
  ) {
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
  }

  next()
}
