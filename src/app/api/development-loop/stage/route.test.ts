import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/development-loop/server/openai-adapter', () => ({
  createOpenAIDevelopmentAdapter: () => ({
    async createTestPlan() {
      throw new Error('openai adapter selected');
    },
    async createCodeProposal() {
      throw new Error('openai adapter selected');
    },
    async executeTests() {
      throw new Error('openai adapter selected');
    },
    async validateResult() {
      throw new Error('openai adapter selected');
    },
  }),
}));

import { POST } from './route';

const validTestPlanInput = {
  featureBrief: {
    summary: 'Add retry controls',
    acceptanceCriteria: ['A user can set the retry limit'],
  },
  iteration: 1,
  priorFeedback: [],
};

const scriptedValidationInput = {
  ...validTestPlanInput,
  testPlan: {
    strategy: 'Test the feature contract in iteration 1.',
    cases: [
      {
        id: 'case-1',
        name: 'Feature meets acceptance criteria',
        level: 'integration',
        expectedBehavior: 'The requested behavior is observable.',
      },
    ],
  },
  code: {
    summary: 'Code proposal for iteration 1',
    files: [
      {
        path: 'src/feature.ts',
        change: 'Implement the requested behavior.',
      },
    ],
    assumptions: [],
  },
  test: {
    status: 'failed',
    cases: [
      {
        testCaseId: 'case-1',
        status: 'failed',
        evidence: 'Scripted evidence requests one revision.',
      },
    ],
  },
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/development-loop/stage', () => {
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
});
