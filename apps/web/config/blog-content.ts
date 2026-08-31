import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

import { validateBlogSources } from '../src/lib/blog-contract.ts'

const blogContentRoot = fileURLToPath(new URL('../src/content/blog', import.meta.url))
const publicModuleId = 'virtual:micropreneur-blog-metadata'
const resolvedModuleId = `\0${publicModuleId}`

export function blogContentContract(): Plugin {
  async function readAndValidate() {
    const entries = await readdir(blogContentRoot, { withFileTypes: true })
    const sources = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
        .sort((first, second) => first.name.localeCompare(second.name))
        .map(async (entry) => ({
          source: await readFile(path.join(blogContentRoot, entry.name), 'utf8'),
          sourcePath: `apps/web/src/content/blog/${entry.name}`,
        })),
    )

    return validateBlogSources(sources)
  }

  return {
    name: 'micropreneur:blog-content-contract',
    enforce: 'pre',
    async buildStart() {
      await readAndValidate()
    },
    resolveId(id) {
      return id === publicModuleId ? resolvedModuleId : undefined
    },
    async load(id) {
      if (id !== resolvedModuleId) return undefined

      const summaries = await readAndValidate()
      return `export default ${JSON.stringify(summaries)};`
    },
    async handleHotUpdate(context) {
      if (!context.file.startsWith(`${blogContentRoot}${path.sep}`)) return

      await readAndValidate()
      const virtualModule = context.server.moduleGraph.getModuleById(resolvedModuleId)
      if (!virtualModule) return

      context.server.moduleGraph.invalidateModule(virtualModule)
      return [...new Set([...context.modules, virtualModule])]
    },
  }
}
