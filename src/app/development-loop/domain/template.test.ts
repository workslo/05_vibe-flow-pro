import { describe, expect, it } from 'vitest';
import {
  canonicalDevelopmentGraph,
  validateDevelopmentGraph,
} from './template';

describe('canonical development graph', () => {
  it('accepts the required forward path and revision edge', () => {
    expect(
      validateDevelopmentGraph(
        canonicalDevelopmentGraph.nodes,
        canonicalDevelopmentGraph.edges,
      ),
    ).toEqual({ valid: true });
  });

  it('rejects a graph without the validation revision edge', () => {
    expect(
      validateDevelopmentGraph(
        canonicalDevelopmentGraph.nodes,
        canonicalDevelopmentGraph.edges.filter(
          (edge) => edge.id !== 'validate-to-code',
        ),
      ),
    ).toEqual({
      valid: false,
      error: 'Missing required connection: validate -> code',
    });
  });
});
