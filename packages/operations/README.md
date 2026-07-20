# `@micropreneur/operations`

This package is the removable example domain for the public starter. Free Starter v1 proves a
complete, user-owned registry workflow without introducing workspaces or a generic workflow
engine.

Application code passes the authenticated user ID into every service operation. The package never
accepts ownership from form input, and all update/delete lookups include the owner predicate.

Forks can rename or remove this package after using it as the reference for schema, validation,
server functions, tests, and UI composition.

The next public architecture slice will migrate record ownership to one automatically created
personal workspace. That change is deliberately sequenced after the v1 release gate and does not
add workspace creation, invitations, roles, or team workflows; those remain Starter Pro concerns.
