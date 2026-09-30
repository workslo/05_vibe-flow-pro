import { NextResponse } from 'next/server';
import { z } from 'zod/v4';

export type ApiErrorCode =
  | 'invalid_request'
  | 'payload_too_large'
  | 'ai_routes_disabled'
  | 'provider_unconfigured'
  | 'internal_error';

export type ApiErrorBody = {
  error: string;
  code: ApiErrorCode;
  correlationId?: string;
  issues?: unknown[];
};

export class ProviderNotConfiguredError extends Error {
  constructor() {
    super('Model provider is not configured.');
    this.name = 'ProviderNotConfiguredError';
  }
}

export function apiError(
  status: number,
  body: ApiErrorBody,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(body, { status });
}

// Only allow-listed fields reach the log: never the message, stack, or
// request content, which can carry provider details or user prompts.
function logFailure(route: string, correlationId: string, error: unknown) {
  const name = error instanceof Error ? error.name : typeof error;
  const status =
    typeof error === 'object' && error !== null && 'statusCode' in error
      ? (error as { statusCode?: unknown }).statusCode
      : undefined;

  console.error(
    JSON.stringify({ event: 'api_error', route, correlationId, name, status }),
  );
}

export function handleRouteError(
  route: string,
  error: unknown,
): NextResponse<ApiErrorBody> {
  if (error instanceof z.ZodError) {
    return apiError(400, {
      error: 'Invalid request',
      code: 'invalid_request',
      issues: error.issues,
    });
  }

  if (error instanceof ProviderNotConfiguredError) {
    return apiError(503, {
      error: error.message,
      code: 'provider_unconfigured',
    });
  }

  const correlationId = crypto.randomUUID();
  logFailure(route, correlationId, error);

  return apiError(500, {
    error: 'Internal server error',
    code: 'internal_error',
    correlationId,
  });
}
