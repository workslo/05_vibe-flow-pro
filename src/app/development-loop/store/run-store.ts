import { create } from 'zustand';

import type { DevelopmentLoopEvent } from '../domain/engine';
import type {
  DevelopmentExecutionStage,
  DevelopmentIteration,
  DevelopmentRun,
  FeatureBrief,
  RunStatus,
} from '../domain/schemas';

export type DevelopmentRunSummary = {
  id: string;
  status: RunStatus;
  iterationCount: number;
  startedAt: string;
  finishedAt?: string;
};

export type DevelopmentRunState = {
  featureBrief: FeatureBrief;
  activeRun?: DevelopmentRun;
  currentStage?: DevelopmentExecutionStage;
  currentIteration: number;
  stageArtifacts: Partial<Record<DevelopmentExecutionStage, unknown>>;
  runSummaries: DevelopmentRunSummary[];
  controller?: AbortController;
};

export type DevelopmentRunActions = {
  setFeatureBrief: (featureBrief: FeatureBrief) => void;
  startRun: (controller: AbortController) => void;
  requestStop: () => void;
  applyEvent: (event: DevelopmentLoopEvent) => void;
  resetActiveRun: () => void;
};

export type DevelopmentRunStore = DevelopmentRunState & DevelopmentRunActions;

const defaultFeatureBrief: FeatureBrief = {
  summary: '',
  acceptanceCriteria: [],
};

function upsertIteration(
  iterations: DevelopmentIteration[],
  iteration: DevelopmentIteration,
): DevelopmentIteration[] {
  const existingIndex = iterations.findIndex(
    (current) => current.number === iteration.number,
  );

  if (existingIndex === -1) {
    return [...iterations, iteration];
  }

  return iterations.map((current, index) =>
    index === existingIndex ? iteration : current,
  );
}

function buildRunSummary(run: DevelopmentRun): DevelopmentRunSummary {
  return {
    id: run.id,
    status: run.status,
    iterationCount: run.iterations.length,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
  };
}

export function createDevelopmentRunStore(
  initialState: Partial<DevelopmentRunState> | undefined = undefined,
) {
  const store = create<DevelopmentRunStore>()((set, get) => ({
    featureBrief: initialState?.featureBrief ?? defaultFeatureBrief,
    activeRun: initialState?.activeRun,
    currentStage: initialState?.currentStage,
    currentIteration: initialState?.currentIteration ?? 0,
    stageArtifacts: initialState?.stageArtifacts ?? {},
    runSummaries: initialState?.runSummaries ?? [],
    controller: initialState?.controller,

    setFeatureBrief: (featureBrief) => set({ featureBrief }),

    startRun: (controller) =>
      set({
        controller,
        activeRun: undefined,
        currentStage: undefined,
        currentIteration: 0,
        stageArtifacts: {},
      }),

    requestStop: () => {
      get().controller?.abort();
    },

    applyEvent: (event) => {
      switch (event.type) {
        case 'run-started':
          set({
            activeRun: event.run,
            currentStage: undefined,
            currentIteration: event.run.iterations.length,
          });
          return;
        case 'stage-started':
          set({
            currentStage: event.stage,
            currentIteration: event.iteration,
          });
          return;
        case 'stage-completed':
          set((state) => ({
            currentStage: event.stage,
            currentIteration: event.iteration,
            stageArtifacts: {
              ...state.stageArtifacts,
              [event.stage]: event.artifact,
            },
          }));
          return;
        case 'iteration-completed': {
          const activeRun = get().activeRun;

          if (!activeRun) {
            return;
          }

          set({
            activeRun: {
              ...activeRun,
              iterations: upsertIteration(activeRun.iterations, event.iteration),
            },
            currentIteration: event.iteration.number,
          });
          return;
        }
        case 'stage-failed': {
          const activeRun = get().activeRun;

          set({
            activeRun: activeRun
              ? {
                  ...activeRun,
                  error: event.error,
                }
              : activeRun,
            currentStage: event.stage,
            currentIteration: event.iteration,
          });
          return;
        }
        case 'run-completed':
          set((state) => ({
            activeRun: event.run,
            currentStage: undefined,
            currentIteration: event.run.iterations.length,
            controller: undefined,
            runSummaries: [buildRunSummary(event.run), ...state.runSummaries],
          }));
          return;
      }
    },

    resetActiveRun: () =>
      set({
        activeRun: undefined,
        currentStage: undefined,
        currentIteration: 0,
        stageArtifacts: {},
        controller: undefined,
      }),
  }));

  return store;
}
