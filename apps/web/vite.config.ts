import { cloudflare } from '@cloudflare/vite-plugin'
import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import remarkGfm from 'remark-gfm'
import { defineConfig } from 'vite'

import { blogContentContract } from './config/blog-content.ts'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    blogContentContract(),
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkGfm] }) },
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    viteReact({ include: /\.(js|jsx|md|mdx|ts|tsx)$/ }),
  ],
})
