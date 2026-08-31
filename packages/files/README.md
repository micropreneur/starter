# `@micropreneur/files`

Provider-neutral upload policy and lifecycle for the Starter avatar and personal-workspace logo
examples. The package owns content constraints, owner-derived staging and final object keys, and
post-upload validation. Upload grants bind the declared byte length, and completion checks the
stored object's actual size and image magic bytes before copying it to a new final key. This keeps
oversized bodies out at admission and ensures a reusable staging grant cannot mutate a served
image. The web composition root supplies Cloudflare R2 object access and SigV4 presigning.

Callers never provide an owner or workspace ID. Routes resolve authenticated identity first, then
pass that server-owned ID to `FileUploadService`.
