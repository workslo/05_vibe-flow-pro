import {
  AiRoutesDisabledError,
  InvalidJsonBodyError,
  PayloadTooLargeError,
} from '@/app/api/http';

export const REQUEST_BYTE_LIMITS = {
  generateText: 32 * 1024,
  generateImage: 8 * 1024,
  developmentLoopStage: 64 * 1024,
} as const;

export const MAX_OUTPUT_TOKENS = 2048;

// Fail closed: a production build spends the shared OPENAI_API_KEY only when
// the deployment opts in, after an upstream access boundary is in place.
export function assertModelRoutesEnabled(): void {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.AI_ROUTES_ENABLED !== 'true'
  ) {
    throw new AiRoutesDisabledError();
  }
}

export async function readBoundedJson(
  req: Request,
  maxBytes: number,
): Promise<unknown> {
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new PayloadTooLargeError(maxBytes);
  }

  const text = await req.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new PayloadTooLargeError(maxBytes);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new InvalidJsonBodyError();
  }
}
