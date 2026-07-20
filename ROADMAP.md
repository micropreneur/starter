# Product boundary and roadmap

## Free Starter v1

Free Starter proves the shortest coherent path to a paid, single-user SaaS:

- Credential auth plus optional Google OAuth through `AuthPort`.
- Dedicated auth routes and one automatically provisioned personal workspace with activation onboarding.
- Verification, recovery, profile, password, and confirmed deletion through `EmailPort`.
- A removable Operations Registry with user-owned CRUD, fixed workflow states, tags, filters, pagination, and authorization tests.
- One monthly Stripe price through `BillingService`, local subscription state, idempotent webhooks, the customer portal, and an app-owned `registry.export` entitlement.
- A secret-light local path: D1 and captured email work without provider credentials; billing is visibly disabled until all Stripe sandbox values exist.

## Planned sequence

### 1. Harden and release Free Starter v1

Finish the current release from a clean checkout before beginning the Operations Registry ownership migration. The release gate covers migrations, authentication, personal workspace onboarding, account lifecycle, Operations Registry isolation and CRUD, Stripe sandbox billing and entitlements, registry installation, MCP discovery, browser QA, and secret/artifact review.

### 2. Finish the single-member workspace substrate in Free Starter

Free Starter now creates one personal workspace and owner membership for every user, stores signup onboarding answers, and resolves the dashboard workspace from authenticated identity. The remaining slice migrates Operations Registry ownership from `userId` to `workspaceId`. Every migrated server function must resolve membership internally, and integration tests must prove cross-workspace isolation.

This is an architectural seam, not a team feature. Free Starter does not expose multiple-workspace creation, invitations, roles, ownership transfer, seat billing, or custom domains.

### 3. Scope Starter Pro billing and entitlements to workspaces

Before enabling multiple workspaces, move Stripe customer, subscription, and entitlement ownership from the user to the workspace. Preserve the thin `BillingService` boundary and keep provider state out of application authorization checks.

### 4. Implement Starter Pro multi-workspace tenancy and membership

Add workspace creation and switching, invitations, membership management, owner/admin/member roles, ownership transfer, deletion safeguards, and authorization coverage. Extend the Operations Registry with team workflows only after the tenant boundary is proven.

### 5. Support customer custom domains through Cloudflare for SaaS

Add a workspace-domain lifecycle backed by Cloudflare for SaaS Custom Hostnames: normalized unique hostnames, provider identifiers, ownership and certificate verification states, manual CNAME/TXT instructions, and host-to-workspace resolution. Start with public customer-facing workspace surfaces while authentication and the dashboard remain on the canonical application domain.

Workers Custom Domains remain the deployment-owner path for the application's own domain. Domain Connect is a later one-click DNS enhancement after the manual custom-hostname flow is reliable; customers must never provide the application with broad Cloudflare API tokens.

## Deliberately deferred

Organizations beyond the bounded workspace slices above, customizable RBAC, comments, approvals, audit logs, attachments, jobs, notifications, connectors, generic workflows, reporting, admin tooling, AI features, premium elements, licensing, multi-plan billing, seats, usage billing, and Domain Connect stay out until a concrete product slice proves the need. Free Starter does not pretend Stripe and alternative billing providers are interchangeable.
