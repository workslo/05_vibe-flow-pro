# AI Development Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bounded, observable AI development loop that creates a test plan, proposes code, simulates tests, validates evidence, and revises until it passes or reaches a terminal condition.

**Architecture:** A pure TypeScript loop engine owns iteration semantics and emits typed events. A Next.js stage route selects either an OpenAI structured-output adapter or a trusted scripted adapter; a dedicated Zustand store projects engine events into the development-loop canvas and run inspector. The existing creative workflow remains at `/workflow`, while the new loop lives at `/development-loop`.

**Tech Stack:** Next.js 15, React 19, TypeScript, React Flow 12, Zustand 5, Zod 4, Vercel AI SDK 5, Vitest, React Testing Library, Playwright, Bun.

## Global Constraints

- The canonical graph is `Feature brief -> Test plan -> Code -> Test -> Validate`, with a visible `Validate -> Code` revision edge.
- Validation verdicts are exactly `pass`, `revise`, and `blocked`.
- Run terminal states are exactly `passed`, `blocked`, `stopped`, and `iteration-limit`.
- The default maximum is three iterations.
- The workflow must not write repository files, execute shell commands, create commits, push branches, or open pull requests.
- `OPENAI_API_KEY` remains server-only.
- The OpenAI adapter is selected by default; the scripted adapter is selected only when `DEVELOPMENT_LOOP_ADAPTER=scripted` is set in the trusted server environment.
- Adapter selection must not be accepted from request data, query parameters, cookies, local storage, or client state.
- Automated tests must never call the live OpenAI API.
- `/development-loop` is the AI development workspace; `/workflow` remains the creative generation workspace.
- The tax operations mapper is represented on the home screen as the next workspace but is not implemented in this plan.
- Every implementation task uses test-first development and ends with a focused commit.

---

## File Map

### Domain and Runtime

- `src/app/development-loop/domain/schemas.ts`: Zod schemas and inferred artifact/run types.
- `src/app/development-loop/domain/template.ts`: canonical nodes, edges, and graph validation.
- `src/app/development-loop/domain/engine.ts`: bounded iteration engine and event contracts.
- `src/app/development-loop/domain/scripted-adapter.ts`: deterministic adapter used by automated tests.
- `src/app/development-loop/domain/client-adapter.ts`: browser adapter calling the stage API.
- `src/app/development-loop/domain/*.test.ts`: unit and integration coverage.

### Server

- `src/app/api/development-loop/stage/route.ts`: request parsing, trusted adapter selection, and stage execution.
- `src/app/api/development-loop/stage/route.test.ts`: route behavior without network calls.
- `src/app/development-loop/server/openai-adapter.ts`: structured OpenAI stage prompts and schema validation.

### State and UI

- `src/app/development-loop/store/run-store.ts`: run state and event reducer.
- `src/app/development-loop/store/index.tsx`: store provider and typed hook.
- `src/app/development-loop/store/run-store.test.ts`: reducer/state tests.
- `src/app/development-loop/components/development-loop-workspace.tsx`: page composition and run controls.
- `src/app/development-loop/components/development-loop-canvas.tsx`: read-only canonical React Flow graph.
- `src/app/development-loop/components/development-node.tsx`: stage node presentation.
- `src/app/development-loop/components/run-inspector.tsx`: iterations, artifacts, verdict, and errors.
- `src/app/development-loop/components/workspace-sidebar.tsx`: workspace identity and stage list.
- `src/app/development-loop/page.tsx`: route metadata and provider wiring.
- `src/app/development-loop/mock-data.ts`: canonical canvas positions and edge metadata.
- `src/app/page.tsx`: workspace chooser.
- `src/app/workflow/product-profile.ts`: workspace links and labels.

### Test Tooling and Documentation

- `vitest.config.ts`: Vitest aliases and jsdom setup.
- `src/test/setup.ts`: Testing Library cleanup and DOM matchers.
- `playwright.config.ts`: scripted-adapter web server and browser configuration.
- `tests/development-loop.spec.ts`: primary revise-then-pass and validation E2E flows.
- `package.json`: test scripts and dev dependencies.
- `README.md`: new workspace, adapter configuration, and verification commands.

---

### Task 1: Install the Test Harness

**Files:**
- Modify: `package.json`
- Modify: `bun.lock`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `playwright.config.ts`
- Create: `src/test/smoke.test.ts`

**Interfaces:**
- Produces scripts: `test`, `test:watch`, and `test:e2e`.
- Produces Vitest alias `@` -> `src`.
- Produces Playwright server environment `DEVELOPMENT_LOOP_ADAPTER=scripted`.

- [ ] **Step 1: Write the failing smoke test**

```ts
// src/test/smoke.test.ts
import { describe, expect, it } from 'vitest';

describe('test harness', () => {
  it('runs TypeScript tests with the project alias', async () => {
    const { cn } = await import('@/lib/utils');
    expect(cn('one', false && 'two')).toBe('one');
  });
});
```

- [ ] **Step 2: Run the missing test command**

Run: `bun run test`

Expected: FAIL because `package.json` has no `test` script.

- [ ] **Step 3: Install the testing dependencies**

Run:

```bash
bun add -d vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
```

Expected: dependencies are added to `package.json` and `bun.lock`.

- [ ] **Step 4: Add exact test scripts**

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 5: Configure Vitest**

```ts
// vitest.config.ts
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    clearMocks: true,
  },
});
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Configure Playwright**

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'bun run dev -- --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100',
    env: {
      DEVELOPMENT_LOOP_ADAPTER: 'scripted',
    },
    reuseExistingServer: false,
  },
  projects: [
    {
      name: 'chromium',
      use: devices['Desktop Chrome'],
    },
  ],
});
```

- [ ] **Step 7: Ignore test artifacts**

Add to `.gitignore`:

```gitignore
playwright-report/
test-results/
coverage/
```

- [ ] **Step 8: Verify the harness**

Run: `bun run test`

Expected: `src/test/smoke.test.ts` passes.

- [ ] **Step 9: Commit**

```bash
git add package.json bun.lock .gitignore vitest.config.ts playwright.config.ts src/test
git commit -m "Add automated test harness"
```

---

### Task 2: Define Artifact Schemas and the Canonical Graph

**Files:**
- Create: `src/app/development-loop/domain/schemas.ts`
- Create: `src/app/development-loop/domain/schemas.test.ts`
- Create: `src/app/development-loop/domain/template.ts`
- Create: `src/app/development-loop/domain/template.test.ts`

**Interfaces:**
- Produces schemas: `featureBriefSchema`, `testPlanArtifactSchema`, `codeArtifactSchema`, `testArtifactSchema`, `validationArtifactSchema`, `developmentRunSchema`.
- Produces types inferred from those schemas.
- Produces `DEVELOPMENT_STAGE_IDS`, `canonicalDevelopmentGraph`, and `validateDevelopmentGraph(nodes, edges)`.

- [ ] **Step 1: Write failing schema tests**

```ts
// src/app/development-loop/domain/schemas.test.ts
import { describe, expect, it } from 'vitest';
import {
  featureBriefSchema,
  validationArtifactSchema,
} from './schemas';

describe('development loop schemas', () => {
  it('accepts a feature brief with acceptance criteria', () => {
    expect(
      featureBriefSchema.parse({
        summary: 'Add retry controls',
        acceptanceCriteria: ['A user can set the retry limit'],
      }),
    ).toEqual({
      summary: 'Add retry controls',
      acceptanceCriteria: ['A user can set the retry limit'],
    });
  });

  it('rejects unsupported validation verdicts', () => {
    expect(() =>
      validationArtifactSchema.parse({
        verdict: 'maybe',
        rationale: 'Unclear',
        feedback: [],
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run: `bun run test -- src/app/development-loop/domain/schemas.test.ts`

Expected: FAIL because `./schemas` does not exist.

- [ ] **Step 3: Implement the schemas**

```ts
// src/app/development-loop/domain/schemas.ts
import { z } from 'zod/v4';

export const developmentStageSchema = z.enum([
  'test-plan',
  'code',
  'test',
  'validate',
]);

export const runStatusSchema = z.enum([
  'idle',
  'running',
  'passed',
  'blocked',
  'stopped',
  'iteration-limit',
]);

export const featureBriefSchema = z.object({
  summary: z.string().trim().min(1),
  acceptanceCriteria: z.array(z.string().trim().min(1)).min(1),
});

export const testPlanArtifactSchema = z.object({
  strategy: z.string().trim().min(1),
  cases: z.array(
    z.object({
      id: z.string().trim().min(1),
      name: z.string().trim().min(1),
      level: z.enum(['unit', 'integration', 'e2e']),
      expectedBehavior: z.string().trim().min(1),
    }),
  ).min(1),
});

export const codeArtifactSchema = z.object({
  summary: z.string().trim().min(1),
  files: z.array(
    z.object({
      path: z.string().trim().min(1),
      change: z.string().trim().min(1),
    }),
  ).min(1),
  assumptions: z.array(z.string().trim().min(1)),
});

export const testArtifactSchema = z.object({
  status: z.enum(['passed', 'failed']),
  cases: z.array(
    z.object({
      testCaseId: z.string().trim().min(1),
      status: z.enum(['passed', 'failed']),
      evidence: z.string().trim().min(1),
    }),
  ).min(1),
});

export const validationArtifactSchema = z.object({
  verdict: z.enum(['pass', 'revise', 'blocked']),
  rationale: z.string().trim().min(1),
  feedback: z.array(z.string().trim().min(1)),
});

export const developmentIterationSchema = z.object({
  number: z.number().int().positive(),
  testPlan: testPlanArtifactSchema,
  code: codeArtifactSchema,
  test: testArtifactSchema,
  validation: validationArtifactSchema,
});

export const developmentRunSchema = z.object({
  id: z.string().trim().min(1),
  status: runStatusSchema,
  featureBrief: featureBriefSchema,
  maxIterations: z.number().int().positive(),
  iterations: z.array(developmentIterationSchema),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  error: z.string().optional(),
});

export type DevelopmentStage = z.infer<typeof developmentStageSchema>;
export type RunStatus = z.infer<typeof runStatusSchema>;
export type ValidationVerdict = z.infer<
  typeof validationArtifactSchema
>['verdict'];
export type FeatureBrief = z.infer<typeof featureBriefSchema>;
export type TestPlanArtifact = z.infer<typeof testPlanArtifactSchema>;
export type CodeArtifact = z.infer<typeof codeArtifactSchema>;
export type TestArtifact = z.infer<typeof testArtifactSchema>;
export type ValidationArtifact = z.infer<typeof validationArtifactSchema>;
export type DevelopmentIteration = z.infer<typeof developmentIterationSchema>;
export type DevelopmentRun = z.infer<typeof developmentRunSchema>;
```

- [ ] **Step 4: Verify schema tests GREEN**

Run: `bun run test -- src/app/development-loop/domain/schemas.test.ts`

Expected: all schema tests pass.

- [ ] **Step 5: Write failing graph validation tests**

```ts
// src/app/development-loop/domain/template.test.ts
import { describe, expect, it } from 'vitest';
import {
  canonicalDevelopmentGraph,
  validateDevelopmentGraph,
} from './template';

describe('canonical development graph', () => {
  it('accepts the required forward path and revision edge', () => {
    expect(
      validateDevelopmentGraph(
        canonicalDevelopmentGraph.nodes,
        canonicalDevelopmentGraph.edges,
      ),
    ).toEqual({ valid: true });
  });

  it('rejects a graph without the validation revision edge', () => {
    expect(
      validateDevelopmentGraph(
        canonicalDevelopmentGraph.nodes,
        canonicalDevelopmentGraph.edges.filter(
          (edge) => edge.id !== 'validate-to-code',
        ),
      ),
    ).toEqual({
      valid: false,
      error: 'Missing required connection: validate -> code',
    });
  });
});
```

- [ ] **Step 6: Run graph tests to verify RED**

Run: `bun run test -- src/app/development-loop/domain/template.test.ts`

Expected: FAIL because `./template` does not exist.

- [ ] **Step 7: Implement canonical graph validation**

```ts
// src/app/development-loop/domain/template.ts
export const DEVELOPMENT_STAGE_IDS = [
  'feature-brief',
  'test-plan',
  'code',
  'test',
  'validate',
] as const;

export type DevelopmentStageId = (typeof DEVELOPMENT_STAGE_IDS)[number];

export type DevelopmentGraphNode = {
  id: DevelopmentStageId;
  label: string;
};

export type DevelopmentGraphEdge = {
  id: string;
  source: DevelopmentStageId;
  target: DevelopmentStageId;
  kind: 'forward' | 'revision';
};

const requiredConnections = [
  ['feature-brief', 'test-plan'],
  ['test-plan', 'code'],
  ['code', 'test'],
  ['test', 'validate'],
  ['validate', 'code'],
] as const;

export const canonicalDevelopmentGraph = {
  nodes: [
    { id: 'feature-brief', label: 'Feature brief' },
    { id: 'test-plan', label: 'Test plan' },
    { id: 'code', label: 'Code feature' },
    { id: 'test', label: 'Test feature' },
    { id: 'validate', label: 'Validate result' },
  ] satisfies DevelopmentGraphNode[],
  edges: [
    { id: 'brief-to-plan', source: 'feature-brief', target: 'test-plan', kind: 'forward' },
    { id: 'plan-to-code', source: 'test-plan', target: 'code', kind: 'forward' },
    { id: 'code-to-test', source: 'code', target: 'test', kind: 'forward' },
    { id: 'test-to-validate', source: 'test', target: 'validate', kind: 'forward' },
    { id: 'validate-to-code', source: 'validate', target: 'code', kind: 'revision' },
  ] satisfies DevelopmentGraphEdge[],
};

export function validateDevelopmentGraph(
  nodes: DevelopmentGraphNode[],
  edges: DevelopmentGraphEdge[],
): { valid: true } | { valid: false; error: string } {
  for (const stageId of DEVELOPMENT_STAGE_IDS) {
    const count = nodes.filter((node) => node.id === stageId).length;
    if (count !== 1) {
      return {
        valid: false,
        error: `Expected exactly one stage: ${stageId}`,
      };
    }
  }

  for (const [source, target] of requiredConnections) {
    if (!edges.some((edge) => edge.source === source && edge.target === target)) {
      return {
        valid: false,
        error: `Missing required connection: ${source} -> ${target}`,
      };
    }
  }

  return { valid: true };
}
```

- [ ] **Step 8: Verify graph tests GREEN**

Run: `bun run test -- src/app/development-loop/domain`

Expected: schema and template tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/app/development-loop/domain
git commit -m "Define development loop contracts"
```

---

### Task 3: Implement the Bounded Loop Engine

**Files:**
- Create: `src/app/development-loop/domain/engine.ts`
- Create: `src/app/development-loop/domain/engine.test.ts`
- Create: `src/app/development-loop/domain/scripted-adapter.ts`

**Interfaces:**
- Produces `DevelopmentExecutionAdapter`.
- Produces `runDevelopmentLoop(options): Promise<DevelopmentRun>`.
- Produces `DevelopmentLoopEvent`.
- Produces `createScriptedDevelopmentAdapter(verdicts)`.

- [ ] **Step 1: Write failing revise-then-pass engine test**

```ts
// src/app/development-loop/domain/engine.test.ts
import { describe, expect, it } from 'vitest';
import { runDevelopmentLoop } from './engine';
import { createScriptedDevelopmentAdapter } from './scripted-adapter';

describe('runDevelopmentLoop', () => {
  it('routes revision feedback into a second iteration and passes', async () => {
    const events: string[] = [];
    const run = await runDevelopmentLoop({
      runId: 'run-1',
      featureBrief: {
        summary: 'Add retry controls',
        acceptanceCriteria: ['A user can set the retry limit'],
      },
      maxIterations: 3,
      adapter: createScriptedDevelopmentAdapter(['revise', 'pass']),
      onEvent: (event) => events.push(event.type),
    });

    expect(run.status).toBe('passed');
    expect(run.iterations).toHaveLength(2);
    expect(run.iterations[1].code.summary).toContain('iteration 2');
    expect(events.filter((type) => type === 'iteration-completed')).toHaveLength(2);
    expect(events.at(-1)).toBe('run-completed');
  });
});
```

- [ ] **Step 2: Run test to verify RED**

Run: `bun run test -- src/app/development-loop/domain/engine.test.ts`

Expected: FAIL because engine and scripted adapter do not exist.

- [ ] **Step 3: Implement event and adapter contracts**

In `engine.ts`, define:

```ts
export type TestPlanInput = {
  featureBrief: FeatureBrief;
  iteration: number;
  priorFeedback: string[];
};

export type CodeInput = TestPlanInput & {
  testPlan: TestPlanArtifact;
};

export type TestInput = CodeInput & {
  code: CodeArtifact;
};

export type ValidationInput = TestInput & {
  test: TestArtifact;
};

export interface DevelopmentExecutionAdapter {
  createTestPlan(input: TestPlanInput): Promise<TestPlanArtifact>;
  createCodeProposal(input: CodeInput): Promise<CodeArtifact>;
  executeTests(input: TestInput): Promise<TestArtifact>;
  validateResult(input: ValidationInput): Promise<ValidationArtifact>;
}

export type DevelopmentLoopEvent =
  | { type: 'run-started'; run: DevelopmentRun }
  | { type: 'stage-started'; stage: DevelopmentStage; iteration: number }
  | { type: 'stage-completed'; stage: DevelopmentStage; iteration: number; artifact: unknown }
  | { type: 'stage-failed'; stage: DevelopmentStage; iteration: number; error: string }
  | { type: 'iteration-completed'; iteration: DevelopmentIteration }
  | { type: 'run-completed'; run: DevelopmentRun };
```

- [ ] **Step 4: Implement the minimal engine**

Implement `runDevelopmentLoop` so it:

- Creates an ISO timestamped `running` run.
- Checks `signal?.aborted` before every stage and immediately after every
  awaited adapter call, so a stop requested during an in-flight stage prevents
  the next transition and cannot be overwritten by a terminal verdict.
- Parses every adapter result with the matching Zod schema.
- Emits start/completion events for every stage.
- Appends completed iterations.
- Returns `passed` on `pass`.
- Returns `blocked` on `blocked` or adapter error.
- Carries `validation.feedback` into the next test-plan and code inputs.
- Returns `iteration-limit` after the last allowed `revise`.
- Emits exactly one final `run-completed`.

Signature:

```ts
export async function runDevelopmentLoop(options: {
  runId: string;
  featureBrief: FeatureBrief;
  maxIterations?: number;
  adapter: DevelopmentExecutionAdapter;
  signal?: AbortSignal;
  onEvent?: (event: DevelopmentLoopEvent) => void;
  now?: () => Date;
}): Promise<DevelopmentRun>;
```

- [ ] **Step 5: Implement deterministic scripted artifacts**

```ts
// src/app/development-loop/domain/scripted-adapter.ts
import type { ValidationVerdict } from './schemas';
import type { DevelopmentExecutionAdapter } from './engine';

export function createScriptedDevelopmentAdapter(
  verdicts: ValidationVerdict[] = ['revise', 'pass'],
): DevelopmentExecutionAdapter {
  return {
    async createTestPlan({ iteration }) {
      return {
        strategy: `Test the feature contract in iteration ${iteration}.`,
        cases: [
          {
            id: `case-${iteration}`,
            name: 'Feature meets acceptance criteria',
            level: 'integration',
            expectedBehavior: 'The requested behavior is observable.',
          },
        ],
      };
    },
    async createCodeProposal({ iteration, priorFeedback }) {
      return {
        summary: `Code proposal for iteration ${iteration}`,
        files: [
          {
            path: 'src/feature.ts',
            change: priorFeedback.length
              ? `Address feedback: ${priorFeedback.join('; ')}`
              : 'Implement the requested behavior.',
          },
        ],
        assumptions: [],
      };
    },
    async executeTests({ iteration, testPlan }) {
      const verdict = verdicts[Math.min(iteration - 1, verdicts.length - 1)];
      return {
        status: verdict === 'pass' ? 'passed' : 'failed',
        cases: testPlan.cases.map((testCase) => ({
          testCaseId: testCase.id,
          status: verdict === 'pass' ? 'passed' : 'failed',
          evidence:
            verdict === 'pass'
              ? 'Scripted evidence confirms the behavior.'
              : 'Scripted evidence requests one revision.',
        })),
      };
    },
    async validateResult({ iteration }) {
      const verdict = verdicts[Math.min(iteration - 1, verdicts.length - 1)];
      return {
        verdict,
        rationale:
          verdict === 'pass'
            ? 'All acceptance evidence passed.'
            : 'The implementation needs one focused revision.',
        feedback:
          verdict === 'revise'
            ? ['Handle the failed scripted acceptance case.']
            : [],
      };
    },
  };
}
```

- [ ] **Step 6: Add terminal-state tests**

Add tests proving:

- `blocked` stops after one iteration.
- three `revise` verdicts return `iteration-limit` with three iterations.
- an adapter exception returns `blocked` with `error`.
- an already-aborted signal returns `stopped` before any adapter method runs.

- [ ] **Step 7: Run engine tests GREEN**

Run: `bun run test -- src/app/development-loop/domain`

Expected: all domain tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/app/development-loop/domain
git commit -m "Add bounded development loop engine"
```

---

### Task 4: Add the Server Stage Adapter

**Files:**
- Create: `src/app/development-loop/server/openai-adapter.ts`
- Create: `src/app/api/development-loop/stage/route.ts`
- Create: `src/app/api/development-loop/stage/route.test.ts`

**Interfaces:**
- Consumes `DevelopmentExecutionAdapter` and all artifact schemas.
- Produces `POST /api/development-loop/stage`.
- Produces `createOpenAIDevelopmentAdapter()`.

- [ ] **Step 1: Write failing route tests**

Test the route by constructing `NextRequest` instances:

```ts
it('uses the scripted adapter only from the trusted server environment', async () => {
  vi.stubEnv('DEVELOPMENT_LOOP_ADAPTER', 'scripted');
  const response = await POST(
    new NextRequest('http://localhost/api/development-loop/stage', {
      method: 'POST',
      body: JSON.stringify({
        stage: 'validate',
        input: scriptedValidationInput,
      }),
    }),
  );

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    artifact: { verdict: 'revise' },
  });
});

it('ignores a client adapter selection field', async () => {
  vi.stubEnv('DEVELOPMENT_LOOP_ADAPTER', '');
  const response = await POST(
    new NextRequest('http://localhost/api/development-loop/stage', {
      method: 'POST',
      body: JSON.stringify({
        adapter: 'scripted',
        stage: 'test-plan',
        input: validTestPlanInput,
      }),
    }),
  );

  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({
    error: 'openai adapter selected',
  });
});
```

At the top of the route test, mock `createOpenAIDevelopmentAdapter` to return
an adapter whose methods throw `new Error('openai adapter selected')`. This
proves the request's `adapter` key is ignored without making a live OpenAI
request.

- [ ] **Step 2: Run route tests RED**

Run: `bun run test -- src/app/api/development-loop/stage/route.test.ts`

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement stage request schemas**

In the route, define a discriminated union:

```ts
const stageRequestSchema = z.discriminatedUnion('stage', [
  z.object({ stage: z.literal('test-plan'), input: testPlanInputSchema }),
  z.object({ stage: z.literal('code'), input: codeInputSchema }),
  z.object({ stage: z.literal('test'), input: testInputSchema }),
  z.object({ stage: z.literal('validate'), input: validationInputSchema }),
]);
```

Export input schemas from `schemas.ts` or define them next to the domain input types so route and engine share one validation contract.

- [ ] **Step 4: Implement the trusted adapter selection**

```ts
function getDevelopmentAdapter(): DevelopmentExecutionAdapter {
  if (process.env.DEVELOPMENT_LOOP_ADAPTER === 'scripted') {
    return createScriptedDevelopmentAdapter();
  }

  return createOpenAIDevelopmentAdapter();
}
```

The request schema must strip unknown keys; no request property influences adapter selection.

- [ ] **Step 5: Implement OpenAI structured generation**

Use Vercel AI SDK `generateObject` with the existing `getOpenAIProvider()`:

```ts
const { object } = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: testPlanArtifactSchema,
  system: TEST_PLAN_SYSTEM_PROMPT,
  prompt: JSON.stringify(input),
});

return testPlanArtifactSchema.parse(object);
```

Define one concise system prompt per stage. Each prompt must state that the output is a proposal/simulation and must not claim files or commands were actually executed.

- [ ] **Step 6: Implement route dispatch and error responses**

Return:

- `{ artifact }` with `200` on success.
- `{ error: 'Invalid request', issues }` with `400` for Zod request errors.
- `{ error: message }` with `500` for provider or adapter errors.

- [ ] **Step 7: Run route and domain tests GREEN**

Run: `bun run test -- src/app/api/development-loop src/app/development-loop/domain`

Expected: all tests pass without `OPENAI_API_KEY`.

- [ ] **Step 8: Commit**

```bash
git add src/app/api/development-loop src/app/development-loop/server src/app/development-loop/domain
git commit -m "Add development loop stage API"
```

---

### Task 5: Add the Client Adapter and Run Store

**Files:**
- Create: `src/app/development-loop/domain/client-adapter.ts`
- Create: `src/app/development-loop/domain/client-adapter.test.ts`
- Create: `src/app/development-loop/store/run-store.ts`
- Create: `src/app/development-loop/store/run-store.test.ts`
- Create: `src/app/development-loop/store/index.tsx`

**Interfaces:**
- Produces `createClientDevelopmentAdapter(fetchImpl?)`.
- Produces `createDevelopmentRunStore()`.
- Produces `DevelopmentRunProvider` and `useDevelopmentRunStore`.
- Store actions: `setFeatureBrief`, `startRun`, `requestStop`, `applyEvent`, `resetActiveRun`.

- [ ] **Step 1: Write failing client adapter test**

```ts
it('posts a stage request and parses the returned artifact', async () => {
  const fetchImpl = vi.fn(async () =>
    new Response(
      JSON.stringify({
        artifact: {
          strategy: 'Contract tests',
          cases: [{
            id: 'case-1',
            name: 'Works',
            level: 'unit',
            expectedBehavior: 'Passes',
          }],
        },
      }),
      { status: 200 },
    ),
  );

  const adapter = createClientDevelopmentAdapter(fetchImpl);
  const result = await adapter.createTestPlan(validTestPlanInput);

  expect(fetchImpl).toHaveBeenCalledWith(
    '/api/development-loop/stage',
    expect.objectContaining({ method: 'POST' }),
  );
  expect(result.strategy).toBe('Contract tests');
});
```

- [ ] **Step 2: Run client test RED**

Run: `bun run test -- src/app/development-loop/domain/client-adapter.test.ts`

Expected: FAIL because `client-adapter.ts` does not exist.

- [ ] **Step 3: Implement client stage calls**

Create a shared `callStage(stage, input, schema)` helper that:

- POSTs JSON to `/api/development-loop/stage`.
- Throws the server `error` string for non-OK responses.
- Parses `artifact` with the supplied Zod schema.
- Implements all four `DevelopmentExecutionAdapter` methods.

- [ ] **Step 4: Write failing run-store reducer test**

```ts
it('preserves completed iterations and run summaries', () => {
  const store = createDevelopmentRunStore();

  store.getState().applyEvent({ type: 'run-started', run: runningRun });
  store.getState().applyEvent({
    type: 'iteration-completed',
    iteration: completedIteration,
  });
  store.getState().applyEvent({
    type: 'run-completed',
    run: passedRun,
  });

  expect(store.getState().activeRun?.iterations).toHaveLength(1);
  expect(store.getState().runSummaries[0]).toMatchObject({
    id: passedRun.id,
    status: 'passed',
    iterationCount: 1,
  });
});
```

- [ ] **Step 5: Run store test RED**

Run: `bun run test -- src/app/development-loop/store/run-store.test.ts`

Expected: FAIL because the store does not exist.

- [ ] **Step 6: Implement the focused Zustand store**

State:

```ts
type DevelopmentRunState = {
  featureBrief: FeatureBrief;
  activeRun?: DevelopmentRun;
  currentStage?: DevelopmentStage;
  currentIteration: number;
  runSummaries: Array<{
    id: string;
    status: RunStatus;
    iterationCount: number;
    startedAt: string;
    finishedAt?: string;
  }>;
  controller?: AbortController;
};
```

`applyEvent` behavior:

- `run-started`: set active run and clear current stage.
- `stage-started`: set current stage and iteration.
- `iteration-completed`: append or replace that numbered iteration.
- `stage-failed`: retain the error on the active run.
- `run-completed`: set final run, clear controller/current stage, prepend one summary.

`requestStop` calls `controller.abort()`.

- [ ] **Step 7: Add provider and typed hook**

Follow the existing `src/app/workflow/store/index.tsx` context/provider pattern, but use `createDevelopmentRunStore`.

- [ ] **Step 8: Run adapter and store tests GREEN**

Run: `bun run test -- src/app/development-loop/domain/client-adapter.test.ts src/app/development-loop/store`

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/app/development-loop/domain/client-adapter* src/app/development-loop/store
git commit -m "Add development loop client state"
```

---

### Task 6: Build the Development Loop Workspace

**Files:**
- Create: `src/app/development-loop/mock-data.ts`
- Create: `src/app/development-loop/components/development-node.tsx`
- Create: `src/app/development-loop/components/development-loop-canvas.tsx`
- Create: `src/app/development-loop/components/run-inspector.tsx`
- Create: `src/app/development-loop/components/workspace-sidebar.tsx`
- Create: `src/app/development-loop/components/development-loop-workspace.tsx`
- Create: `src/app/development-loop/components/development-loop-workspace.test.tsx`
- Create: `src/app/development-loop/page.tsx`

**Interfaces:**
- Consumes canonical graph, engine, client adapter, and run store.
- Produces the `/development-loop` workspace.
- Uses `data-testid="development-loop-canvas"` and accessible names required by E2E.

- [ ] **Step 1: Write the failing workspace interaction test**

```tsx
it('requires a feature brief before running', async () => {
  const user = userEvent.setup();
  render(
    <DevelopmentRunProvider>
      <DevelopmentLoopWorkspace adapter={scriptedAdapter} />
    </DevelopmentRunProvider>,
  );

  await user.click(screen.getByRole('button', { name: 'Run loop' }));

  expect(
    screen.getByText('Add a feature summary and at least one acceptance criterion.'),
  ).toBeVisible();
});
```

- [ ] **Step 2: Run workspace test RED**

Run: `bun run test -- src/app/development-loop/components/development-loop-workspace.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Create canonical React Flow data**

Map the canonical graph to fixed positions:

```ts
const positions = {
  'feature-brief': { x: 0, y: 160 },
  'test-plan': { x: 280, y: 160 },
  code: { x: 560, y: 160 },
  test: { x: 840, y: 160 },
  validate: { x: 1120, y: 160 },
} satisfies Record<DevelopmentStageId, XYPosition>;
```

Render the revision edge as a dashed, animated edge with label `Revise`.

- [ ] **Step 4: Implement the stage node**

`DevelopmentNode` displays:

- Stage label and icon.
- `Waiting`, `Running`, `Complete`, or `Needs revision`.
- Current artifact summary.
- Green success, amber active/revision, red blocked, and neutral idle treatments.

The node is presentation-only; no execution logic lives in it.

- [ ] **Step 5: Implement the run inspector**

`RunInspector` displays:

- Active run status.
- `Iteration N of 3`.
- Expandable sections for test plan, code proposal, test evidence, and validation.
- Prior run summary rows.
- Clear missing-key or provider error guidance.

Use semantic headings and buttons; no nested cards.

- [ ] **Step 6: Implement workspace controls and execution**

`DevelopmentLoopWorkspace`:

- Accepts optional `adapter` for tests; defaults to `createClientDevelopmentAdapter()`.
- Stores feature summary and newline-delimited acceptance criteria.
- Validates input with `featureBriefSchema`.
- Calls `validateDevelopmentGraph` before creating the controller; an invalid
  template renders the returned graph error and does not call the adapter.
- Creates one `AbortController`.
- Calls `runDevelopmentLoop` with `maxIterations: 3`.
- Applies every engine event to the run store.
- Disables **Run loop** while running.
- Shows **Stop** only while running.
- Leaves the canvas editable only for node position, not stage deletion or connection changes.

- [ ] **Step 7: Add the route**

```tsx
// src/app/development-loop/page.tsx
import type { Metadata } from 'next';
import { DevelopmentRunProvider } from './store';
import { DevelopmentLoopWorkspace } from './components/development-loop-workspace';

export const metadata: Metadata = {
  title: 'AI Development Loop | Vibe Flow Pro',
  description: 'Plan, code, test, validate, and revise a feature workflow.',
};

export default function DevelopmentLoopPage() {
  return (
    <DevelopmentRunProvider>
      <DevelopmentLoopWorkspace />
    </DevelopmentRunProvider>
  );
}
```

- [ ] **Step 8: Add revise-then-pass component test**

Use `createScriptedDevelopmentAdapter(['revise', 'pass'])`, submit a valid brief, click **Run loop**, and assert:

- `Iteration 2 of 3` becomes visible during the second pass.
- Final status is `Passed`.
- Inspector shows `2 iterations`.
- Validation feedback from iteration one remains visible.

- [ ] **Step 9: Run component and domain tests GREEN**

Run: `bun run test -- src/app/development-loop`

Expected: all tests pass.

- [ ] **Step 10: Commit**

```bash
git add src/app/development-loop
git commit -m "Build AI development loop workspace"
```

---

### Task 7: Turn the Root Page Into a Workspace Chooser

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/workflow/product-profile.ts`
- Create: `src/app/workspace-catalog.ts`
- Create: `src/app/page.test.tsx`

**Interfaces:**
- Produces `workspaceCatalog`.
- Links AI development loop to `/development-loop`.
- Links creative generation to `/workflow`.
- Shows tax operations mapper as `Next` without a clickable route.

- [ ] **Step 1: Write the failing home-page test**

```tsx
it('shows the three product workspaces with correct availability', () => {
  render(<Home />);

  expect(
    screen.getByRole('link', { name: /AI development loop/i }),
  ).toHaveAttribute('href', '/development-loop');
  expect(
    screen.getByRole('link', { name: /Creative generation/i }),
  ).toHaveAttribute('href', '/workflow');
  expect(screen.getByText('Tax operations mapper')).toBeVisible();
  expect(screen.getByText('Next')).toBeVisible();
});
```

- [ ] **Step 2: Run page test RED**

Run: `bun run test -- src/app/page.test.tsx`

Expected: FAIL because the workspace catalog and labels are absent.

- [ ] **Step 3: Define the workspace catalog**

```ts
// src/app/workspace-catalog.ts
export const workspaceCatalog = [
  {
    id: 'development-loop',
    name: 'AI development loop',
    description: 'Plan, code, test, validate, and revise with run evidence.',
    href: '/development-loop',
    status: 'ready',
  },
  {
    id: 'creative-generation',
    name: 'Creative generation',
    description: 'Turn a prompt into generated text and image output.',
    href: '/workflow',
    status: 'ready',
  },
  {
    id: 'tax-ops-mapper',
    name: 'Tax operations mapper',
    description: 'Visualize tax workflows, controls, owners, and handoffs.',
    status: 'next',
  },
] as const;
```

- [ ] **Step 4: Implement the tool-first chooser**

Replace the root hero composition with:

- Compact Vibe Flow Pro header.
- Heading `Choose a workspace`.
- A full-width list of three workspace rows.
- Ready rows are links with arrow icons.
- Tax operations mapper is non-interactive with a `Next` status.
- No recent-run panel is rendered in this increment because run history is scoped to the development-loop browser session.

- [ ] **Step 5: Update product links**

Add `developmentLoop: '/development-loop'` to `productProfile.links` while preserving `workflow`.

- [ ] **Step 6: Run page and full unit tests GREEN**

Run: `bun run test`

Expected: all Vitest tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/app/page.test.tsx src/app/workspace-catalog.ts src/app/workflow/product-profile.ts
git commit -m "Add Vibe Flow Pro workspace chooser"
```

---

### Task 8: Add End-to-End Coverage and Documentation

**Files:**
- Create: `tests/development-loop.spec.ts`
- Modify: `README.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes accessible labels from Tasks 6 and 7.
- Proves the real browser flow through the scripted server adapter.

- [ ] **Step 1: Write the failing Playwright scenario**

```ts
import { expect, test } from '@playwright/test';

test('development loop revises once and then passes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /AI development loop/i }).click();

  await page.getByLabel('Feature summary').fill('Add retry controls');
  await page
    .getByLabel('Acceptance criteria')
    .fill('A user can set the retry limit');
  await page.getByRole('button', { name: 'Run loop' }).click();

  await expect(page.getByText('Passed')).toBeVisible();
  await expect(page.getByText('2 iterations')).toBeVisible();
  await expect(
    page.getByText('Handle the failed scripted acceptance case.'),
  ).toBeVisible();
});

test('development loop rejects an empty brief', async ({ page }) => {
  await page.goto('/development-loop');
  await page.getByRole('button', { name: 'Run loop' }).click();

  await expect(
    page.getByText('Add a feature summary and at least one acceptance criterion.'),
  ).toBeVisible();
});
```

- [ ] **Step 2: Install the Playwright browser**

Run: `bunx playwright install chromium`

Expected: Chromium installs successfully.

- [ ] **Step 3: Run E2E to verify RED**

Run: `bun run test:e2e`

Expected: FAIL until all accessible labels and scripted adapter behavior are wired correctly.

- [ ] **Step 4: Fix only E2E-observed contract gaps**

Adjust accessible labels, deterministic timing, or server adapter reuse without changing the approved product behavior. Do not add arbitrary sleeps; Playwright assertions must wait on visible state.

- [ ] **Step 5: Document the new workflow**

Update `README.md` with:

- `/development-loop`.
- `DEVELOPMENT_LOOP_ADAPTER=scripted` as test-only configuration.
- Typed artifact and bounded-loop summary.
- Exact commands:

```bash
bun run test
bun run test:e2e
bun run lint
bun run build
```

Update `AGENTS.md` so future agents preserve:

- The pure engine boundary.
- Server-only adapter selection.
- No live OpenAI calls in automated tests.
- No repository or shell execution in the first loop.

- [ ] **Step 6: Run the full verification matrix**

Run:

```bash
bun run test
bun run test:e2e
bun run lint
bun run build
```

Expected:

- Vitest: all tests pass.
- Playwright: both development-loop scenarios pass in Chromium.
- ESLint: zero warnings and errors.
- Next build: production build completes successfully.

- [ ] **Step 7: Capture visual evidence**

Start the scripted app:

```bash
DEVELOPMENT_LOOP_ADAPTER=scripted bun run dev -- --hostname 127.0.0.1 --port 3100
```

Capture:

- Home workspace chooser.
- Active development loop.
- Revision feedback state.
- Final passed state.

Store temporary screenshots under `output/playwright/`; they remain gitignored and are referenced in the PR description only if uploaded by the publishing workflow.

- [ ] **Step 8: Commit**

```bash
git add tests/development-loop.spec.ts README.md AGENTS.md
git commit -m "Verify AI development loop end to end"
```

---

### Task 9: Adversarial Review and Pull Request

**Files:**
- Review all branch changes from merge base through `HEAD`.
- No product file changes unless review findings require them.

**Interfaces:**
- Produces a reviewed feature branch and an open pull request.

- [ ] **Step 1: Run task-level review completion check**

Confirm every prior task has:

- A focused commit.
- Its covering test command and passing output.
- A clean spec-compliance and code-quality review.

- [ ] **Step 2: Run whole-branch adversarial review**

Dispatch the strongest available reviewer with:

- The approved design spec.
- This implementation plan.
- A review package covering `git merge-base origin/main HEAD..HEAD`.
- Explicit attention to loop termination, adapter trust boundaries, schema parsing, stale Zustand state, and Playwright determinism.

- [ ] **Step 3: Address critical and important findings**

For each accepted finding:

- Write or extend a failing covering test.
- Verify the test fails for the finding.
- Implement the smallest correction.
- Run the covering test and full relevant suite.
- Commit the fixes as `Address development loop review findings`.

- [ ] **Step 4: Re-run the full verification matrix**

```bash
bun run test
bun run test:e2e
bun run lint
bun run build
```

Expected: all commands pass after review fixes.

- [ ] **Step 5: Push the feature branch**

This is a shared-state operation. Show the exact branch name and push command to the user and obtain confirmation immediately before running:

```bash
git push -u origin codex/ai-development-loop
```

- [ ] **Step 6: Open the pull request**

Create a PR against `main` with:

- Summary of the bounded development loop.
- Explicit deferred scope.
- Exact verification commands and results.
- Review findings addressed.
- Screenshots or visual evidence.

Do not merge the pull request.
