import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';

import { createScriptedDevelopmentAdapter } from '@/app/development-loop/domain/scripted-adapter';
import type { DevelopmentExecutionAdapter } from '@/app/development-loop/domain/engine';
import {
  codeInputSchema,
  testInputSchema,
  testPlanInputSchema,
  validationInputSchema,
} from '@/app/development-loop/domain/schemas';
import { createOpenAIDevelopmentAdapter } from '@/app/development-loop/server/openai-adapter';

const stageRequestSchema = z.discriminatedUnion('stage', [
  z.object({ stage: z.literal('test-plan'), input: testPlanInputSchema }),
  z.object({ stage: z.literal('code'), input: codeInputSchema }),
  z.object({ stage: z.literal('test'), input: testInputSchema }),
  z.object({ stage: z.literal('validate'), input: validationInputSchema }),
]);

type StageRequest = z.infer<typeof stageRequestSchema>;
type StageResponse =
  | { artifact: unknown }
  | { error: string; issues?: unknown[] };

function getDevelopmentAdapter(): DevelopmentExecutionAdapter {
  if (process.env.DEVELOPMENT_LOOP_ADAPTER === 'scripted') {
    return createScriptedDevelopmentAdapter();
  }

  return createOpenAIDevelopmentAdapter();
}

async function executeStage(
  adapter: DevelopmentExecutionAdapter,
  request: StageRequest,
): Promise<unknown> {
  switch (request.stage) {
    case 'test-plan':
      return adapter.createTestPlan(request.input);
    case 'code':
      return adapter.createCodeProposal(request.input);
    case 'test':
      return adapter.executeTests(request.input);
    case 'validate':
      return adapter.validateResult(request.input);
  }
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<StageResponse>> {
  try {
    const body = await req.json();
    const request = stageRequestSchema.parse(body);
    const artifact = await executeStage(getDevelopmentAdapter(), request);

    return NextResponse.json({ artifact });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}
