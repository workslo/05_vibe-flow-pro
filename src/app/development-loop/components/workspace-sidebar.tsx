'use client';

import type { FormEvent } from 'react';
import { CircleStop, Play } from 'lucide-react';

import {
  DEVELOPMENT_STAGE_IDS,
  type DevelopmentGraphNode,
} from '../domain/template';

export interface WorkspaceSidebarProps {
  graphNodes: DevelopmentGraphNode[];
  summary: string;
  acceptanceCriteria: string;
  isRunning: boolean;
  error?: string;
  onSummaryChange: (value: string) => void;
  onAcceptanceCriteriaChange: (value: string) => void;
  onRun: (event: FormEvent<HTMLFormElement>) => void;
  onStop: () => void;
}

export function WorkspaceSidebar({
  graphNodes,
  summary,
  acceptanceCriteria,
  isRunning,
  error,
  onSummaryChange,
  onAcceptanceCriteriaChange,
  onRun,
  onStop,
}: WorkspaceSidebarProps) {
  const labels = new Map(graphNodes.map((node) => [node.id, node.label]));

  return (
    <aside className="min-w-0 overflow-y-auto border-r border-sidebar-border bg-sidebar px-5 py-5 text-sidebar-foreground">
      <header>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55">
          Vibe Flow Pro
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          AI development loop
        </h1>
        <p className="mt-2 text-sm leading-6 text-sidebar-foreground/65">
          Launch a bounded plan-code-test-validate run and inspect its evidence.
        </p>
      </header>

      <form className="mt-7 border-t border-sidebar-border pt-6" onSubmit={onRun}>
        <h2 className="text-sm font-semibold">Feature brief</h2>
        <div className="mt-4">
          <label
            className="text-xs font-medium text-sidebar-foreground/80"
            htmlFor="feature-summary"
          >
            Feature summary
          </label>
          <textarea
            id="feature-summary"
            value={summary}
            rows={4}
            className="mt-2 w-full resize-y border border-sidebar-border bg-sidebar-accent px-3 py-2 text-sm leading-6 text-sidebar-accent-foreground outline-none placeholder:text-sidebar-foreground/35 focus-visible:border-sidebar-primary focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
            placeholder="Add retry controls to the workflow runner."
            onChange={(event) => onSummaryChange(event.target.value)}
          />
        </div>
        <div className="mt-4">
          <label
            className="text-xs font-medium text-sidebar-foreground/80"
            htmlFor="acceptance-criteria"
          >
            Acceptance criteria
          </label>
          <textarea
            id="acceptance-criteria"
            value={acceptanceCriteria}
            rows={5}
            className="mt-2 w-full resize-y border border-sidebar-border bg-sidebar-accent px-3 py-2 text-sm leading-6 text-sidebar-accent-foreground outline-none placeholder:text-sidebar-foreground/35 focus-visible:border-sidebar-primary focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
            placeholder={'One criterion per line\nA user can set the retry limit'}
            onChange={(event) =>
              onAcceptanceCriteriaChange(event.target.value)
            }
          />
          <p className="mt-2 text-xs leading-5 text-sidebar-foreground/50">
            Enter one observable outcome per line.
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 border-l-2 border-red-400 pl-3 text-xs leading-5 text-red-200"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button
            type="submit"
            disabled={isRunning}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 bg-emerald-600 px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play aria-hidden="true" className="size-4" />
            Run loop
          </button>
          {isRunning ? (
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 border border-amber-400 px-3 text-sm font-semibold text-amber-100 outline-none transition-colors hover:bg-amber-400/10 focus-visible:ring-2 focus-visible:ring-amber-300"
              onClick={onStop}
            >
              <CircleStop aria-hidden="true" className="size-4" />
              Stop
            </button>
          ) : null}
        </div>
      </form>

      <section className="mt-8 border-t border-sidebar-border pt-6">
        <h2 className="text-sm font-semibold">Canonical stages</h2>
        <ol className="mt-4 space-y-0">
          {DEVELOPMENT_STAGE_IDS.map((stageId, index) => (
            <li
              key={stageId}
              className="relative flex min-h-10 items-start gap-3 pb-3"
            >
              {index < DEVELOPMENT_STAGE_IDS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[5px] top-4 h-full w-px bg-sidebar-border"
                />
              ) : null}
              <span className="relative mt-1 size-3 shrink-0 border border-sidebar-foreground/35 bg-sidebar" />
              <span>
                <span className="block text-xs font-medium">
                  {labels.get(stageId) ?? stageId}
                </span>
                <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/45">
                  {stageId}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
