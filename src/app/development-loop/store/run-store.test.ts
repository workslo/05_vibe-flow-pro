import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import type { DevelopmentIteration, DevelopmentRun } from '../domain/schemas';
import {
  DevelopmentRunProvider,
  useDevelopmentRunStore,
} from './index';
import { createDevelopmentRunStore } from './run-store';

const validFeatureBrief = {
  summary: 'Add retry controls',
  acceptanceCriteria: ['A user can set the retry limit'],
};

const completedIteration: DevelopmentIteration = {
  number: 1,
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
  code: {
    summary: 'Update the retry form',
    files: [{ path: 'src/feature.ts', change: 'Add a retry input.' }],
    assumptions: [],
  },
  test: {
    status: 'passed',
    cases: [
      {
        testCaseId: 'case-1',
        status: 'passed',
        evidence: 'Observed the retry input.',
      },
    ],
  },
  validation: {
    verdict: 'pass',
    rationale: 'The retry input satisfies the criteria.',
    feedback: [],
  },
};

const runningRun: DevelopmentRun = {
  id: 'run-1',
  status: 'running',
  featureBrief: validFeatureBrief,
  maxIterations: 3,
  iterations: [],
  startedAt: '2026-06-18T00:00:00.000Z',
};

const passedRun: DevelopmentRun = {
  ...runningRun,
  status: 'passed',
  iterations: [completedIteration],
  finishedAt: '2026-06-18T00:05:00.000Z',
};

describe('createDevelopmentRunStore', () => {
  it('preserves completed iterations and run summaries', () => {
    const store = createDevelopmentRunStore();
    const controller = new AbortController();

    store.getState().startRun(controller);
    store.getState().applyEvent({ type: 'run-started', run: runningRun });
    store.getState().applyEvent({
      type: 'iteration-completed',
      iteration: completedIteration,
    });
    store.getState().applyEvent({
      type: 'stage-started',
      stage: 'validate',
      iteration: 1,
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
    expect(store.getState().controller).toBeUndefined();
    expect(store.getState().currentStage).toBeUndefined();
  });

  it('aborts the active controller when stop is requested', () => {
    const store = createDevelopmentRunStore();
    const controller = new AbortController();

    store.getState().startRun(controller);
    store.getState().requestStop();

    expect(controller.signal.aborted).toBe(true);
  });

  it('retains stage failures on the active run', () => {
    const store = createDevelopmentRunStore();

    store.getState().applyEvent({ type: 'run-started', run: runningRun });
    store.getState().applyEvent({
      type: 'stage-started',
      stage: 'code',
      iteration: 1,
    });
    store.getState().applyEvent({
      type: 'stage-failed',
      stage: 'code',
      iteration: 1,
      error: 'Stage failed',
    });

    expect(store.getState().activeRun?.error).toBe('Stage failed');
    expect(store.getState().currentStage).toBe('code');
    expect(store.getState().currentIteration).toBe(1);
  });
});

describe('DevelopmentRunProvider', () => {
  it('provides the typed run store hook', () => {
    const FeatureBriefSummary = () => {
      const summary = useDevelopmentRunStore((state) => state.featureBrief.summary);

      return createElement('p', undefined, summary || 'empty');
    };

    render(
      createElement(
        DevelopmentRunProvider,
        undefined,
        createElement(FeatureBriefSummary),
      ),
    );

    expect(screen.getByText('empty')).toBeVisible();
  });
});
