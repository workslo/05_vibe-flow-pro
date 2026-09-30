import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod/v4';

import { handleRouteError, ProviderNotConfiguredError } from './http';

const secretLooking = 'sk-live-1234 org=acme request_id=req_abc prompt=private';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('handleRouteError', () => {
  it('returns a generic 500 envelope without the thrown message', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = handleRouteError('test', new Error(secretLooking));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      error: 'Internal server error',
      code: 'internal_error',
    });
    expect(body.correlationId).toEqual(expect.any(String));
    expect(JSON.stringify(body)).not.toContain('sk-live');
    expect(log.mock.calls.flat().join(' ')).not.toContain('sk-live');
    expect(log.mock.calls.flat().join(' ')).toContain(body.correlationId);
  });

  it('does not echo non-Error thrown values', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = handleRouteError('test', secretLooking);

    expect(JSON.stringify(await response.json())).not.toContain('sk-live');
  });

  it('maps a missing provider key to a reviewed 503', async () => {
    const response = handleRouteError('test', new ProviderNotConfiguredError());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'Model provider is not configured.',
      code: 'provider_unconfigured',
    });
  });

  it('keeps validation issues on a 400', async () => {
    const result = z.object({ prompt: z.string() }).safeParse({});
    const response = handleRouteError('test', result.error);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'invalid_request' });
  });
});
