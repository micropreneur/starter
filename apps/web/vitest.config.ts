import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import { defineConfig } from 'vitest/config'

import { blogContentContract } from './config/blog-content.ts'

export default defineConfig({
  plugins: [blogContentContract(), { enforce: 'pre', ...mdx({ remarkPlugins: [remarkGfm] }) }],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
