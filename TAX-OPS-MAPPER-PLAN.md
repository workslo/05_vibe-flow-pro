# TAX-OPS-MAPPER-PLAN.md — build the Trade Trace workspace inside Vibe Flow Pro

**Vibe Flow Pro** (this repo, `workslo/05_vibe-flow-pro`, deployed on Vercel) is a multi-workspace React Flow console.
`src/app/workspace-catalog.ts` has three workspaces; two are `ready`:
- **AI development loop** (`/development-loop`) — built.
- **Creative generation** (`/workflow`) — built.
- **Tax operations mapper** (`tax-ops-mapper`) — `status: 'next'`, **not built. This is Trade Trace.**

Goal: build the `tax-ops-mapper` workspace so Trade Trace becomes the third feature — a read-only map to
"visualize tax workflows, controls, owners, and handoffs." **Not a repo merge.** Intended loop model: **Fable / `claude-fable-5`**.

---

## Loop contract — read this every iteration

1. Read this whole file. Find the **first unchecked `[ ]`** item under "Checklist".
2. Do **only that one item**.
3. Verify: `bun run lint` **and** `bun run test` **and** `bun run build`. (Run `bun run test:e2e` only where an item says to.)
4. If green: change `[ ]` to `[x]`, then `git commit` (conventional message). One commit per item.
5. If red and unfixable this turn, or the item needs a human decision: leave the box, append `  - ⚠ BLOCKED: <reason>`, and **stop the loop**.
6. If every box is checked, **stop the loop**.

## Invariants

- **Base = this repo on branch `feat/tax-ops-mapper-workspace`** (off `main`). Never commit to `main`.
- **Do not touch the other two workspaces** (`development-loop/`, `workflow/`) or their API routes, except the one line in `workspace-catalog.ts` that enables tax-ops-mapper.
- **Follow the `development-loop` workspace as the architectural template**: `page.tsx` (metadata + Provider + Workspace component) → `components/` → `domain/` → `store/` → `mock-data.ts`. Match its file layout and conventions.
- **No AI / no OpenAI.** Tax-ops-mapper is a static visualization of seeded lineage data — no generation, no API route, no `OPENAI_API_KEY`.
- **bun** (repo uses `bun.lock`). Don't add npm/pnpm lockfiles. (A stray `package-lock.json` is present — leave it; flag for human cleanup, don't act on it.)
- **Vercel-native Next** — no Cloudflare adapter, no static export.

## Source material

- **Lineage workbench lives in git history at commit `10ed89f`** ("Build TradeTrace lineage workbench"). Recover files with `git show 10ed89f:<path>`:
  - `src/app/workflow/lineage-data.ts` — the domain model: `lineageStages` (8 stages: client-intent → order-capture → execution → books-records → tax-lot → tax-review → form-production → client-filing, each with owner/system/summary/dataFields/controls/outputs/risks) and `lineageBreaks` (missing-basis/High, proceeds-variance/Medium, wash-sale-mismatch/Medium).
  - `src/app/workflow/components/nodes/lineage-stage-node.tsx` — the stage card node.
  - `src/app/workflow/product-profile.ts` — TradeTrace identity + the 01–04 stage summary.
  - The **Break Explorer** panel + Data Passport detail were rendered in that commit's workflow page/sidebar — recover them too (`git show 10ed89f:src/app/workflow/...` for the page and sidebar components).
- The standalone `trade-trace` Vite/Hono repo is **reference only** — not a source, per decision.

---

## Checklist

### Phase 0 — Prep
- [x] `git switch -c feat/tax-ops-mapper-workspace` (off `main`). `bun install`. Confirm `bun run lint` + `bun run test` + `bun run build` are green **before** any change. Commit nothing.

### Phase 1 — Recover the lineage source into the new workspace
- [ ] Create `src/app/tax-ops-mapper/` and recover `lineage-data.ts` from `10ed89f` into `src/app/tax-ops-mapper/domain/lineage-data.ts`; recover `product-profile.ts` into `src/app/tax-ops-mapper/domain/product-profile.ts`. Fix imports to the new paths. (Build/lint green — these are pure TS.)
- [ ] Recover `lineage-stage-node.tsx` from `10ed89f` into `src/app/tax-ops-mapper/components/lineage-stage-node.tsx`; adapt imports (shared UI already exists under `@/components`).

### Phase 2 — Scaffold the workspace (mirror development-loop)
- [ ] Add `src/app/tax-ops-mapper/store/` — a React Flow store provider for the lineage graph (follow `development-loop/store` or the existing `workflow/store` pattern; simplest that renders nodes/edges).
- [ ] Add `src/app/tax-ops-mapper/mock-data.ts` — seed the canvas from `lineageStages` (map each stage → a `lineage-stage-node`, wire sequential edges), like the old workflow mock-data did.
- [ ] Add `src/app/tax-ops-mapper/components/tax-ops-workspace.tsx` — the React Flow canvas rendering the lineage-stage nodes + the **Break Explorer** panel (recovered from `10ed89f`) + a stage/Data-Passport sidebar. Read-only (no run controls).
- [ ] Add `src/app/tax-ops-mapper/page.tsx` — metadata + Provider + `<TaxOpsWorkspace/>`, mirroring `development-loop/page.tsx`.

### Phase 3 — Wire it into the console
- [ ] In `src/app/workspace-catalog.ts`, change the `tax-ops-mapper` entry to add `href: '/tax-ops-mapper'` and set `status: 'ready'`. The picker (`src/app/page.tsx`) already renders `ready` workspaces as links — verify the card now navigates and the workspace renders (`bun run build`).

### Phase 4 — Tests (mirror development-loop's coverage)
- [ ] Vitest unit: `src/app/tax-ops-mapper/domain/lineage-data.test.ts` — assert stage/break integrity (ids unique, breaks reference real stages/fields). Run `bun run test`.
- [ ] Playwright e2e: from the picker, click **Tax operations mapper** → assert the lineage stages + Break Explorer render. Add to the existing Playwright suite. Run `bun run test:e2e`.

### Phase 5 — Docs
- [ ] Update `AGENTS.md` + `README.md`: three workspaces, tax-ops-mapper now `ready`, sourced from the restored lineage workbench. Note the standalone `trade-trace` repo is superseded by this workspace.

---

## Done criteria
All boxes checked; `bun run lint` + `bun run test` + `bun run build` + `bun run test:e2e` green on `feat/tax-ops-mapper-workspace`. A human opens the PR (include the Linear/FLEET issue id if one exists) and deploys via Vercel. The loop does neither.
