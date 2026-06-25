# AI Development Loop Design

**Status:** Approved architecture  
**Date:** June 18, 2026  
**Product:** Vibe Flow Pro

## Purpose

Add the first production-shaped iterative workflow to Vibe Flow Pro:

1. Accept a feature brief.
2. Produce a test plan.
3. Produce a code proposal.
4. Execute a structured test simulation.
5. Validate the result.
6. Finish on success or route validation feedback back through code and test for another bounded iteration.

This increment proves the workflow semantics, artifact contracts, run history, and testing strategy before Vibe Flow Pro is allowed to modify repositories or execute arbitrary shell commands.

## Scope

### Included

- A home-screen entry for an **AI development loop** workspace.
- A React Flow template showing:
  - Feature brief
  - Test plan
  - Code feature
  - Test feature
  - Validate result
  - A visible feedback edge from validation to coding
- Typed artifacts for every stage.
- A bounded loop with `pass`, `revise`, and `blocked` validation outcomes.
- Run and iteration history visible beside the canvas.
- A server-side OpenAI execution adapter.
- A deterministic scripted adapter for automated tests.
- Unit, integration, and Playwright end-to-end coverage.
- A feature branch, pull request, and adversarial review loop.

### Deferred

- Writing code into a repository.
- Running arbitrary shell commands or repository test suites.
- Git commits, pushes, or pull requests initiated by workflow nodes.
- Google Search, keeper-document ingestion, agent instructions, or prompt libraries.
- The tax-operations mapping workspace. It is the next product increment and will reuse the workspace picker, graph store, and node presentation patterns created here.

## User Experience

### Home

The root page becomes a workspace chooser rather than a single-workflow introduction.

- **AI development loop:** active and opens the new iterative workflow.
- **Creative generation:** opens the existing text-to-image workflow.
- **Tax operations mapper:** shown as the next workspace, but not implemented in this increment.

The page remains a compact product console. It does not become a marketing landing page.

Workspace routes are explicit:

- `/development-loop`: the new iterative development workflow.
- `/workflow`: the existing creative generation workflow.

### Development Loop Workspace

The workspace uses a three-part operational layout:

1. **Left rail:** available development nodes and workspace navigation.
2. **Canvas:** the five-stage workflow and feedback edge.
3. **Run inspector:** current status, iteration count, stage artifacts, validation evidence, and final outcome.

The signature interaction is the validation node visibly routing a failed result back to the code node while the run inspector starts the next iteration.

### Run Controls

- A feature brief text area supplies the requested change and acceptance criteria.
- **Run loop** starts a new run.
- **Stop** aborts the current run after the active stage settles.
- The default maximum is three iterations.
- A completed run displays `Passed`, `Blocked`, `Stopped`, or `Iteration limit reached`.
- A new run replaces node status but preserves prior run summaries in the current browser session.

## Domain Model

All artifacts are validated with Zod at the server boundary and again before entering client state.

```ts
type DevelopmentStage =
  | 'test-plan'
  | 'code'
  | 'test'
  | 'validate';

type RunStatus =
  | 'idle'
  | 'running'
  | 'passed'
  | 'blocked'
  | 'stopped'
  | 'iteration-limit';

type ValidationVerdict = 'pass' | 'revise' | 'blocked';
```

### Feature Brief

```ts
type FeatureBrief = {
  summary: string;
  acceptanceCriteria: string[];
};
```

### Test Plan Artifact

```ts
type TestPlanArtifact = {
  strategy: string;
  cases: Array<{
    id: string;
    name: string;
    level: 'unit' | 'integration' | 'e2e';
    expectedBehavior: string;
  }>;
};
```

### Code Artifact

This is a proposal, not executable code in this increment.

```ts
type CodeArtifact = {
  summary: string;
  files: Array<{
    path: string;
    change: string;
  }>;
  assumptions: string[];
};
```

### Test Artifact

```ts
type TestArtifact = {
  status: 'passed' | 'failed';
  cases: Array<{
    testCaseId: string;
    status: 'passed' | 'failed';
    evidence: string;
  }>;
};
```

### Validation Artifact

```ts
type ValidationArtifact = {
  verdict: ValidationVerdict;
  rationale: string;
  feedback: string[];
};
```

### Run Record

```ts
type DevelopmentRun = {
  id: string;
  status: RunStatus;
  featureBrief: FeatureBrief;
  maxIterations: number;
  iterations: DevelopmentIteration[];
  startedAt: string;
  finishedAt?: string;
  error?: string;
};

type DevelopmentIteration = {
  number: number;
  testPlan: TestPlanArtifact;
  code: CodeArtifact;
  test: TestArtifact;
  validation: ValidationArtifact;
};
```

## Architecture

### Separate the Graph From Execution

React Flow remains the visual model and editor. A new pure TypeScript development-loop engine owns execution semantics. The engine does not read from React components or mutate the canvas directly.

The UI converts the canonical workflow template into an execution request. Engine events update the Zustand store, which then updates node statuses and the run inspector.

### Canonical Template

The first loop is a canonical workflow, not an arbitrary cyclic graph interpreter. This keeps the implementation small and makes iteration rules explicit.

The template contains:

```text
Feature brief -> Test plan -> Code -> Test -> Validate
                              ^                 |
                              |------revise-----|
```

The graph may be repositioned visually, but required stage identities and connections are validated before a run.

### Execution Adapter

The engine depends on an adapter rather than directly calling OpenAI:

```ts
interface DevelopmentExecutionAdapter {
  createTestPlan(input: TestPlanInput): Promise<TestPlanArtifact>;
  createCodeProposal(input: CodeInput): Promise<CodeArtifact>;
  executeTests(input: TestInput): Promise<TestArtifact>;
  validateResult(input: ValidationInput): Promise<ValidationArtifact>;
}
```

Two adapters are required:

- **OpenAI adapter:** server-side, uses `OPENAI_API_KEY`, and requests structured outputs validated by the artifact schemas.
- **Scripted adapter:** deterministic fixtures used by integration and end-to-end tests. It can model a first-iteration revision followed by a passing second iteration.

A later `WorktreeExecutionAdapter` can implement the same boundary while writing files and executing approved commands in an isolated runtime.

### Engine Algorithm

For each iteration:

1. Create or refine the test plan.
2. Create a code proposal using the feature brief, test plan, and prior validation feedback.
3. Execute the structured tests.
4. Validate the test evidence against the feature brief and test plan.
5. Handle the verdict:
   - `pass`: mark the run passed and stop.
   - `blocked`: mark the run blocked and stop.
   - `revise`: append the iteration and begin another iteration with feedback.
6. If the next iteration would exceed `maxIterations`, mark the run `iteration-limit`.

Each stage emits `stage-started`, `stage-completed`, or `stage-failed`. Each iteration emits `iteration-completed`. The engine emits one final `run-completed` event.

### State Ownership

The existing Zustand store remains the source of truth for canvas nodes and edges. A focused run slice is added for:

- Active run
- Current stage
- Current iteration
- Run summaries
- Stage artifacts
- Stop request

Execution logic remains outside the store. Store actions only apply engine events.

## Server Boundary

A single Next.js route receives one stage request at a time:

```text
POST /api/development-loop/stage
```

The request includes the stage, feature brief, current iteration context, and prior feedback. The response is one schema-validated artifact.

The route:

- Selects the schema and system instruction for the requested stage.
- Uses the server-only OpenAI provider.
- Rejects malformed requests with `400`.
- Returns a clear configuration error when `OPENAI_API_KEY` is absent.
- Never accepts commands, filesystem paths to execute, or arbitrary tool definitions.

The client always calls this route. The server selects:

- The OpenAI adapter by default.
- The scripted adapter only when the trusted server environment variable `DEVELOPMENT_LOOP_ADAPTER=scripted` is set.

The adapter cannot be selected through request data, query parameters, or client state.

## Error Handling

- **Invalid graph:** prevent the run and identify the missing stage or connection.
- **Invalid artifact:** fail the active stage and preserve the raw error message without entering malformed data into state.
- **Provider failure:** mark the run blocked with the failed stage and retry guidance.
- **Stop request:** finish the in-flight request, then mark the run stopped.
- **Iteration limit:** preserve all iteration evidence and explain that validation never passed.
- **Missing API key:** keep the canvas usable and show local developer setup guidance in the run inspector.

## Testing Strategy

### Tooling

- **Vitest:** pure domain and integration tests.
- **React Testing Library:** focused component behavior where DOM interaction adds value.
- **Playwright:** browser-level end-to-end workflows.
- Existing ESLint and Next.js production build remain required gates.

### Unit Tests

- Every Zod schema accepts valid artifacts and rejects malformed artifacts.
- Template validation rejects missing, duplicate, or incorrectly connected required stages.
- Engine stops on `pass`.
- Engine stops on `blocked`.
- Engine routes `revise` feedback into the next code input.
- Engine stops at the configured iteration limit.
- Stop requests prevent the next stage from starting.
- Run-store event reducers preserve completed iteration evidence.

### Integration Tests

Use the scripted adapter against the real engine:

- Pass on the first iteration.
- Fail once, revise, then pass on the second iteration.
- Reach the iteration limit.
- Surface an adapter exception as a blocked run.

These tests assert real artifacts and event order, not mocked implementation calls.

### End-to-End Tests

Playwright starts the application with `DEVELOPMENT_LOOP_ADAPTER=scripted`, so browser tests exercise the real route, schemas, engine, state updates, and UI without calling OpenAI.

Primary scenario:

1. Open the home page.
2. Enter the AI development loop workspace.
3. Enter a feature brief.
4. Run the loop.
5. Observe test plan, code, test, and validation nodes execute.
6. Observe the first validation request revision.
7. Observe a second iteration pass.
8. Confirm the inspector contains two iterations and a passed outcome.

Additional scenario:

- A missing feature brief prevents execution and provides corrective UI.

No automated test calls the live OpenAI API.

## Delivery and Review

Implementation occurs on an isolated feature branch and worktree.

Required checks before opening the pull request:

```bash
bun run test
bun run test:e2e
bun run lint
bun run build
```

The pull request includes:

- Design and implementation summary.
- Commands and exact test results.
- Screenshots of the home workspace chooser, active loop, revision state, and passed state.
- Explicit note that repository mutation and shell execution remain deferred.

Review process:

1. Task-level spec and code-quality review after each implementation slice.
2. Whole-branch adversarial review before publishing.
3. Address critical and important findings.
4. Open the pull request; do not merge it.

## Future Compatibility

The design deliberately supports the longer-term workflows without implementing them prematurely:

- A worktree executor can replace the scripted test and code proposal stages.
- Keeper documents can become source-artifact nodes.
- Agent instructions and prompt libraries can become reusable inputs.
- Search can become a tool-backed research stage.
- Tax operations mapping can use the same workspace shell and graph components without inheriting execution semantics.

The first increment is complete only when a user can see and run the bounded revise/pass loop, inspect its evidence, and the automated tests prove its transition behavior end to end.
