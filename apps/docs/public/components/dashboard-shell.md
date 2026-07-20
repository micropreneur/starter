# DashboardShell

Ontology: **Interfaces**

A responsive application shell with primary navigation, an optional header, metric slots, and a content workspace. Supply product-specific navigation and data through props; the block contains no router, authentication provider, or domain imports.

```bash
pnpm dlx shadcn@latest add https://elements.micropreneur.dev/r/dashboard-shell.json
```

```tsx
<DashboardShell
  brand="Acme"
  header={<h1>Overview</h1>}
  metrics={[{ label: 'Customers', value: '1,429', detail: '+8.1%' }]}
  navItems={[{ label: 'Overview', href: '/app', active: true }]}
>
  <YourDashboardContent />
</DashboardShell>
```

Install from the public Elements Free registry; the CLI writes source into your project.
