import { z } from 'zod/v4';

import type { DevelopmentExecutionAdapter } from './engine';
import {
  codeArtifactSchema,
  type CodeInput,
  testArtifactSchema,
  type TestInput,
  testPlanArtifactSchema,
  type TestPlanInput,
  validationArtifactSchema,
  type ValidationInput,
} from './schemas';

type DevelopmentStageResponse = {
  artifact?: unknown;
  error?: string;
};

type FetchImpl = typeof fetch;

async function callStage<TInput, TArtifact>(options: {
  fetchImpl: FetchImpl;
  stage: 'test-plan' | 'code' | 'test' | 'validate';
  input: TInput;
  schema: z.ZodType<TArtifact>;
}): Promise<TArtifact> {
  const response = await options.fetchImpl('/api/development-loop/stage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      stage: options.stage,
      input: options.input,
    }),
  });
  const body = (await response.json()) as DevelopmentStageResponse;

  if (!response.ok) {
    throw new Error(body.error ?? 'Stage request failed');
  }

  return options.schema.parse(body.artifact);
}

export function createClientDevelopmentAdapter(
  fetchImpl: FetchImpl = fetch,
): DevelopmentExecutionAdapter {
  return {
    createTestPlan(input: TestPlanInput) {
      return callStage({
        fetchImpl,
        stage: 'test-plan',
        input,
        schema: testPlanArtifactSchema,
      });
    },
    createCodeProposal(input: CodeInput) {
      return callStage({
        fetchImpl,
        stage: 'code',
        input,
        schema: codeArtifactSchema,
      });
    },
    executeTests(input: TestInput) {
      return callStage({
        fetchImpl,
        stage: 'test',
        input,
        schema: testArtifactSchema,
      });
    },
    validateResult(input: ValidationInput) {
      return callStage({
        fetchImpl,
        stage: 'validate',
        input,
        schema: validationArtifactSchema,
      });
    },
  };
}
