'use client';

import { useMemo, useState, type FormEvent } from 'react';

import { createClientDevelopmentAdapter } from '../domain/client-adapter';
import {
  runDevelopmentLoop,
  type DevelopmentExecutionAdapter,
} from '../domain/engine';
import {
  featureBriefSchema,
  type DevelopmentExecutionStage,
} from '../domain/schemas';
import {
  canonicalDevelopmentGraph,
  validateDevelopmentGraph,
} from '../domain/template';
import { useDevelopmentRunStore } from '../store';
import {
  DevelopmentLoopCanvas,
  type DevelopmentGraph,
} from './development-loop-canvas';
import { RunInspector } from './run-inspector';
import { WorkspaceSidebar } from './workspace-sidebar';

export interface DevelopmentLoopWorkspaceProps {
  adapter?: DevelopmentExecutionAdapter;
  graph?: DevelopmentGraph;
}

const invalidBriefMessage =
  'Add a feature summary and at least one acceptance criterion.';

export function DevelopmentLoopWorkspace(
  {
    adapter,
    graph = canonicalDevelopmentGraph,
  }: DevelopmentLoopWorkspaceProps,
) {
  const [summary, setSummary] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [briefError, setBriefError] = useState<string>();
  const [graphError, setGraphError] = useState<string>();
  const [executionError, setExecutionError] = useState<string>();
  const [failedStage, setFailedStage] =
    useState<DevelopmentExecutionStage>();
  const activeAdapter = useMemo(
    () =>
      adapter ??
      createClientDevelopmentAdapter((input, init) =>
        globalThis.fetch(input, init),
      ),
    [adapter],
  );
  const controller = useDevelopmentRunStore((state) => state.controller);
  const activeRun = useDevelopmentRunStore((state) => state.activeRun);
  const setFeatureBrief = useDevelopmentRunStore(
    (state) => state.setFeatureBrief,
  );
  const startRun = useDevelopmentRunStore((state) => state.startRun);
  const requestStop = useDevelopmentRunStore((state) => state.requestStop);
  const applyEvent = useDevelopmentRunStore((state) => state.applyEvent);
  const isRunning = Boolean(controller) || activeRun?.status === 'running';
  const stageCountLabel = `${graph.nodes.length} ${graph.nodes.length === 1 ? 'stage' : 'stages'}`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const briefResult = featureBriefSchema.safeParse({
      summary,
      acceptanceCriteria: acceptanceCriteria
        .split('\n')
        .map((criterion) => criterion.trim())
        .filter(Boolean),
    });

    if (!briefResult.success) {
      setBriefError(invalidBriefMessage);
      return;
    }

    setBriefError(undefined);
    setGraphError(undefined);
    setExecutionError(undefined);

    const graphResult = validateDevelopmentGraph(graph.nodes, graph.edges);
    if (!graphResult.valid) {
      setGraphError(graphResult.error);
      return;
    }

    setFeatureBrief(briefResult.data);
    setFailedStage(undefined);

    const abortController = new AbortController();
    startRun(abortController);

    try {
      await runDevelopmentLoop({
        runId:
          globalThis.crypto?.randomUUID?.() ??
          `development-run-${Date.now()}`,
        featureBrief: briefResult.data,
        maxIterations: 3,
        adapter: activeAdapter,
        signal: abortController.signal,
        onEvent: (engineEvent) => {
          if (engineEvent.type === 'stage-failed') {
            setFailedStage(engineEvent.stage);
          }
          applyEvent(engineEvent);
        },
      });
    } catch (error) {
      setExecutionError(
        error instanceof Error ? error.message : 'The development loop failed.',
      );
    }
  };

  return (
    <main className="min-h-screen bg-background lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-full lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)_minmax(300px,360px)]">
        <WorkspaceSidebar
          graphNodes={graph.nodes}
          summary={summary}
          acceptanceCriteria={acceptanceCriteria}
          isRunning={isRunning}
          error={briefError ?? graphError ?? executionError}
          onSummaryChange={setSummary}
          onAcceptanceCriteriaChange={setAcceptanceCriteria}
          onRun={(event) => {
            void handleSubmit(event);
          }}
          onStop={requestStop}
        />

        <section
          aria-labelledby="stage-canvas-heading"
          className="grid min-h-[560px] min-w-0 grid-rows-[auto_1fr] border-b border-slate-200 lg:min-h-0 lg:border-b-0"
        >
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 bg-white/70 px-5 py-4">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Canonical evidence spine
              </p>
              <h2
                id="stage-canvas-heading"
                className="mt-1 text-base font-semibold text-slate-950"
              >
                Plan, code, test, validate
              </h2>
              <p className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {stageCountLabel}
              </p>
            </div>
            <p className="max-w-md text-xs leading-5 text-slate-500">
              Reposition stages to inspect the flow. Stage identities and
              connections stay fixed.
            </p>
          </header>
          <DevelopmentLoopCanvas graph={graph} failedStage={failedStage} />
        </section>

        <RunInspector />
      </div>
    </main>
  );
}
