# Repository Guidelines

## Project Structure & Module Organization

This repository is the Vibe Flow Pro app: a Next.js 15 TypeScript workflow console for building AI generation flows. Application code lives in `src/`. App Router pages, layouts, and API routes are under `src/app/`; workflow editor code is under `src/app/workflow/`. Shared UI primitives live in `src/components/`, with shadcn-style components in `src/components/ui/`. Reusable hooks and utilities live in `src/hooks/` and `src/lib/`.

Product identity and shell state belong in `src/app/workflow/product-profile.ts`. Prefer wiring new labels, metadata, and default workspace copy through that module instead of scattering strings across the app.

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

No test runner or `test` script is currently configured. For now, verify changes with `bun run lint` and `bun run build`. When adding tests, keep them close to the feature and use names like `component-name.test.tsx` or `utility-name.test.ts`. Add a package script before relying on test commands in CI or docs.

## Commit & Pull Request Guidelines

Git history currently contains only `Init project`, so no project-specific convention is established. Use short, imperative subjects such as `Add workflow node validation`.

Pull requests should include a concise description, verification steps, linked issues when available, and screenshots or screen recordings for workflow UI changes. Note new environment variables, API changes, or test gaps.

## Security & Configuration Tips

Do not commit API keys or local environment files. The app reads `OPENAI_API_KEY` on the server through `src/app/api/openai.ts`; do not reintroduce browser-cookie, localStorage, or Settings-based credential entry. Keep logging and error messages from exposing secrets.

## Work Tracking

Linear owns project state; GitHub owns branches, PRs, reviews, and checks. Active work is tracked under the **SLO Fleet** team (`FLEET`). Include the Linear issue ID in branch names and PR bodies when available. Update Linear when work starts, blocks, opens a PR, merges, parks, or completes. Keep GitHub Issues for repo-native intake only; approved work should be tracked in Linear.
