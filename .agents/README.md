# Agent skills in forks

The canonical skill source lives in `.agents/shared-skills/`. Entries in `.agents/skills/` are relative symlinks to those shared directories:

```text
.agents/shared-skills/starter-repo/  # real, versioned skill source
.agents/skills/starter-repo -> ../shared-skills/starter-repo
```

Relative links keep working when the repository moves or is freshly cloned. Git stores the link target as a symlink entry; verify with `git ls-files -s .agents/skills/starter-repo` (mode `120000`) and `test -L .agents/skills/starter-repo`.

On Windows, enable Developer Mode or clone from an elevated shell with `git config --global core.symlinks true`. Filesystems or checkout clients without symlink support may materialize the link as a small text file; WSL is the recommended fallback.

Add shared skills by creating a real directory under `shared-skills`, then add a relative link under `skills`. Do not point at an absolute machine-specific path.

The docs generator discovers each canonical `SKILL.md` and publishes its metadata at `/skills/index.json`, its raw content at `/skills/<name>.md`, and the same record through the MCP skill tools. It also publishes the current Agent Skills discovery index at `/.well-known/agent-skills/index.json` and the legacy Docus-compatible alias at `/.well-known/skills/index.json`. Each index points to exact served `SKILL.md` bytes; the current index includes a SHA-256 digest.

Regenerate and validate every view after changing a skill:

```bash
pnpm docs:generate
pnpm --filter docs agent:check
```
