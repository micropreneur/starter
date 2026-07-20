# SettingsLayout

Ontology: **Interfaces**

A responsive settings shell with local navigation, page context, and a focused content region. Navigation uses ordinary links so it works with any router and retains a useful no-JavaScript fallback.

```bash
pnpm dlx shadcn@latest add https://elements.micropreneur.dev/r/settings-layout.json
```

```tsx
<SettingsLayout
  heading="Settings"
  description="Manage your account and product preferences."
  items={[{ label: 'Profile', href: '/settings/profile', active: true }]}
>
  <ProfileForm />
</SettingsLayout>
```

Install from the public Elements Free registry; the CLI writes source into your project.
