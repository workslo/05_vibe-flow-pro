'use server';

import { experimental_generateImage as generateImage } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';

import { getOpenAIProvider } from '@/app/api/openai';
import {
  ImageSize,
  IMAGE_SIZES,
  OPENAI_IMAGE_MODELS,
} from '@/app/workflow/openai-data';

export type GenerateImageApiResponse =
  | { image: string } // Image as Base64 string
  | { error: string; issues?: unknown[] };

const bodySchema = z
  .object({
    model: z.enum(OPENAI_IMAGE_MODELS),
    prompt: z.string(),
    size: z.string(),
  })
  .refine(
    (data) => {
      if (
        data.size &&
        !IMAGE_SIZES[data.model].includes(data.size as ImageSize)
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Invalid image size for the selected model',
      path: ['size'],
    },
  );

export async function POST(
  req: NextRequest,
): Promise<NextResponse<GenerateImageApiResponse>> {
  try {
    const body = await req.json();
    const { model, prompt, size } = bodySchema.parse(body);

    if (!size) {
      return NextResponse.json(
        { error: 'Image size is required' },
        { status: 400 },
      );
    }

    const openai = getOpenAIProvider();

    const { image } = await generateImage({
      model: openai.image(model),
      prompt,
      size: size as ImageSize,
    });

    return NextResponse.json({
      image: image.base64,
    });
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
