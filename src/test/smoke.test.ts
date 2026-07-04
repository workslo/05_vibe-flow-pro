import { describe, expect, it } from 'vitest';

describe('test harness', () => {
  it('runs TypeScript tests with the project alias', async () => {
    const { cn } = await import('@/lib/utils');
    expect(cn('one', false && 'two')).toBe('one');
  });
});
