'use server';

import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';

import { type ApiErrorBody, handleRouteError } from '@/app/api/http';
import {
  assertModelRoutesEnabled,
  MAX_OUTPUT_TOKENS,
  readBoundedJson,
  REQUEST_BYTE_LIMITS,
} from '@/app/api/guard';
import { getOpenAIProvider } from '@/app/api/openai';
import { OPENAI_TEXT_MODELS } from '@/app/workflow/openai-data';

export type GenerateTextApiResponse = { text: string } | ApiErrorBody;

const bodySchema = z.object({
  // The valid models are defined in OPENAI_TEXT_MODELS
  model: z.enum(OPENAI_TEXT_MODELS),
  temperature: z.number().min(0).max(2),
  prompt: z.string().max(8000),
  system: z.string().max(4000),
});

export async function POST(
  req: NextRequest,
): Promise<NextResponse<GenerateTextApiResponse>> {
  try {
    assertModelRoutesEnabled();
    const body = await readBoundedJson(req, REQUEST_BYTE_LIMITS.generateText);
    const { model, temperature, prompt, system } = bodySchema.parse(body);
    const openai = getOpenAIProvider();

    const { text } = await generateText({
      model: openai(model),
      prompt: prompt,
      system: system,
      temperature: temperature,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });

    return NextResponse.json({
      text,
    });
  } catch (error) {
    return handleRouteError('generate-text', error);
  }
}
