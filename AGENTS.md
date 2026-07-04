# Repository Guidelines

## Project Structure & Module Organization

This repository is the Vibe Flow Pro app: a Next.js 15 TypeScript workflow console for building AI generation flows. Application code lives in `src/`. App Router pages, layouts, and API routes are under `src/app/`; workflow editor code is under `src/app/workflow/`. Shared UI primitives live in `src/components/`, with shadcn-style components in `src/components/ui/`. Reusable hooks and utilities live in `src/hooks/` and `src/lib/`.

Product identity and shell state belong in `src/app/workflow/product-profile.ts`. Prefer wiring new labels, metadata, and default workspace copy through that module instead of scattering strings across the app.

The bounded AI development loop lives under `src/app/development-loop/`. Keep the engine and schemas pure, keep adapter selection server-side, and treat `/development-loop` as a typed artifact surface rather than a place that mutates the repo or runs shell commands.

Copied agent-support material is grouped in `skills copy/`, `commands copy/`, `hooks copy/`, `references copy/`, and `docs copy/`. Treat these as content/tooling assets unless a task targets them.

## Build, Test, and Development Commands

Use Bun by default because `bun.lock` is present:

- `bun install`: install dependencies.
- `bun run dev`: start the local Next.js dev server with Turbopack.
- `bun run build`: create a production build and run framework-level checks.
- `bun run start`: serve the production build after `bun run build`.
- `bun run lint`: run the configured Next.js lint script.

## Coding Style & Naming Conventions

Write TypeScript and React components with strict typing enabled. Use 2-space indentation, single quotes, semicolons, and trailing commas. Prefer path aliases such as `@/components/ui/button` and `@/lib/utils`.

Name React components in PascalCase, hooks with a `use` prefix, and utility files in kebab-case or the existing local pattern. Keep workflow-specific code inside `src/app/workflow/`; only promote code to shared folders when it is genuinely reused.

## Testing Guidelines

Use the repo scripts for verification:

- `bun run test`
- `bun run test:e2e`
- `bun run lint`
- `bun run build`

Keep unit and component tests close to the feature with names like `component-name.test.tsx` or `utility-name.test.ts`. Playwright coverage lives in `tests/`.

Automated tests must never call live OpenAI. For development-loop browser coverage, use the scripted adapter via `DEVELOPMENT_LOOP_ADAPTER=scripted`, which is already injected by the Playwright web server config.

## Commit & Pull Request Guidelines

Git history currently contains only `Init project`, so no project-specific convention is established. Use short, imperative subjects such as `Add workflow node validation`.

Pull requests should include a concise description, verification steps, linked issues when available, and screenshots or screen recordings for workflow UI changes. Note new environment variables, API changes, or test gaps.

## Security & Configuration Tips

Do not commit API keys or local environment files. The app reads `OPENAI_API_KEY` on the server through `src/app/api/openai.ts`; do not reintroduce browser-cookie, localStorage, or Settings-based credential entry. Keep logging and error messages from exposing secrets.

For `src/app/development-loop/**`, preserve these boundaries:

- Keep the loop engine deterministic and typed.
- Select execution adapters on the server only.
- Do not let the first loop write repository files, execute shell commands, create commits, push branches, or open pull requests inside the product.
