# AuthCard

Ontology: **Interfaces**

A provider-neutral credential form composed from Card, Field, Input, and Button. Connect the form's `onSubmit` handler to your application's auth port; do not import an authentication SDK into the block.

```bash
pnpm dlx shadcn@latest add https://elements.micropreneur.dev/r/auth-card.json
```

```tsx
<AuthCard
  forgotPasswordHref="/forgot-password"
  onSubmit={handleSignIn}
  socialAction={<YourSocialSignInAction />}
/>
```

Install from the public Elements Free registry; the CLI writes source into your project.
