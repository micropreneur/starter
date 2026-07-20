export type ElementOntology = 'Actions' | 'Interfaces' | 'Objects' | 'Properties'
export type ElementKind = 'block' | 'component' | 'primitive'
export type ElementRegistryType = 'registry:block' | 'registry:component' | 'registry:ui'

export interface ElementMetadata {
  dependencies: readonly string[]
  description: string
  docsPath: string
  kind: ElementKind
  name: string
  ontology: ElementOntology
  registryType: ElementRegistryType
  tier: 'free'
  title: string
}

export const elementCatalog = [
  {
    name: 'button',
    title: 'Button',
    description: 'A Base UI-backed action control with semantic variants.',
    ontology: 'Actions',
    kind: 'primitive',
    registryType: 'registry:ui',
    dependencies: ['@base-ui/react', 'class-variance-authority', 'clsx', 'tailwind-merge'],
    tier: 'free',
    docsPath: '/components/button.md',
  },
  {
    name: 'card',
    title: 'Card',
    description:
      'A composed object container with header, content, action, footer slots, and a clipped-corner brand variant.',
    ontology: 'Objects',
    kind: 'primitive',
    registryType: 'registry:ui',
    dependencies: ['clsx', 'tailwind-merge'],
    tier: 'free',
    docsPath: '/components/card.md',
  },
  {
    name: 'badge',
    title: 'Badge',
    description: 'A compact property chip with semantic variants.',
    ontology: 'Properties',
    kind: 'primitive',
    registryType: 'registry:ui',
    dependencies: ['@base-ui/react', 'class-variance-authority', 'clsx', 'tailwind-merge'],
    tier: 'free',
    docsPath: '/components/badge.md',
  },
  {
    name: 'table',
    title: 'Table',
    description: 'Thin-ruled table primitives with wide-tracked uppercase headers.',
    ontology: 'Interfaces',
    kind: 'primitive',
    registryType: 'registry:ui',
    dependencies: ['clsx', 'tailwind-merge'],
    tier: 'free',
    docsPath: '/components/table.md',
  },
  {
    name: 'status-badge',
    title: 'StatusBadge',
    description: 'A compact semantic property indicator for common lifecycle states.',
    ontology: 'Properties',
    kind: 'component',
    registryType: 'registry:component',
    dependencies: ['@base-ui/react', 'class-variance-authority', 'clsx', 'tailwind-merge'],
    tier: 'free',
    docsPath: '/components/status-badge.md',
  },
  {
    name: 'data-grid',
    title: 'DataGrid',
    description: 'A typed read-only grid foundation for object collections.',
    ontology: 'Interfaces',
    kind: 'component',
    registryType: 'registry:component',
    dependencies: ['clsx', 'tailwind-merge'],
    tier: 'free',
    docsPath: '/components/data-grid.md',
  },
  {
    name: 'ledger-list',
    title: 'LedgerList',
    description:
      'A horizontal ledger-style row list with name, meta, mono figure, and status slots.',
    ontology: 'Interfaces',
    kind: 'component',
    registryType: 'registry:component',
    dependencies: ['clsx', 'tailwind-merge'],
    tier: 'free',
    docsPath: '/components/ledger-list.md',
  },
  {
    name: 'margin-note',
    title: 'MarginNote',
    description: 'A small editorial annotation with a burnt-orange marker detail.',
    ontology: 'Properties',
    kind: 'component',
    registryType: 'registry:component',
    dependencies: ['clsx', 'tailwind-merge'],
    tier: 'free',
    docsPath: '/components/margin-note.md',
  },
  {
    name: 'index-label',
    title: 'IndexLabel',
    description: 'A tiny zero-padded index number in mono with wide tracking.',
    ontology: 'Properties',
    kind: 'component',
    registryType: 'registry:component',
    dependencies: ['clsx', 'tailwind-merge'],
    tier: 'free',
    docsPath: '/components/index-label.md',
  },
  {
    name: 'milestone-marker',
    title: 'MilestoneMarker',
    description: 'A vertical milestone list with circular markers and connecting rules.',
    ontology: 'Interfaces',
    kind: 'component',
    registryType: 'registry:component',
    dependencies: ['clsx', 'tailwind-merge'],
    tier: 'free',
    docsPath: '/components/milestone-marker.md',
  },
  {
    name: 'empty-state',
    title: 'EmptyState',
    description: 'A branded empty state with serif headline, muted copy, and an action slot.',
    ontology: 'Interfaces',
    kind: 'component',
    registryType: 'registry:component',
    dependencies: ['clsx', 'tailwind-merge'],
    tier: 'free',
    docsPath: '/components/empty-state.md',
  },
  {
    name: 'dashboard-shell',
    title: 'DashboardShell',
    description:
      'A responsive application shell with navigation, header, metric slots, and a content workspace.',
    ontology: 'Interfaces',
    kind: 'block',
    registryType: 'registry:block',
    dependencies: ['clsx', 'tailwind-merge'],
    tier: 'free',
    docsPath: '/components/dashboard-shell.md',
  },
  {
    name: 'auth-card',
    title: 'AuthCard',
    description:
      'A provider-neutral authentication card with accessible credential fields and action slots.',
    ontology: 'Interfaces',
    kind: 'block',
    registryType: 'registry:block',
    dependencies: ['@base-ui/react', 'class-variance-authority', 'clsx', 'tailwind-merge'],
    tier: 'free',
    docsPath: '/components/auth-card.md',
  },
  {
    name: 'settings-layout',
    title: 'SettingsLayout',
    description:
      'A responsive settings shell with local navigation, page context, and a focused content region.',
    ontology: 'Interfaces',
    kind: 'block',
    registryType: 'registry:block',
    dependencies: ['clsx', 'tailwind-merge'],
    tier: 'free',
    docsPath: '/components/settings-layout.md',
  },
  {
    name: 'filterable-data-table',
    title: 'FilterableDataTable',
    description:
      'A typed table workflow with local search, a semantic filter, loading, empty, and error states.',
    ontology: 'Interfaces',
    kind: 'block',
    registryType: 'registry:block',
    dependencies: [
      '@base-ui/react',
      'class-variance-authority',
      'clsx',
      'lucide-react',
      'tailwind-merge',
    ],
    tier: 'free',
    docsPath: '/components/filterable-data-table.md',
  },
] as const satisfies readonly ElementMetadata[]
