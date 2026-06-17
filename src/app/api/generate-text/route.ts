'use server';

import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';

import { getOpenAIProvider } from '@/app/api/openai';
import { OPENAI_TEXT_MODELS } from '@/app/workflow/openai-data';

export type GenerateTextApiResponse =
  | { text: string }
  | { error: string; issues?: unknown[] };

const bodySchema = z.object({
  // The valid models are defined in OPENAI_TEXT_MODELS
  model: z.enum(OPENAI_TEXT_MODELS),
  temperature: z.number(),
  prompt: z.string(),
  system: z.string(),
});

export async function POST(
  req: NextRequest,
): Promise<NextResponse<GenerateTextApiResponse>> {
  try {
    const body = await req.json();
    const { model, temperature, prompt, system } = bodySchema.parse(body);
    const openai = getOpenAIProvider();

    const { text } = await generateText({
      model: openai(model),
      prompt: prompt,
      system: system,
      temperature: temperature,
    });

    return NextResponse.json({
      text,
    });
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
