import { generateObject } from 'ai';
import { z } from 'zod/v4';

import { getOpenAIProvider } from '@/app/api/openai';
import type { DevelopmentExecutionAdapter } from '@/app/development-loop/domain/engine';
import {
  codeArtifactSchema,
  type CodeInput,
  testArtifactSchema,
  type TestInput,
  testPlanArtifactSchema,
  type TestPlanInput,
  validationArtifactSchema,
  type ValidationInput,
} from '@/app/development-loop/domain/schemas';

const TEST_PLAN_SYSTEM_PROMPT =
  'Create a proposed test plan for a simulated development loop iteration. Treat the response as a proposal only, and do not claim that files were changed or commands were run.';

const CODE_SYSTEM_PROMPT =
  'Create a proposed code-change summary for a simulated development loop iteration. Treat the response as a proposal only, and do not claim that files were changed or commands were run.';

const TEST_SYSTEM_PROMPT =
  'Create a simulated test execution report for a proposed development loop iteration. Treat the response as a simulation only, and do not claim that commands were actually run.';

const VALIDATION_SYSTEM_PROMPT =
  'Create a simulated validation verdict for a proposed development loop iteration. Treat the response as a simulation only, and do not claim that files were changed or commands were run.';

async function generateStageArtifact<TInput, TArtifact>(options: {
  input: TInput;
  schema: z.ZodType<TArtifact>;
  system: string;
}): Promise<TArtifact> {
  const openai = getOpenAIProvider();
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: options.schema,
    system: options.system,
    prompt: JSON.stringify(options.input),
  });

  return options.schema.parse(object);
}

export function createOpenAIDevelopmentAdapter(): DevelopmentExecutionAdapter {
  return {
    async createTestPlan(input: TestPlanInput) {
      return generateStageArtifact({
        input,
        schema: testPlanArtifactSchema,
        system: TEST_PLAN_SYSTEM_PROMPT,
      });
    },
    async createCodeProposal(input: CodeInput) {
      return generateStageArtifact({
        input,
        schema: codeArtifactSchema,
        system: CODE_SYSTEM_PROMPT,
      });
    },
    async executeTests(input: TestInput) {
      return generateStageArtifact({
        input,
        schema: testArtifactSchema,
        system: TEST_SYSTEM_PROMPT,
      });
    },
    async validateResult(input: ValidationInput) {
      return generateStageArtifact({
        input,
        schema: validationArtifactSchema,
        system: VALIDATION_SYSTEM_PROMPT,
      });
    },
  };
}
