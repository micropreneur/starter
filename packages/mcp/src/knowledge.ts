import agentContent from './generated/agent-content.json' with { type: 'json' }

export type DocumentationRecord = (typeof agentContent.docs)[number]
export type SkillRecord = (typeof agentContent.skills)[number]

export type DocumentationSummary = Omit<DocumentationRecord, 'markdown'>
export type SkillSummary = Omit<SkillRecord, 'markdown'>

export type DocumentationSearchResult = DocumentationSummary & {
  snippet: string
}

export type SkillSearchResult = SkillSummary & {
  snippet: string
}

export function listDocs(): DocumentationSummary[] {
  return agentContent.docs.map(withoutMarkdown)
}

export function searchDocs(query: string): DocumentationSearchResult[] {
  const normalized = normalize(query)
  if (!normalized) {
    return agentContent.docs.map((doc) => ({
      ...withoutMarkdown(doc),
      snippet: summarySnippet(doc.markdown),
    }))
  }

  return agentContent.docs
    .map((doc) => ({ doc, score: documentationScore(doc, normalized) }))
    .filter((result) => result.score > 0)
    .sort(
      (first, second) =>
        second.score - first.score || first.doc.title.localeCompare(second.doc.title),
    )
    .map(({ doc }) => ({
      ...withoutMarkdown(doc),
      snippet: matchingSnippet(doc.markdown, normalized),
    }))
}

export function getDoc(identifier: string): DocumentationRecord | undefined {
  const normalized = identifier.trim().replace(/^\//, '')
  return agentContent.docs.find((doc) =>
    [doc.id, doc.path, doc.rawPath, doc.title].some(
      (candidate) => candidate.replace(/^\//, '').toLowerCase() === normalized.toLowerCase(),
    ),
  )
}

export function listSkills(): SkillSummary[] {
  return agentContent.skills.map(withoutMarkdown)
}

export function searchSkills(query: string): SkillSearchResult[] {
  const normalized = normalize(query)
  if (!normalized) {
    return agentContent.skills.map((skill) => ({
      ...withoutMarkdown(skill),
      snippet: summarySnippet(skill.markdown),
    }))
  }

  return agentContent.skills
    .filter((skill) =>
      [skill.name, skill.description, skill.markdown].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    )
    .map((skill) => ({
      ...withoutMarkdown(skill),
      snippet: matchingSnippet(skill.markdown, normalized),
    }))
}

export function getSkill(identifier: string): SkillRecord | undefined {
  const normalized = identifier.trim().replace(/^\//, '')
  return agentContent.skills.find((skill) =>
    [skill.name, skill.rawPath].some(
      (candidate) => candidate.replace(/^\//, '').toLowerCase() === normalized.toLowerCase(),
    ),
  )
}

function documentationScore(doc: DocumentationRecord, query: string) {
  const title = doc.title.toLowerCase()
  const keywords = doc.keywords.join(' ').toLowerCase()
  const metadata = [doc.id, doc.group, doc.description, doc.type].join(' ').toLowerCase()
  const markdown = doc.markdown.toLowerCase()

  return (
    (title.includes(query) ? 12 : 0) +
    (keywords.includes(query) ? 8 : 0) +
    (metadata.includes(query) ? 4 : 0) +
    (markdown.includes(query) ? 1 : 0)
  )
}

function matchingSnippet(markdown: string, query: string) {
  const plainText = toPlainText(markdown)
  const index = plainText.toLowerCase().indexOf(query)
  if (index < 0) return summarySnippet(markdown)

  const start = Math.max(0, index - 90)
  const end = Math.min(plainText.length, index + query.length + 130)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < plainText.length ? '…' : ''
  return `${prefix}${plainText.slice(start, end).trim()}${suffix}`
}

function summarySnippet(markdown: string) {
  const plainText = toPlainText(markdown)
  return plainText.length > 220 ? `${plainText.slice(0, 217).trim()}…` : plainText
}

function toPlainText(markdown: string) {
  return markdown
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`|[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function withoutMarkdown<T extends { markdown: string }>(value: T): Omit<T, 'markdown'> {
  const { markdown: _markdown, ...metadata } = value
  return metadata
}
