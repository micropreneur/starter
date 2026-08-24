# `@micropreneur/operations`

This package is the removable example domain for the public starter. Free Starter proves a
complete registry workflow owned by its one automatically provisioned personal workspace without
introducing workspace management or a generic workflow engine.

Application server boundaries resolve active workspace membership from the authenticated user and
pass only that server-derived workspace ID into service operations. The package never accepts
ownership from form input, and all reads and mutations include the workspace predicate.

Forks can rename or remove this package after using it as the reference for schema, validation,
server functions, tests, and UI composition.

Free Starter still exposes no workspace creation, invitations, roles, or team workflows; those
remain Starter Pro concerns.
