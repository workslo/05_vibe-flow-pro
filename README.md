# Vibe Flow Pro

Vibe Flow Pro is a polished workflow console for designing, running, and inspecting AI generation flows. It pairs a React Flow canvas with a small Zustand store, Next.js App Router routes, and server-side Vercel AI SDK calls.

The product direction is intentionally close to a professional workflow platform: the first screen introduces Vibe Flow Pro, `/workflow` opens the working canvas, and product copy is anchored in `src/app/workflow/product-profile.ts`.

The app also includes `/development-loop`: a bounded AI development workspace that captures a typed feature brief, test plan, code proposal, test evidence, and validation result for each iteration.

## Getting Started

Use Bun for local work because this repo includes `bun.lock`.

```bash
bun install
```

Create `.env.local` with your OpenAI key:

```bash
OPENAI_API_KEY=sk-...
```

Then start the app:

```bash
bun run dev
```

Open `http://localhost:3000` for the Vibe Flow Pro shell, `http://localhost:3000/workflow` for the canvas, or `http://localhost:3000/development-loop` for the bounded development loop.

## Local Secret Model

OpenAI credentials are local developer configuration. Users are not asked to paste a key into Settings, and the browser does not store the key in a cookie.

Generation nodes call local API routes:

- `src/app/api/generate-text/route.ts`
- `src/app/api/generate-image/route.ts`

Both routes use `src/app/api/openai.ts`, which reads `OPENAI_API_KEY` from the server environment and returns a clear runtime error when it is missing.

The development loop follows the same server-only rule. Adapter selection happens on the server, and automated tests use `DEVELOPMENT_LOOP_ADAPTER=scripted` so browser coverage never calls live OpenAI.

## Product State

Keep product identity in `src/app/workflow/product-profile.ts`. It currently drives:

- Root page brand and positioning.
- Workflow page metadata.
- Sidebar label.
- Top-bar flow status.
- Default workflow stage labels.

This keeps project state deliberate as the shell grows. If the product name, positioning, or default workspace posture changes, update that module first and then wire any new surface to it.

## Tech Stack

- **Next.js 15 App Router** for pages, layouts, API routes, and server runtime.
- **React 19** for UI components.
- **React Flow** for the node canvas.
- **Zustand** for workflow state, node updates, edges, selection-adjacent behavior, and theme-aware app state.
- **Tailwind CSS v4 and shadcn/Radix primitives** for UI structure.
- **Vercel AI SDK** with OpenAI provider calls from server routes only.
- **ELKjs** for automatic graph layout.

## Workflow Surface

The main app lives under `src/app/workflow/`.

- `components/`: canvas controls, nodes, edges, settings, and workflow runtime UI.
- `config.ts`: available node definitions and handle geometry.
- `hooks/`: drag/drop, layout, and workflow runner hooks.
- `layouts/sidebar-layout/`: app sidebar and workflow shell.
- `mock-data.ts`: initial flow loaded into the store.
- `openai-data.ts`: supported text and image model options.
- `store/`: Zustand store and provider.

The bounded development loop lives under `src/app/development-loop/`.

- `domain/`: pure schemas, template validation, loop engine, and adapters.
- `components/`: the sidebar, stage canvas, and live evidence inspector.
- `store/`: browser-session run state and typed artifacts.
- `page.tsx`: `/development-loop` route entrypoint.

## State Management

Zustand is the source of confidence here. The workflow store owns nodes, edges, connect behavior, and node mutation actions so the canvas has one clear application state path. React Flow still handles the canvas primitives, but app-level decisions move through the store instead of scattered component state.

That gives Vibe Flow Pro a stable base for bolder product work: run history, evaluations, trace views, saved flows, and workspace-level state can be added without rethinking the canvas foundation.

## AI Development Loop

`/development-loop` is intentionally bounded. The first loop plans, proposes code, runs scripted or server-backed tests, validates the outcome, and either passes, blocks, stops, or revises within a fixed iteration cap. The UI records typed artifacts at each stage so the browser flow can show deterministic evidence without executing shell commands, writing repository files, creating commits, or opening pull requests from inside the product.

For automated coverage, keep the browser flow on the scripted adapter:

```bash
DEVELOPMENT_LOOP_ADAPTER=scripted bun run dev -- --hostname 127.0.0.1 --port 3100
```

Use that configuration only for local automation and E2E verification.

## Commands

```bash
bun run test
bun run test:e2e
bun run lint
bun run dev
bun run build
bun run start
```

## Security

- Never commit `.env*` files.
- Keep `OPENAI_API_KEY` server-side.
- Do not log secrets from API routes or node processors.
- Treat client storage as UI preference storage only, not credential storage.
