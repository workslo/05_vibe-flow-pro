'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import type {
  CodeArtifact,
  DevelopmentIteration,
  RunStatus,
  TestArtifact,
  TestPlanArtifact,
  ValidationArtifact,
} from '../domain/schemas';
import { useDevelopmentRunStore } from '../store';

const statusLabels = {
  idle: 'Ready',
  running: 'Running',
  passed: 'Passed',
  blocked: 'Blocked',
  stopped: 'Stopped',
  'iteration-limit': 'Iteration limit reached',
} satisfies Record<RunStatus, string>;

const statusClasses = {
  idle: 'text-slate-600',
  running: 'text-amber-700',
  passed: 'text-emerald-700',
  blocked: 'text-red-700',
  stopped: 'text-slate-700',
  'iteration-limit': 'text-amber-700',
} satisfies Record<RunStatus, string>;

type ArtifactSectionId = 'test-plan' | 'code' | 'test' | 'validation';
type ArtifactSectionItem<TArtifact> = {
  iteration: number;
  artifact: TArtifact;
};

const stageSequence = ['test-plan', 'code', 'test', 'validate'] as const;

function createArtifactSectionItems<TArtifact>(
  iterations: DevelopmentIteration[],
  selectArtifact: (iteration: DevelopmentIteration) => TArtifact,
): ArtifactSectionItem<TArtifact>[] {
  return iterations.map((iteration) => ({
    iteration: iteration.number,
    artifact: selectArtifact(iteration),
  }));
}

function ArtifactSection<TArtifact>({
  id,
  title,
  items,
  renderArtifact,
}: {
  id: ArtifactSectionId;
  title: string;
  items: ArtifactSectionItem<TArtifact>[];
  renderArtifact: (artifact: TArtifact) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  const contentId = `${id}-evidence`;

  return (
    <section className="border-t border-slate-200">
      <h3>
        <button
          type="button"
          aria-controls={contentId}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-slate-900 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"
          onClick={() => setExpanded((current) => !current)}
        >
          {title}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-4 text-slate-500 transition-transform motion-reduce:transition-none',
              expanded && 'rotate-180',
            )}
          />
        </button>
      </h3>
      {expanded ? (
        <div id={contentId} className="space-y-5 px-5 pb-5">
          {items.length ? (
            items.map((item) => (
              <div
                key={`${id}-${item.iteration}`}
                className="border-l-2 border-slate-200 pl-3"
              >
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Iteration {item.iteration}
                </p>
                {renderArtifact(item.artifact)}
              </div>
            ))
          ) : (
            <p className="text-xs leading-5 text-slate-500">
              Evidence appears here after the first iteration completes.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

export function RunInspector() {
  const activeRun = useDevelopmentRunStore((state) => state.activeRun);
  const currentIteration = useDevelopmentRunStore(
    (state) => state.currentIteration,
  );
  const currentStage = useDevelopmentRunStore((state) => state.currentStage);
  const stageArtifacts = useDevelopmentRunStore((state) => state.stageArtifacts);
  const runSummaries = useDevelopmentRunStore((state) => state.runSummaries);
  const status = activeRun?.status ?? 'idle';
  const iterations = activeRun?.iterations ?? [];
  const priorRuns = runSummaries.filter(
    (summary) => summary.id !== activeRun?.id,
  );
  const hasMissingKeyError = activeRun?.error?.includes('OPENAI_API_KEY');
  const currentStageIndex = currentStage
    ? stageSequence.indexOf(currentStage)
    : -1;
  const liveIterationNumber =
    status === 'running' && currentIteration > iterations.length
      ? currentIteration
      : undefined;
  const completedLiveStages =
    liveIterationNumber && currentStageIndex > 0
      ? stageSequence.slice(0, currentStageIndex)
      : [];
  const testPlanItems = createArtifactSectionItems(
    iterations,
    (iteration) => iteration.testPlan,
  );
  const codeItems = createArtifactSectionItems(
    iterations,
    (iteration) => iteration.code,
  );
  const testItems = createArtifactSectionItems(
    iterations,
    (iteration) => iteration.test,
  );
  const validationItems = createArtifactSectionItems(
    iterations,
    (iteration) => iteration.validation,
  );

  if (
    liveIterationNumber &&
    completedLiveStages.includes('test-plan') &&
    stageArtifacts['test-plan']
  ) {
    testPlanItems.push({
      iteration: liveIterationNumber,
      artifact: stageArtifacts['test-plan'] as TestPlanArtifact,
    });
  }

  if (
    liveIterationNumber &&
    completedLiveStages.includes('code') &&
    stageArtifacts.code
  ) {
    codeItems.push({
      iteration: liveIterationNumber,
      artifact: stageArtifacts.code as CodeArtifact,
    });
  }

  if (
    liveIterationNumber &&
    completedLiveStages.includes('test') &&
    stageArtifacts.test
  ) {
    testItems.push({
      iteration: liveIterationNumber,
      artifact: stageArtifacts.test as TestArtifact,
    });
  }

  if (
    liveIterationNumber &&
    completedLiveStages.includes('validate') &&
    stageArtifacts.validate
  ) {
    validationItems.push({
      iteration: liveIterationNumber,
      artifact: stageArtifacts.validate as ValidationArtifact,
    });
  }

  return (
    <aside
      aria-labelledby="run-inspector-heading"
      className="min-w-0 overflow-y-auto border-l border-slate-200 bg-white"
    >
      <header className="px-5 py-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Live evidence
        </p>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h2
              id="run-inspector-heading"
              className="text-base font-semibold text-slate-950"
            >
              Run inspector
            </h2>
            <p className="mt-1 font-mono text-xs text-slate-500">
              Iteration {currentIteration} of {activeRun?.maxIterations ?? 3}
            </p>
          </div>
          <p
            className={cn(
              'font-mono text-xs font-bold uppercase tracking-[0.1em]',
              statusClasses[status],
            )}
          >
            {statusLabels[status]}
          </p>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          {iterations.length}{' '}
          {iterations.length === 1 ? 'iteration' : 'iterations'}
        </p>
      </header>

      {activeRun?.error ? (
        <div
          role="alert"
          className="border-y border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-900"
        >
          <p className="font-semibold">The run is blocked.</p>
          <p className="mt-1">{activeRun.error}</p>
          <p className="mt-2 text-xs leading-5">
            {hasMissingKeyError
              ? 'Add OPENAI_API_KEY to .env.local, restart the development server, and run the loop again.'
              : 'Confirm the provider configuration and connectivity, then run the loop again.'}
          </p>
        </div>
      ) : null}

      <ArtifactSection
        id="test-plan"
        title="Test plan"
        items={testPlanItems}
        renderArtifact={(artifact) => (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {artifact.strategy}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {artifact.cases.map((testCase) => (
                <li key={testCase.id}>
                  <span className="font-mono">{testCase.id}</span>{' '}
                  {testCase.name}
                </li>
              ))}
            </ul>
          </>
        )}
      />
      <ArtifactSection
        id="code"
        title="Code proposal"
        items={codeItems}
        renderArtifact={(artifact) => (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {artifact.summary}
            </p>
            <ul className="mt-2 space-y-2 text-xs text-slate-600">
              {artifact.files.map((file) => (
                <li key={file.path}>
                  <span className="font-mono text-slate-800">
                    {file.path}
                  </span>
                  <span className="block">{file.change}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      />
      <ArtifactSection
        id="test"
        title="Test evidence"
        items={testItems}
        renderArtifact={(artifact) => (
          <ul className="mt-2 space-y-2 text-xs text-slate-600">
            {artifact.cases.map((testCase) => (
              <li key={testCase.testCaseId}>
                <span className="font-mono font-semibold uppercase">
                  {testCase.status}
                </span>
                <span className="ml-2">{testCase.evidence}</span>
              </li>
            ))}
          </ul>
        )}
      />
      <ArtifactSection
        id="validation"
        title="Validation"
        items={validationItems}
        renderArtifact={(artifact) => (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {artifact.rationale}
            </p>
            {artifact.feedback.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-amber-800">
                {artifact.feedback.map((feedback) => (
                  <li key={feedback}>{feedback}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-emerald-700">
                No revision feedback.
              </p>
            )}
          </>
        )}
      />

      <section className="border-t border-slate-200 px-5 py-5">
        <h3 className="text-sm font-semibold text-slate-900">Prior runs</h3>
        {priorRuns.length ? (
          <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
            {priorRuns.map((run) => (
              <li
                key={run.id}
                className="flex items-center justify-between gap-3 py-3 text-xs"
              >
                <span className="font-mono text-slate-500">
                  {run.iterationCount}{' '}
                  {run.iterationCount === 1 ? 'iteration' : 'iterations'}
                </span>
                <span
                  className={cn(
                    'font-mono font-semibold uppercase',
                    statusClasses[run.status],
                  )}
                >
                  {statusLabels[run.status]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Completed runs stay in this browser session.
          </p>
        )}
      </section>
    </aside>
  );
}
