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

  it('rejects a validate to code edge with the wrong kind', () => {
    expect(
      validateDevelopmentGraph(
        canonicalDevelopmentGraph.nodes,
        canonicalDevelopmentGraph.edges.map((edge) =>
          edge.id === 'validate-to-code'
            ? { ...edge, kind: 'forward' }
            : edge,
        ),
      ),
    ).toEqual({
      valid: false,
      error: 'Unexpected connection: validate -> code',
    });
  });

  it('rejects an extra feature brief to code edge', () => {
    expect(
      validateDevelopmentGraph(canonicalDevelopmentGraph.nodes, [
        ...canonicalDevelopmentGraph.edges,
        {
          id: 'brief-to-code',
          source: 'feature-brief',
          target: 'code',
          kind: 'forward',
        },
      ]),
    ).toEqual({
      valid: false,
      error: 'Unexpected connection: feature-brief -> code',
    });
  });
});
