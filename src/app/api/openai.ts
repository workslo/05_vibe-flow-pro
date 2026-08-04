import { createOpenAI } from '@ai-sdk/openai';

export function getOpenAIProvider() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not configured in the server environment.',
    );
  }

  return createOpenAI({ apiKey });
}
