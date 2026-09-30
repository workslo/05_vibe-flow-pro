# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, and others) working in this repository. `CLAUDE.md` is a symlink to this file. Edit `AGENTS.md` only, and don't replace the symlink with a copy.

## What this is

Vibe Flow Pro is a Next.js 15 App Router app (React 19, TypeScript strict) with three workspaces, all listed in `src/app/workspace-catalog.ts` and linked from the root page:

- `/development-loop`: a bounded AI development loop that records typed artifacts per iteration.
- `/workflow`: the creative-generation canvas (text and image generation nodes).
- `/tax-ops-mapper`: a read-only trade-to-1099 lineage map built from seeded data.

Each workspace is self-contained under `src/app/<workspace>/` with its own `components/`, `store/`, `mock-data.ts`, and `page.tsx`. Shared primitives live in `src/components/` (shadcn-style in `src/components/ui/`), `src/hooks/`, and `src/lib/`. Keep workspace code inside its workspace, and promote it to a shared folder only when a second workspace actually reuses it.

The production target is **Cloudflare Workers via `@opennextjs/cloudflare`**. The app is server-capable: don't add `output: 'export'` or an Edge runtime override.

## Commands

Use Bun (`bun.lock` is the lockfile). The version is pinned in `package.json` `packageManager` (`bun@1.3.14`), and CI (`.github/workflows/ci.yml`) reads it from there.

```bash
bun install
bun run dev              # next dev --turbopack on :3000
bun run lint             # eslint, --max-warnings=0
bun run test             # vitest run (jsdom), src/**/*.test.ts(x)
bun run test:e2e         # playwright, tests/*.spec.ts
bun run build            # next build
bun run build:worker     # OpenNext Cloudflare bundle
bun run preview          # build:worker + run it in the Workers runtime
bun run test:e2e:worker  # Playwright against the Worker preview
bun run deploy           # production deploy; only when a deploy is authorized
bun run cf-typegen       # regenerate cloudflare-env.d.ts
```

Single tests:

```bash
bunx vitest run src/app/development-loop/domain/engine.test.ts
bunx vitest run -t "name of the test"
bunx playwright test tests/tax-ops-mapper.spec.ts
```

Vitest excludes `tests/`. Playwright owns that folder and starts its own dev server on `127.0.0.1:3100` with `DEVELOPMENT_LOOP_ADAPTER=scripted` (`reuseExistingServer: false`, so free port 3100 first). The pre-PR gate is `lint`, `test`, `build`, and `test:e2e`. CI runs the same gate on every PR and on pushes to `main`, and uploads the Playwright report when a run fails.

Local env: `.env.local` with `OPENAI_API_KEY` for `bun run dev`. For a Worker preview, use an untracked `.dev.vars` with `NEXTJS_ENV=development` and `OPENAI_API_KEY`. `/tax-ops-mapper` needs no key.

## Architecture

### Server-only AI calls

Every model call runs server-side through `src/app/api/openai.ts`, which reads `OPENAI_API_KEY` from the environment. The API routes are `api/generate-text`, `api/generate-image`, and `api/development-loop/stage`. Don't reintroduce browser-cookie, localStorage, Settings-dialog, or `NEXT_PUBLIC_` key entry. Client storage is for UI preferences only.

### `/workflow` canvas

The Zustand store (`workflow/store/app-store.ts`) owns nodes, edges, connect behavior, and node mutations. React Flow renders the canvas, but app-level state changes go through the store. `config.ts` defines each node type's handles. `hooks/use-workflow-runner.tsx` walks the graph, collects incoming data **per target handle id** (for example `text-system` and `text-prompt`), and dispatches to a per-type function in `components/nodes/processors/`. Those processors `fetch` the API routes. A new node type touches the node component, `nodesConfig`, the `nodeProcessors` registry in `components/nodes/index.tsx`, and usually a processor.

Product identity (brand, page metadata, sidebar label, flow status, default stage labels) lives in `workflow/product-profile.ts`. Route new copy through it instead of scattering strings.

### `/development-loop`

`domain/` is pure: zod schemas (`schemas.ts`), template validation, and `engine.ts`'s `runDevelopmentLoop`. That function drives test-plan → code → test → validate through a `DevelopmentExecutionAdapter` interface, emits typed events, and stops at an iteration cap (default 3). The browser uses `client-adapter.ts`, which POSTs `{ stage, input }` to `api/development-loop/stage` and zod-parses the returned artifact. That route picks the real adapter **on the server**: `scripted-adapter.ts` when `DEVELOPMENT_LOOP_ADAPTER=scripted`, and otherwise `server/openai-adapter.ts`. `store/run-store.ts` holds browser-session run state.

Boundaries to preserve:

- Keep the engine deterministic and typed.
- Select adapters on the server only.
- The loop never writes repo files, runs shell commands, commits, pushes, or opens PRs from inside the product.
- Automated tests never call live OpenAI. Use the scripted adapter.

### `/tax-ops-mapper`

A read-only visualization, restored from the TradeTrace lineage workbench (commit `10ed89f`). It supersedes the standalone `shaneslo/trade-trace` repo. It makes no AI calls, has no API routes, and needs no key. Keep it that way (FLEET-68 enforced this). Stage and break data belong in `domain/lineage-data.ts`. The store tracks nodes, edges, the selected stage, and the active break.

## Style

- TypeScript strict; 2-space indent, single quotes, semicolons, trailing commas.
- Use the `@/` path alias (`@/components/ui/button`, `@/lib/utils`).
- PascalCase components, `use`-prefixed hooks, kebab-case files (or the local pattern).
- Unit tests sit next to the code as `name.test.ts(x)`.
- Import zod as `zod/v4`, matching the existing code.

## Commits, PRs, and tracking

- Conventional commits, with the tracker ID in the subject: `feat: add Cloudflare Workers target (FLEET-67)`.
- PRs are squash-merged to `main`.
- PR bodies explain why, list verification steps, include screenshots for UI changes, and note any new env vars or test gaps.
- Linear is the tracker. Recent work used `FLEET-*` IDs. Put the ID in branch names and PR bodies when one exists.
- GitHub owns branches, PRs, reviews, and checks.

## Repo-local notes

- `docs/` holds handoff briefs and design specs (`docs/superpowers/{plans,specs}`). Read the relevant one when a task continues that work.
- `TAX-OPS-MAPPER-PLAN.md` is the historical plan for the mapper workspace.
- `.worktrees/` is gitignored and is the place for local worktrees.
