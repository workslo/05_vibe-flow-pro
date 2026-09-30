import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const generateText = vi.fn();
vi.mock('ai', () => ({ generateText: (...args: unknown[]) => generateText(...args) }));

import { POST as generateTextPOST } from './generate-text/route';
import { POST as generateImagePOST } from './generate-image/route';
import { POST as stagePOST } from './development-loop/stage/route';
import { REQUEST_BYTE_LIMITS } from './guard';

function post(path: string, body: string) {
  return new NextRequest(`http://localhost${path}`, { method: 'POST', body });
}

const validText = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  prompt: 'Write a haiku',
  system: 'You are terse.',
};

afterEach(() => {
  vi.unstubAllEnvs();
  generateText.mockReset();
});

describe('model route guard', () => {
  it('refuses anonymous production traffic unless AI routes are enabled', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AI_ROUTES_ENABLED', '');
    vi.stubEnv('OPENAI_API_KEY', 'test-key');

    const text = await generateTextPOST(
      post('/api/generate-text', JSON.stringify(validText)),
    );
    const image = await generateImagePOST(
      post('/api/generate-image', JSON.stringify({ model: 'x', prompt: 'y', size: 'z' })),
    );

    expect(text.status).toBe(503);
    expect(await text.json()).toMatchObject({ code: 'ai_routes_disabled' });
    expect(image.status).toBe(503);
    expect(generateText).not.toHaveBeenCalled();
  });

  it('refuses the OpenAI-backed stage adapter in production but not the scripted one', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AI_ROUTES_ENABLED', '');
    vi.stubEnv('DEVELOPMENT_LOOP_ADAPTER', '');

    const blocked = await stagePOST(post('/api/development-loop/stage', '{}'));
    expect(blocked.status).toBe(503);

    vi.stubEnv('DEVELOPMENT_LOOP_ADAPTER', 'scripted');
    const scripted = await stagePOST(post('/api/development-loop/stage', '{}'));
    expect(scripted.status).toBe(400);
  });

  it('rejects an oversized body with 413 before calling the model', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    const huge = JSON.stringify({
      ...validText,
      prompt: 'a'.repeat(REQUEST_BYTE_LIMITS.generateText),
    });

    const response = await generateTextPOST(post('/api/generate-text', huge));

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ code: 'payload_too_large' });
    expect(generateText).not.toHaveBeenCalled();
  });

  it('rejects out-of-range temperature and overlong prompts', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');

    const hot = await generateTextPOST(
      post('/api/generate-text', JSON.stringify({ ...validText, temperature: 9 })),
    );
    const long = await generateTextPOST(
      post('/api/generate-text', JSON.stringify({ ...validText, system: 's'.repeat(4001) })),
    );

    expect(hot.status).toBe(400);
    expect(long.status).toBe(400);
    expect(generateText).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON with 400', async () => {
    const response = await generateTextPOST(post('/api/generate-text', '{nope'));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'invalid_request' });
  });

  it('serves a valid request with a capped output budget', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    generateText.mockResolvedValue({ text: 'ok' });

    const response = await generateTextPOST(
      post('/api/generate-text', JSON.stringify(validText)),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ text: 'ok' });
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({ maxOutputTokens: 2048 }),
    );
  });

  it('serves production traffic once AI routes are explicitly enabled', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AI_ROUTES_ENABLED', 'true');
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    generateText.mockResolvedValue({ text: 'ok' });

    const response = await generateTextPOST(
      post('/api/generate-text', JSON.stringify(validText)),
    );

    expect(response.status).toBe(200);
  });
});
