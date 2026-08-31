import { createProcessor, evaluateSync } from '@mdx-js/mdx'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import remarkGfm from 'remark-gfm'
import { z } from 'zod'

import type { BlogPostMeta, BlogPostSummary } from './blog-schema.ts'
import { contentHeadingId } from './content-heading.ts'

export type BlogSource = {
  source: string
  sourcePath: string
}

type ContentNode = {
  children?: readonly ContentNode[]
  depth?: number
  type: string
  value?: string
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const requiredText = z.string().trim().min(1, 'must be a non-empty string.')
const blogMetaSchema = z.strictObject({
  author: requiredText,
  category: requiredText,
  date: requiredText.refine(isIsoDate, 'must be a valid YYYY-MM-DD date.'),
  description: requiredText,
  featured: z.boolean().optional(),
  readTime: requiredText,
  sections: z.array(
    z.strictObject({
      id: requiredText,
      title: requiredText,
    }),
  ),
  title: requiredText,
})

export function validateBlogSources(
  sources: readonly BlogSource[],
): ReadonlyArray<BlogPostSummary> {
  const posts = sources.map(({ source, sourcePath }) => ({
    meta: parseBlogMeta(source, sourcePath),
    slug: assertBlogSlug(sourcePath),
  }))
  const featuredPosts = posts.filter((post) => post.meta.featured)

  if (featuredPosts.length > 1) {
    throw new Error(
      `Blog content may only have one featured post. Found: ${featuredPosts
        .map((post) => post.slug)
        .join(', ')}.`,
    )
  }

  return posts.map(({ meta, slug }) => ({ ...meta, slug }))
}

export function parseBlogMeta(source: string, sourcePath: string): BlogPostMeta {
  let metaValue: unknown

  try {
    const module = evaluateSync(source, {
      Fragment,
      jsx,
      jsxs,
      remarkPlugins: [remarkGfm],
    }) as { meta?: unknown }
    metaValue = module.meta
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${sourcePath} could not be parsed as MDX: ${message}`, { cause: error })
  }

  const meta = assertBlogMeta(metaValue, sourcePath)
  assertSectionsMatchHeadings(meta.sections, source, sourcePath)
  return meta
}

function assertBlogSlug(sourcePath: string): string {
  const filename = sourcePath.split('/').at(-1) ?? ''
  const slug = filename.replace(/\.mdx$/, '')

  if (!filename.endsWith('.mdx') || !slugPattern.test(slug)) {
    throw new Error(
      `${sourcePath} must use a lowercase kebab-case .mdx filename; the filename becomes the public blog slug.`,
    )
  }

  return slug
}

function assertBlogMeta(value: unknown, sourcePath: string): BlogPostMeta {
  if (!isRecord(value)) throw new Error(`${sourcePath} must export a meta object.`)

  const result = blogMetaSchema.safeParse(value)
  if (!result.success) throw blogMetaError(result.error.issues[0], sourcePath)

  const { featured, ...meta } = result.data
  return { ...meta, ...(featured === undefined ? {} : { featured }) }
}

function blogMetaError(issue: z.core.$ZodIssue | undefined, sourcePath: string): Error {
  if (!issue) return new Error(`${sourcePath} meta is invalid.`)
  if (issue.code === 'unrecognized_keys') {
    return new Error(
      `${sourcePath} meta has unsupported fields: ${issue.keys.map(String).join(', ')}.`,
    )
  }

  const field = issue.path.reduce<string>(
    (path, part) =>
      `${path}${typeof part === 'number' ? `[${part}]` : `${path ? '.' : ''}${String(part)}`}`,
    '',
  )
  return new Error(`${sourcePath} meta.${field} ${issue.message}`)
}

function assertSectionsMatchHeadings(
  sections: BlogPostMeta['sections'],
  source: string,
  sourcePath: string,
): void {
  const headingIds = secondLevelHeadingIds(source, sourcePath)
  const sectionIds = sections.map((section) => section.id)

  assertNoDuplicateIds(headingIds, `${sourcePath} has more than one level-two heading`)
  assertNoDuplicateIds(sectionIds, `${sourcePath} meta.sections contains duplicate id`)

  if (
    headingIds.length !== sectionIds.length ||
    headingIds.some((id, index) => id !== sectionIds[index])
  ) {
    throw new Error(
      `${sourcePath} meta.sections ids must match its level-two headings in order. Expected: ${formatIds(headingIds)}. Received: ${formatIds(sectionIds)}.`,
    )
  }
}

function secondLevelHeadingIds(source: string, sourcePath: string): string[] {
  const tree = createProcessor({ remarkPlugins: [remarkGfm] }).parse(source) as ContentNode
  const headings = collectNodes(tree, (node) => node.type === 'heading' && node.depth === 2)

  return headings.map((heading) => {
    const title = plainText(heading)
    const id = title ? contentHeadingId(title) : ''
    if (!id) {
      throw new Error(
        `${sourcePath} has a level-two heading without stable text for its section id.`,
      )
    }
    return id
  })
}

function collectNodes(
  node: ContentNode,
  matches: (candidate: ContentNode) => boolean,
): ContentNode[] {
  const found = matches(node) ? [node] : []
  return [...found, ...(node.children ?? []).flatMap((child) => collectNodes(child, matches))]
}

function plainText(node: ContentNode): string | undefined {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value
  if (!node.children) return undefined

  const parts = node.children.map(plainText)
  return parts.every((part): part is string => part !== undefined) ? parts.join('') : undefined
}

function assertNoDuplicateIds(ids: readonly string[], message: string): void {
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index)
  if (duplicate) throw new Error(`${message} "${duplicate}".`)
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function formatIds(ids: readonly string[]): string {
  return ids.length > 0 ? ids.join(', ') : '(none)'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
