import { z } from 'zod/v4';

export const developmentExecutionStageSchema = z.enum([
  'test-plan',
  'code',
  'test',
  'validate',
]);

export const runStatusSchema = z.enum([
  'idle',
  'running',
  'passed',
  'blocked',
  'stopped',
  'iteration-limit',
]);

export const featureBriefSchema = z.object({
  summary: z.string().trim().min(1),
  acceptanceCriteria: z.array(z.string().trim().min(1)).min(1),
});

export const testPlanArtifactSchema = z.object({
  strategy: z.string().trim().min(1),
  cases: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        name: z.string().trim().min(1),
        level: z.enum(['unit', 'integration', 'e2e']),
        expectedBehavior: z.string().trim().min(1),
      }),
    )
    .min(1),
});

export const testPlanInputSchema = z.object({
  featureBrief: featureBriefSchema,
  iteration: z.number().int().positive(),
  priorFeedback: z.array(z.string().trim().min(1)),
});

export const codeArtifactSchema = z.object({
  summary: z.string().trim().min(1),
  files: z
    .array(
      z.object({
        path: z.string().trim().min(1),
        change: z.string().trim().min(1),
      }),
    )
    .min(1),
  assumptions: z.array(z.string().trim().min(1)),
});

export const codeInputSchema = testPlanInputSchema.extend({
  testPlan: testPlanArtifactSchema,
});

export const testArtifactSchema = z.object({
  status: z.enum(['passed', 'failed']),
  cases: z
    .array(
      z.object({
        testCaseId: z.string().trim().min(1),
        status: z.enum(['passed', 'failed']),
        evidence: z.string().trim().min(1),
      }),
    )
    .min(1),
});

export const testInputSchema = codeInputSchema.extend({
  code: codeArtifactSchema,
});

export const validationArtifactSchema = z.object({
  verdict: z.enum(['pass', 'revise', 'blocked']),
  rationale: z.string().trim().min(1),
  feedback: z.array(z.string().trim().min(1)),
});

export const validationInputSchema = testInputSchema.extend({
  test: testArtifactSchema,
});

export const developmentIterationSchema = z.object({
  number: z.number().int().positive(),
  testPlan: testPlanArtifactSchema,
  code: codeArtifactSchema,
  test: testArtifactSchema,
  validation: validationArtifactSchema,
});

export const developmentRunSchema = z.object({
  id: z.string().trim().min(1),
  status: runStatusSchema,
  featureBrief: featureBriefSchema,
  maxIterations: z.number().int().positive(),
  iterations: z.array(developmentIterationSchema),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  error: z.string().optional(),
});

export type DevelopmentExecutionStage = z.infer<
  typeof developmentExecutionStageSchema
>;
export type RunStatus = z.infer<typeof runStatusSchema>;
export type ValidationVerdict = z.infer<
  typeof validationArtifactSchema
>['verdict'];
export type FeatureBrief = z.infer<typeof featureBriefSchema>;
export type TestPlanInput = z.infer<typeof testPlanInputSchema>;
export type TestPlanArtifact = z.infer<typeof testPlanArtifactSchema>;
export type CodeInput = z.infer<typeof codeInputSchema>;
export type CodeArtifact = z.infer<typeof codeArtifactSchema>;
export type TestInput = z.infer<typeof testInputSchema>;
export type TestArtifact = z.infer<typeof testArtifactSchema>;
export type ValidationInput = z.infer<typeof validationInputSchema>;
export type ValidationArtifact = z.infer<typeof validationArtifactSchema>;
export type DevelopmentIteration = z.infer<typeof developmentIterationSchema>;
export type DevelopmentRun = z.infer<typeof developmentRunSchema>;
