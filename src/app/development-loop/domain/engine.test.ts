import { describe, expect, it } from 'vitest';
import type { DevelopmentExecutionAdapter } from './engine';
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
    expect(
      events.filter((type) => type === 'iteration-completed'),
    ).toHaveLength(2);
    expect(events.at(-1)).toBe('run-completed');
  });

  it('stops after one blocked verdict', async () => {
    const run = await runDevelopmentLoop({
      runId: 'run-blocked',
      featureBrief: {
        summary: 'Add retry controls',
        acceptanceCriteria: ['A user can set the retry limit'],
      },
      maxIterations: 3,
      adapter: createScriptedDevelopmentAdapter(['blocked', 'pass']),
    });

    expect(run.status).toBe('blocked');
    expect(run.iterations).toHaveLength(1);
    expect(run.iterations[0].validation.verdict).toBe('blocked');
  });

  it('returns iteration-limit after the last allowed revision', async () => {
    const run = await runDevelopmentLoop({
      runId: 'run-limit',
      featureBrief: {
        summary: 'Add retry controls',
        acceptanceCriteria: ['A user can set the retry limit'],
      },
      maxIterations: 3,
      adapter: createScriptedDevelopmentAdapter(['revise', 'revise', 'revise']),
    });

    expect(run.status).toBe('iteration-limit');
    expect(run.iterations).toHaveLength(3);
    expect(run.iterations[1].code.files[0].change).toContain(
      'Handle the failed scripted acceptance case.',
    );
  });

  it('returns blocked with an error when an adapter stage throws', async () => {
    const events: string[] = [];
    const adapter: DevelopmentExecutionAdapter = {
      async createTestPlan() {
        return {
          strategy: 'Test the feature contract.',
          cases: [
            {
              id: 'case-1',
              name: 'Feature meets acceptance criteria',
              level: 'integration',
              expectedBehavior: 'The requested behavior is observable.',
            },
          ],
        };
      },
      async createCodeProposal() {
        throw new Error('Scripted code failure');
      },
      async executeTests() {
        throw new Error('unreachable');
      },
      async validateResult() {
        throw new Error('unreachable');
      },
    };

    const run = await runDevelopmentLoop({
      runId: 'run-error',
      featureBrief: {
        summary: 'Add retry controls',
        acceptanceCriteria: ['A user can set the retry limit'],
      },
      adapter,
      onEvent: (event) => events.push(event.type),
    });

    expect(run.status).toBe('blocked');
    expect(run.error).toBe('Scripted code failure');
    expect(run.iterations).toHaveLength(0);
    expect(events).toContain('stage-failed');
    expect(events.filter((type) => type === 'run-completed')).toHaveLength(1);
  });

  it('returns stopped before any adapter method runs when already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    let calls = 0;
    const adapter: DevelopmentExecutionAdapter = {
      async createTestPlan() {
        calls += 1;
        return {
          strategy: 'Test the feature contract.',
          cases: [
            {
              id: 'case-1',
              name: 'Feature meets acceptance criteria',
              level: 'integration',
              expectedBehavior: 'The requested behavior is observable.',
            },
          ],
        };
      },
      async createCodeProposal() {
        calls += 1;
        return {
          summary: 'Code proposal',
          files: [{ path: 'src/feature.ts', change: 'Implement behavior.' }],
          assumptions: [],
        };
      },
      async executeTests() {
        calls += 1;
        return {
          status: 'passed',
          cases: [
            {
              testCaseId: 'case-1',
              status: 'passed',
              evidence: 'Observed behavior.',
            },
          ],
        };
      },
      async validateResult() {
        calls += 1;
        return {
          verdict: 'pass',
          rationale: 'All evidence passed.',
          feedback: [],
        };
      },
    };

    const run = await runDevelopmentLoop({
      runId: 'run-stopped',
      featureBrief: {
        summary: 'Add retry controls',
        acceptanceCriteria: ['A user can set the retry limit'],
      },
      adapter,
      signal: controller.signal,
    });

    expect(run.status).toBe('stopped');
    expect(run.iterations).toHaveLength(0);
    expect(calls).toBe(0);
  });

  it('returns stopped when the signal aborts during an in-flight stage', async () => {
    const controller = new AbortController();
    const run = await runDevelopmentLoop({
      runId: 'run-stop-during-stage',
      featureBrief: {
        summary: 'Add retry controls',
        acceptanceCriteria: ['A user can set the retry limit'],
      },
      adapter: {
        async createTestPlan({ iteration }) {
          return {
            strategy: `Test iteration ${iteration}.`,
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
        async createCodeProposal({ iteration }) {
          return {
            summary: `Code proposal for iteration ${iteration}`,
            files: [
              {
                path: 'src/feature.ts',
                change: 'Implement behavior.',
              },
            ],
            assumptions: [],
          };
        },
        async executeTests({ testPlan }) {
          return {
            status: 'passed',
            cases: testPlan.cases.map((testCase) => ({
              testCaseId: testCase.id,
              status: 'passed',
              evidence: 'Observed behavior.',
            })),
          };
        },
        async validateResult() {
          controller.abort();
          return {
            verdict: 'pass',
            rationale: 'All evidence passed.',
            feedback: [],
          };
        },
      },
      signal: controller.signal,
    });

    expect(run.status).toBe('stopped');
    expect(run.iterations).toHaveLength(0);
  });

  it('keeps stopped status when a stage aborts the signal and then rejects', async () => {
    const controller = new AbortController();
    const events: string[] = [];

    const run = await runDevelopmentLoop({
      runId: 'run-stop-before-rejection-handled',
      featureBrief: {
        summary: 'Add retry controls',
        acceptanceCriteria: ['A user can set the retry limit'],
      },
      adapter: {
        async createTestPlan() {
          return {
            strategy: 'Test the feature contract.',
            cases: [
              {
                id: 'case-1',
                name: 'Feature meets acceptance criteria',
                level: 'integration',
                expectedBehavior: 'The requested behavior is observable.',
              },
            ],
          };
        },
        async createCodeProposal() {
          controller.abort();
          throw new Error('Adapter failed after stop request');
        },
        async executeTests() {
          throw new Error('unreachable');
        },
        async validateResult() {
          throw new Error('unreachable');
        },
      },
      signal: controller.signal,
      onEvent: (event) => events.push(event.type),
    });

    expect(run.status).toBe('stopped');
    expect(events).not.toContain('stage-failed');
    expect(events.filter((type) => type === 'run-completed')).toHaveLength(1);
  });
});
