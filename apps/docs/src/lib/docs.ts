import type { MDXContent } from 'mdx/types.js'

export const docGroups = [
  'Getting started',
  'Integrations',
  'Cloudflare',
  'Elements',
  'Agents',
] as const

export type DocGroup = (typeof docGroups)[number]

export type DocSection = {
  id: string
  title: string
}

export type DocMeta = {
  description: string
  group: DocGroup
  keywords?: readonly string[]
  order: number
  sections: readonly DocSection[]
  title: string
}

type DocModule = {
  default: MDXContent
  meta: DocMeta
}

export type DocPage = DocMeta & {
  Content: MDXContent
  path: string
  sourcePath: string
}

const modules = import.meta.glob<DocModule>('../content/**/*.mdx', { eager: true })

const groupRank = new Map(docGroups.map((group, index) => [group, index]))

export const docPages = Object.entries(modules)
  .map(([sourcePath, module]): DocPage => {
    const path = sourcePath.replace('../content/', '').replace(/\.mdx$/, '')

    return {
      ...module.meta,
      Content: module.default,
      path,
      sourcePath: `apps/docs/src/content/${path}.mdx`,
    }
  })
  .sort((first, second) => {
    const groupDifference =
      (groupRank.get(first.group) ?? Number.MAX_SAFE_INTEGER) -
      (groupRank.get(second.group) ?? Number.MAX_SAFE_INTEGER)
    return groupDifference || first.order - second.order || first.title.localeCompare(second.title)
  })

export function pageHref(page: Pick<DocPage, 'path'>) {
  return `/${page.path}`
}

export function getDocPage(pathname: string) {
  const path = pathname === '/' ? 'getting-started/introduction' : pathname.replace(/^\//, '')
  return docPages.find((page) => page.path === path)
}

export function getPagesByGroup(group: DocGroup) {
  return docPages.filter((page) => page.group === group)
}

export function getAdjacentPages(page: DocPage) {
  const index = docPages.findIndex((candidate) => candidate.path === page.path)
  return {
    next: index >= 0 ? docPages[index + 1] : undefined,
    previous: index > 0 ? docPages[index - 1] : undefined,
  }
}

export function searchDocs(query: string) {
  const normalized = query.trim().toLocaleLowerCase()
  if (normalized.length === 0) return docPages.slice(0, 7)

  return docPages
    .map((page) => {
      const title = page.title.toLocaleLowerCase()
      const description = page.description.toLocaleLowerCase()
      const keywords = page.keywords?.join(' ').toLocaleLowerCase() ?? ''
      const sections = page.sections
        .map((section) => section.title)
        .join(' ')
        .toLocaleLowerCase()
      const score =
        (title.includes(normalized) ? 8 : 0) +
        (keywords.includes(normalized) ? 4 : 0) +
        (description.includes(normalized) ? 2 : 0) +
        (sections.includes(normalized) ? 1 : 0)
      return { page, score }
    })
    .filter((result) => result.score > 0)
    .sort((first, second) => second.score - first.score)
    .map((result) => result.page)
}
