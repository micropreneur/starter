import {
  type ElementMetadata,
  type ElementOntology,
  elementCatalog,
} from '@micropreneur/elements/catalog'

const hostedRegistryOrigin = 'https://elements.micropreneur.dev'

export const elementOntologies = [
  'Objects',
  'Properties',
  'Actions',
  'Interfaces',
] as const satisfies readonly ElementOntology[]

export const elementSections = [
  { id: 'preview', title: 'Preview' },
  { id: 'installation', title: 'Installation' },
  { id: 'registry-metadata', title: 'Registry metadata' },
  { id: 'own-the-source', title: 'Own the source' },
] as const

const elementNavigationItems = elementOntologies.flatMap((ontology) =>
  elementCatalog.filter((element) => element.ontology === ontology),
)

export function elementPageHref(element: Pick<ElementMetadata, 'name'>) {
  return `/elements/components/${element.name}`
}

export function getElementsRegistryOrigin() {
  if (typeof window === 'undefined') return hostedRegistryOrigin
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return window.location.origin
  }
  return hostedRegistryOrigin
}

export function getElementPage(pathname: string) {
  const match = pathname.match(/^\/elements\/components\/([a-z0-9-]+)\/?$/)
  if (!match?.[1]) return undefined
  return elementCatalog.find((element) => element.name === match[1])
}

export function getElementsByOntology(ontology: ElementOntology) {
  return elementNavigationItems.filter((element) => element.ontology === ontology)
}

export function getFirstElementPage() {
  return elementNavigationItems[0]
}

export function getAdjacentElements(element: ElementMetadata) {
  const index = elementNavigationItems.findIndex((candidate) => candidate.name === element.name)
  return {
    next: index >= 0 ? elementNavigationItems[index + 1] : undefined,
    previous: index > 0 ? elementNavigationItems[index - 1] : undefined,
  }
}

export function elementSourcePath(element: ElementMetadata) {
  return element.kind === 'primitive'
    ? `packages/ui/src/components/${element.name}.tsx`
    : `packages/elements/src/${element.name}.tsx`
}

export function searchElements(query: string) {
  const normalized = normalizeSearchText(query)
  if (!normalized) return []
  const terms = normalized.split(/\s+/)

  return elementCatalog.filter((element) => {
    const searchable = normalizeSearchText(
      [element.title, element.name, element.description, element.kind, element.ontology].join(' '),
    )
    return terms.every((term) => searchable.includes(term))
  })
}

function normalizeSearchText(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim()
    .toLocaleLowerCase()
}
