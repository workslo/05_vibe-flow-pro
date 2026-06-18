import { describe, expect, it, vi } from 'vitest';

import { createClientDevelopmentAdapter } from './client-adapter';

const validFeatureBrief = {
  summary: 'Add retry controls',
  acceptanceCriteria: ['A user can set the retry limit'],
};

const validTestPlanInput = {
  featureBrief: validFeatureBrief,
  iteration: 1,
  priorFeedback: [],
};

describe('createClientDevelopmentAdapter', () => {
  it('posts a stage request and parses the returned artifact', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          artifact: {
            strategy: 'Contract tests',
            cases: [
              {
                id: 'case-1',
                name: 'Works',
                level: 'unit',
                expectedBehavior: 'Passes',
              },
            ],
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

  it('throws the server error string for non-ok responses', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ error: 'Stage failed' }), { status: 500 }),
    );

    const adapter = createClientDevelopmentAdapter(fetchImpl);

    await expect(
      adapter.createCodeProposal({
        ...validTestPlanInput,
        testPlan: {
          strategy: 'Contract tests',
          cases: [
            {
              id: 'case-1',
              name: 'Works',
              level: 'unit',
              expectedBehavior: 'Passes',
            },
          ],
        },
      }),
    ).rejects.toThrow('Stage failed');
  });

  it('rejects artifacts that do not match the stage schema', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          artifact: {
            cases: [],
          },
        }),
        { status: 200 },
      ),
    );

    const adapter = createClientDevelopmentAdapter(fetchImpl);

    await expect(adapter.createTestPlan(validTestPlanInput)).rejects.toThrow();
  });

  it('routes every stage through the shared endpoint contract', async () => {
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { stage: string };
      calls.push(body.stage);

      switch (body.stage) {
        case 'code':
          return new Response(
            JSON.stringify({
              artifact: {
                summary: 'Update the retry form',
                files: [{ path: 'src/feature.ts', change: 'Add a retry input.' }],
                assumptions: [],
              },
            }),
            { status: 200 },
          );
        case 'test':
          return new Response(
            JSON.stringify({
              artifact: {
                status: 'passed',
                cases: [
                  {
                    testCaseId: 'case-1',
                    status: 'passed',
                    evidence: 'Observed the retry input.',
                  },
                ],
              },
            }),
            { status: 200 },
          );
        case 'validate':
          return new Response(
            JSON.stringify({
              artifact: {
                verdict: 'pass',
                rationale: 'The retry input satisfies the criteria.',
                feedback: [],
              },
            }),
            { status: 200 },
          );
        default:
          throw new Error(`Unexpected stage: ${body.stage}`);
      }
    });

    const adapter = createClientDevelopmentAdapter(fetchImpl);
    const testPlan = {
      strategy: 'Contract tests',
      cases: [
        {
          id: 'case-1',
          name: 'Works',
          level: 'unit' as const,
          expectedBehavior: 'Passes',
        },
      ],
    };
    const code = await adapter.createCodeProposal({
      ...validTestPlanInput,
      testPlan,
    });
    const test = await adapter.executeTests({
      ...validTestPlanInput,
      testPlan,
      code,
    });
    const validation = await adapter.validateResult({
      ...validTestPlanInput,
      testPlan,
      code,
      test,
    });

    expect(calls).toEqual(['code', 'test', 'validate']);
    expect(code.summary).toBe('Update the retry form');
    expect(test.status).toBe('passed');
    expect(validation.verdict).toBe('pass');
  });
});
