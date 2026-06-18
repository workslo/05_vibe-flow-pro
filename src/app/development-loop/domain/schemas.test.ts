import { describe, expect, it } from 'vitest';
import {
  featureBriefSchema,
  validationArtifactSchema,
} from './schemas';

describe('development loop schemas', () => {
  it('accepts a feature brief with acceptance criteria', () => {
    expect(
      featureBriefSchema.parse({
        summary: 'Add retry controls',
        acceptanceCriteria: ['A user can set the retry limit'],
      }),
    ).toEqual({
      summary: 'Add retry controls',
      acceptanceCriteria: ['A user can set the retry limit'],
    });
  });

  it('rejects unsupported validation verdicts', () => {
    expect(() =>
      validationArtifactSchema.parse({
        verdict: 'maybe',
        rationale: 'Unclear',
        feedback: [],
      }),
    ).toThrow();
  });
});
