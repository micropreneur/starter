# FilterableDataTable

Ontology: **Interfaces**

A typed local table workflow with text search, one semantic filter, a result count, and loading, empty, and error states. Supply row accessors rather than coupling the block to a domain model. Move filtering server-side when a product outgrows an in-memory collection.

```bash
pnpm dlx shadcn@latest add https://elements.micropreneur.dev/r/filterable-data-table.json
```

```tsx
<FilterableDataTable
  columns={columns}
  rows={records}
  getRowId={(record) => record.id}
  getSearchText={(record) => `${record.name} ${record.owner}`}
  getFilterValue={(record) => record.status}
  filterOptions={[{ label: 'Active', value: 'active' }]}
/>
```

Install from the public Elements Free registry; the CLI writes source into your project.
