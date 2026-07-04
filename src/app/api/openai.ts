import { createOpenAI } from '@ai-sdk/openai';

export function getOpenAIProvider() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not configured. Add it to .env.local and restart the dev server.',
    );
  }

  return createOpenAI({ apiKey });
}
