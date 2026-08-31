# Blog content

Blog posts are repository-owned MDX files. The web app discovers every `*.mdx` file in this
directory at build time, sorts them by `meta.date`, and creates the matching `/blog/{slug}` route.
The filename is the public slug, so use lowercase kebab case such as `my-first-post.mdx`. The three
newest posts also appear on the homepage automatically.

Each post must export this metadata before its Markdown content:

```mdx
export const meta = {
  author: 'Your name',
  category: 'Architecture',
  date: '2026-07-26',
  description: 'A short article summary.',
  readTime: '5 min read',
  sections: [{ id: 'first-section', title: 'First section' }],
  title: 'Your article title',
}

## First section

Write the post in Markdown or MDX.
```

Supported categories are `Architecture`, `Developer experience`, and `Interface`. Set
`featured: true` on at most one post to use it as the large lead story. The content check reports a
clear build error when metadata is missing, a slug is invalid, more than one post is featured, or
the ordered `sections` IDs do not match the post's plain-text `##` headings.

Standard Markdown supports headings, links, images, emphasis, code, blockquotes, and lists.
GitHub-flavored tables, task lists, strikethrough, and autolinks are enabled through `remark-gfm`.
MDX JSX is trusted repository code; never compile untrusted user-authored MDX.

Verify a new post with:

```bash
pnpm --filter web test
pnpm --filter web typecheck
pnpm --filter web build
```
