'use server';

import { generateImage } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';

import { apiError, type ApiErrorBody, handleRouteError } from '@/app/api/http';
import {
  assertModelRoutesEnabled,
  readBoundedJson,
  REQUEST_BYTE_LIMITS,
} from '@/app/api/guard';
import { getOpenAIProvider } from '@/app/api/openai';
import {
  ImageSize,
  IMAGE_SIZES,
  OPENAI_IMAGE_MODELS,
} from '@/app/workflow/openai-data';

export type GenerateImageApiResponse =
  | { image: string } // Image as Base64 string
  | ApiErrorBody;

const bodySchema = z
  .object({
    model: z.enum(OPENAI_IMAGE_MODELS),
    prompt: z.string().max(4000),
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
    assertModelRoutesEnabled();
    const body = await readBoundedJson(req, REQUEST_BYTE_LIMITS.generateImage);
    const { model, prompt, size } = bodySchema.parse(body);

    if (!size) {
      return apiError(400, {
        error: 'Image size is required',
        code: 'invalid_request',
      });
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
    return handleRouteError('generate-image', error);
  }
}
