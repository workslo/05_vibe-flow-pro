import { createOpenAI } from '@ai-sdk/openai';

import { ProviderNotConfiguredError } from '@/app/api/http';

export function getOpenAIProvider() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new ProviderNotConfiguredError();
  }

  return createOpenAI({ apiKey });
}
