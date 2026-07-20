import type { ElementMetadata, ElementOntology } from '@micropreneur/elements/catalog'

export const ontologyFilters = ['All', 'Objects', 'Properties', 'Actions', 'Interfaces'] as const

export type OntologyFilter = (typeof ontologyFilters)[number]

export function filterCatalog(
  items: readonly ElementMetadata[],
  query: string,
  ontology: OntologyFilter,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  return items.filter((item) => {
    const matchesOntology = ontology === 'All' || item.ontology === ontology
    const searchableText = [
      item.name,
      item.title,
      item.description,
      item.kind,
      item.ontology,
      ...item.dependencies,
    ]
      .join(' ')
      .toLocaleLowerCase()

    return (
      matchesOntology && (normalizedQuery.length === 0 || searchableText.includes(normalizedQuery))
    )
  })
}

export function isOntologyFilter(value: string): value is OntologyFilter {
  return ontologyFilters.includes(value as OntologyFilter)
}

export function countByOntology(
  items: readonly ElementMetadata[],
  ontology: 'All' | ElementOntology,
) {
  if (ontology === 'All') return items.length
  return items.filter((item) => item.ontology === ontology).length
}
