import {
  codeArtifactSchema,
  developmentIterationSchema,
  developmentRunSchema,
  featureBriefSchema,
  type CodeInput,
  testArtifactSchema,
  testPlanArtifactSchema,
  type TestInput,
  type TestPlanInput,
  validationArtifactSchema,
  type ValidationInput,
  type CodeArtifact,
  type DevelopmentExecutionStage,
  type DevelopmentIteration,
  type DevelopmentRun,
  type FeatureBrief,
  type TestArtifact,
  type TestPlanArtifact,
  type ValidationArtifact,
} from './schemas';

export interface DevelopmentExecutionAdapter {
  createTestPlan(input: TestPlanInput): Promise<TestPlanArtifact>;
  createCodeProposal(input: CodeInput): Promise<CodeArtifact>;
  executeTests(input: TestInput): Promise<TestArtifact>;
  validateResult(input: ValidationInput): Promise<ValidationArtifact>;
}

export type DevelopmentLoopEvent =
  | { type: 'run-started'; run: DevelopmentRun }
  | {
      type: 'stage-started';
      stage: DevelopmentExecutionStage;
      iteration: number;
    }
  | {
      type: 'stage-completed';
      stage: DevelopmentExecutionStage;
      iteration: number;
      artifact: unknown;
    }
  | {
      type: 'stage-failed';
      stage: DevelopmentExecutionStage;
      iteration: number;
      error: string;
    }
  | { type: 'iteration-completed'; iteration: DevelopmentIteration }
  | { type: 'run-completed'; run: DevelopmentRun };

const defaultMaxIterations = 3;

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function runDevelopmentLoop(options: {
  runId: string;
  featureBrief: FeatureBrief;
  maxIterations?: number;
  adapter: DevelopmentExecutionAdapter;
  signal?: AbortSignal;
  onEvent?: (event: DevelopmentLoopEvent) => void;
  now?: () => Date;
}): Promise<DevelopmentRun> {
  const {
    runId,
    featureBrief,
    maxIterations = defaultMaxIterations,
    adapter,
    signal,
    onEvent,
    now = () => new Date(),
  } = options;
  const parsedFeatureBrief = featureBriefSchema.parse(featureBrief);
  let finalEventEmitted = false;

  const emit = (event: DevelopmentLoopEvent) => {
    onEvent?.(event);
  };

  const buildRun = (
    status: DevelopmentRun['status'],
    iterations: DevelopmentIteration[],
    overrides: Partial<DevelopmentRun> = {},
  ) =>
    developmentRunSchema.parse({
      id: runId,
      status,
      featureBrief: parsedFeatureBrief,
      maxIterations,
      iterations,
      startedAt: baseRun.startedAt,
      ...overrides,
    });

  const finishRun = (
    status: DevelopmentRun['status'],
    iterations: DevelopmentIteration[],
    overrides: Partial<DevelopmentRun> = {},
  ) => {
    const run = buildRun(status, iterations, {
      finishedAt: now().toISOString(),
      ...overrides,
    });

    if (!finalEventEmitted) {
      emit({ type: 'run-completed', run });
      finalEventEmitted = true;
    }

    return run;
  };

  const stoppedIfAborted = (iterations: DevelopmentIteration[]) =>
    signal?.aborted ? finishRun('stopped', iterations) : null;

  const baseRun = developmentRunSchema.parse({
    id: runId,
    status: 'running',
    featureBrief: parsedFeatureBrief,
    maxIterations,
    iterations: [],
    startedAt: now().toISOString(),
  });

  emit({ type: 'run-started', run: baseRun });

  const preflightStop = stoppedIfAborted([]);
  if (preflightStop) {
    return preflightStop;
  }

  const iterations: DevelopmentIteration[] = [];
  let priorFeedback: string[] = [];

  for (let iterationNumber = 1; iterationNumber <= maxIterations; iterationNumber += 1) {
    const testPlanStop = stoppedIfAborted(iterations);
    if (testPlanStop) {
      return testPlanStop;
    }

    const testPlanInput: TestPlanInput = {
      featureBrief: parsedFeatureBrief,
      iteration: iterationNumber,
      priorFeedback,
    };

    emit({
      type: 'stage-started',
      stage: 'test-plan',
      iteration: iterationNumber,
    });

    let testPlan: TestPlanArtifact;
    try {
      const result = await adapter.createTestPlan(testPlanInput);
      const stoppedRun = stoppedIfAborted(iterations);
      if (stoppedRun) {
        return stoppedRun;
      }

      testPlan = testPlanArtifactSchema.parse(result);
      emit({
        type: 'stage-completed',
        stage: 'test-plan',
        iteration: iterationNumber,
        artifact: testPlan,
      });
    } catch (error) {
      const stoppedRun = stoppedIfAborted(iterations);
      if (stoppedRun) {
        return stoppedRun;
      }

      const message = toErrorMessage(error);
      emit({
        type: 'stage-failed',
        stage: 'test-plan',
        iteration: iterationNumber,
        error: message,
      });
      return finishRun('blocked', iterations, { error: message });
    }

    const codeStop = stoppedIfAborted(iterations);
    if (codeStop) {
      return codeStop;
    }

    const codeInput: CodeInput = {
      ...testPlanInput,
      testPlan,
    };

    emit({
      type: 'stage-started',
      stage: 'code',
      iteration: iterationNumber,
    });

    let code: CodeArtifact;
    try {
      const result = await adapter.createCodeProposal(codeInput);
      const stoppedRun = stoppedIfAborted(iterations);
      if (stoppedRun) {
        return stoppedRun;
      }

      code = codeArtifactSchema.parse(result);
      emit({
        type: 'stage-completed',
        stage: 'code',
        iteration: iterationNumber,
        artifact: code,
      });
    } catch (error) {
      const stoppedRun = stoppedIfAborted(iterations);
      if (stoppedRun) {
        return stoppedRun;
      }

      const message = toErrorMessage(error);
      emit({
        type: 'stage-failed',
        stage: 'code',
        iteration: iterationNumber,
        error: message,
      });
      return finishRun('blocked', iterations, { error: message });
    }

    const testStop = stoppedIfAborted(iterations);
    if (testStop) {
      return testStop;
    }

    const testInput: TestInput = {
      ...codeInput,
      code,
    };

    emit({
      type: 'stage-started',
      stage: 'test',
      iteration: iterationNumber,
    });

    let test: TestArtifact;
    try {
      const result = await adapter.executeTests(testInput);
      const stoppedRun = stoppedIfAborted(iterations);
      if (stoppedRun) {
        return stoppedRun;
      }

      test = testArtifactSchema.parse(result);
      emit({
        type: 'stage-completed',
        stage: 'test',
        iteration: iterationNumber,
        artifact: test,
      });
    } catch (error) {
      const stoppedRun = stoppedIfAborted(iterations);
      if (stoppedRun) {
        return stoppedRun;
      }

      const message = toErrorMessage(error);
      emit({
        type: 'stage-failed',
        stage: 'test',
        iteration: iterationNumber,
        error: message,
      });
      return finishRun('blocked', iterations, { error: message });
    }

    const validationStop = stoppedIfAborted(iterations);
    if (validationStop) {
      return validationStop;
    }

    const validationInput: ValidationInput = {
      ...testInput,
      test,
    };

    emit({
      type: 'stage-started',
      stage: 'validate',
      iteration: iterationNumber,
    });

    let validation: ValidationArtifact;
    try {
      const result = await adapter.validateResult(validationInput);
      const stoppedRun = stoppedIfAborted(iterations);
      if (stoppedRun) {
        return stoppedRun;
      }

      validation = validationArtifactSchema.parse(result);
      emit({
        type: 'stage-completed',
        stage: 'validate',
        iteration: iterationNumber,
        artifact: validation,
      });
    } catch (error) {
      const stoppedRun = stoppedIfAborted(iterations);
      if (stoppedRun) {
        return stoppedRun;
      }

      const message = toErrorMessage(error);
      emit({
        type: 'stage-failed',
        stage: 'validate',
        iteration: iterationNumber,
        error: message,
      });
      return finishRun('blocked', iterations, { error: message });
    }

    const completedIteration = developmentIterationSchema.parse({
      number: iterationNumber,
      testPlan,
      code,
      test,
      validation,
    });

    iterations.push(completedIteration);
    emit({
      type: 'iteration-completed',
      iteration: completedIteration,
    });

    if (validation.verdict === 'pass') {
      return finishRun('passed', iterations);
    }

    if (validation.verdict === 'blocked') {
      return finishRun('blocked', iterations);
    }

    priorFeedback = validation.feedback;

    if (iterationNumber === maxIterations) {
      return finishRun('iteration-limit', iterations);
    }
  }

  return finishRun('iteration-limit', iterations);
}
