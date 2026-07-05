import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createScriptedDevelopmentAdapter } from '../domain/scripted-adapter';
import type {
  CodeArtifact,
  TestPlanArtifact,
} from '../domain/schemas';
import { canonicalDevelopmentGraph } from '../domain/template';
import { DevelopmentRunProvider } from '../store';
import { DevelopmentLoopWorkspace } from './development-loop-workspace';

const scriptedAdapter = createScriptedDevelopmentAdapter();

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

afterEach(cleanup);

async function fillValidBrief(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByRole('textbox', { name: 'Feature summary' }),
    'Add retry controls',
  );
  await user.type(
    screen.getByRole('textbox', { name: 'Acceptance criteria' }),
    'A user can set the retry limit',
  );
}

describe('DevelopmentLoopWorkspace', () => {
  it('requires a feature brief before running', async () => {
    const user = userEvent.setup();
    render(
      <DevelopmentRunProvider>
        <DevelopmentLoopWorkspace adapter={scriptedAdapter} />
      </DevelopmentRunProvider>,
    );

    expect(screen.getByTestId('development-loop-canvas')).toBeInTheDocument();
    expect(screen.getByText('5 stages')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Run loop' }));

    expect(
      screen.getByText(
        'Add a feature summary and at least one acceptance criterion.',
      ),
    ).toBeVisible();
  });

  it('revises once and then passes with preserved validation feedback', async () => {
    const user = userEvent.setup();
    render(
      <DevelopmentRunProvider>
        <DevelopmentLoopWorkspace
          adapter={createScriptedDevelopmentAdapter(['revise', 'pass'])}
        />
      </DevelopmentRunProvider>,
    );

    await fillValidBrief(user);
    await user.click(screen.getByRole('button', { name: 'Run loop' }));

    expect(await screen.findByText('Iteration 2 of 3')).toBeVisible();
    expect(await screen.findByText('Passed')).toBeVisible();
    expect(screen.getByText('2 iterations')).toBeVisible();
    expect(
      screen.getByText('Handle the failed scripted acceptance case.'),
    ).toBeVisible();
  });

  it('shows iteration 1 and live test-plan evidence while code is still running', async () => {
    const user = userEvent.setup();
    const scripted = createScriptedDevelopmentAdapter(['pass']);
    let resolveCodeProposal!: (artifact: CodeArtifact) => void;
    const testPlan: TestPlanArtifact = {
      strategy: 'Focused contract plan.',
      cases: [
        {
          id: 'case-1',
          name: 'Retry limit is configurable',
          level: 'integration',
          expectedBehavior: 'The retry limit can be changed.',
        },
      ],
    };

    render(
      <DevelopmentRunProvider>
        <DevelopmentLoopWorkspace
          adapter={{
            ...scripted,
            async createTestPlan() {
              return testPlan;
            },
            createCodeProposal() {
              return new Promise<CodeArtifact>((resolve) => {
                resolveCodeProposal = resolve;
              });
            },
          }}
        />
      </DevelopmentRunProvider>,
    );

    await fillValidBrief(user);
    await user.click(screen.getByRole('button', { name: 'Run loop' }));

    expect(
      await screen.findByLabelText('Code feature: Running'),
    ).toBeInTheDocument();
    expect(screen.getByText('Iteration 1 of 3')).toBeVisible();
    expect(screen.queryByText('Iteration 0 of 3')).not.toBeInTheDocument();
    expect(
      within(
        screen.getByRole('complementary', { name: 'Run inspector' }),
      ).getByText('Focused contract plan.'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Run loop' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Stop' }));
    resolveCodeProposal({
      summary: 'Propose retry controls.',
      files: [{ path: 'src/retry.ts', change: 'Add retry configuration.' }],
      assumptions: [],
    });

    expect(await screen.findByText('Stopped')).toBeVisible();
    expect(screen.getByText('Iteration 1 of 3')).toBeVisible();
    expect(screen.queryByText('Iteration 0 of 3')).not.toBeInTheDocument();
  });

  it('rejects an invalid canonical graph before calling the adapter', async () => {
    const user = userEvent.setup();
    const createTestPlan = vi.fn(async () => {
      throw new Error('The adapter should not be called.');
    });

    render(
      <DevelopmentRunProvider>
        <DevelopmentLoopWorkspace
          graph={{
            nodes: canonicalDevelopmentGraph.nodes,
            edges: canonicalDevelopmentGraph.edges.filter(
              (edge) => edge.id !== 'validate-to-code',
            ),
          }}
          adapter={{
            createTestPlan,
            createCodeProposal: vi.fn(),
            executeTests: vi.fn(),
            validateResult: vi.fn(),
          }}
        />
      </DevelopmentRunProvider>,
    );

    await fillValidBrief(user);
    await user.click(screen.getByRole('button', { name: 'Run loop' }));

    expect(
      screen.getByText('Missing required connection: validate -> code'),
    ).toBeVisible();
    expect(createTestPlan).not.toHaveBeenCalled();
  });

  it('shows iteration 1 and blocked provider guidance after a stage failure', async () => {
    const user = userEvent.setup();
    const providerError =
      'OPENAI_API_KEY is not configured. Add it to .env.local and restart the dev server.';

    render(
      <DevelopmentRunProvider>
        <DevelopmentLoopWorkspace
          adapter={{
            async createTestPlan() {
              throw new Error(providerError);
            },
            async createCodeProposal() {
              throw new Error('unreachable');
            },
            async executeTests() {
              throw new Error('unreachable');
            },
            async validateResult() {
              throw new Error('unreachable');
            },
          }}
        />
      </DevelopmentRunProvider>,
    );

    await fillValidBrief(user);
    await user.click(screen.getByRole('button', { name: 'Run loop' }));

    expect(await screen.findByText('The run is blocked.')).toBeVisible();
    expect(screen.getByText('Iteration 1 of 3')).toBeVisible();
    expect(screen.queryByText('Iteration 0 of 3')).not.toBeInTheDocument();
    expect(screen.getByText(providerError)).toBeVisible();
    expect(
      screen.getByText(
        'Add OPENAI_API_KEY to .env.local, restart the development server, and run the loop again.',
      ),
    ).toBeVisible();
    expect(
      screen.getByLabelText('Test plan: Blocked'),
    ).toBeInTheDocument();
  });

  it('calls the default client adapter with a browser-safe fetch binding', async () => {
    const user = userEvent.setup();
    const originalFetch = globalThis.fetch;
    const browserFetch = vi.fn(async function (
      this: unknown,
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) {
      if (this !== globalThis) {
        throw new TypeError('Illegal invocation');
      }

      const request = JSON.parse(String(init?.body)) as {
        stage: 'test-plan' | 'code' | 'test' | 'validate';
      };
      const artifacts = {
        'test-plan': {
          strategy: 'Contract plan',
          cases: [
            {
              id: 'case-1',
              name: 'Retry limit is configurable',
              level: 'integration',
              expectedBehavior: 'The retry limit can be changed.',
            },
          ],
        },
        code: {
          summary: 'Add retry controls.',
          files: [
            {
              path: 'src/retry.ts',
              change: 'Add retry limit configuration.',
            },
          ],
          assumptions: [],
        },
        test: {
          status: 'passed',
          cases: [
            {
              testCaseId: 'case-1',
              status: 'passed',
              evidence: 'The retry limit changed.',
            },
          ],
        },
        validate: {
          verdict: 'pass',
          rationale: 'All acceptance evidence passed.',
          feedback: [],
        },
      } as const;

      return new Response(
        JSON.stringify({ artifact: artifacts[request.stage] }),
        { status: 200 },
      );
    });
    vi.stubGlobal('fetch', browserFetch);

    try {
      render(
        <DevelopmentRunProvider>
          <DevelopmentLoopWorkspace />
        </DevelopmentRunProvider>,
      );

      await fillValidBrief(user);
      await user.click(screen.getByRole('button', { name: 'Run loop' }));

      expect(await screen.findByText('Passed')).toBeVisible();
    } finally {
      vi.stubGlobal('fetch', originalFetch);
    }
  });

});
