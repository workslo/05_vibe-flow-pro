export const DEVELOPMENT_STAGE_IDS = [
  'feature-brief',
  'test-plan',
  'code',
  'test',
  'validate',
] as const;

export type DevelopmentStageId = (typeof DEVELOPMENT_STAGE_IDS)[number];

export type DevelopmentGraphNode = {
  id: DevelopmentStageId;
  label: string;
};

export type DevelopmentGraphEdge = {
  id: string;
  source: DevelopmentStageId;
  target: DevelopmentStageId;
  kind: 'forward' | 'revision';
};

const requiredConnections = [
  ['feature-brief', 'test-plan'],
  ['test-plan', 'code'],
  ['code', 'test'],
  ['test', 'validate'],
  ['validate', 'code'],
] as const;

export const canonicalDevelopmentGraph = {
  nodes: [
    { id: 'feature-brief', label: 'Feature brief' },
    { id: 'test-plan', label: 'Test plan' },
    { id: 'code', label: 'Code feature' },
    { id: 'test', label: 'Test feature' },
    { id: 'validate', label: 'Validate result' },
  ] satisfies DevelopmentGraphNode[],
  edges: [
    {
      id: 'brief-to-plan',
      source: 'feature-brief',
      target: 'test-plan',
      kind: 'forward',
    },
    {
      id: 'plan-to-code',
      source: 'test-plan',
      target: 'code',
      kind: 'forward',
    },
    {
      id: 'code-to-test',
      source: 'code',
      target: 'test',
      kind: 'forward',
    },
    {
      id: 'test-to-validate',
      source: 'test',
      target: 'validate',
      kind: 'forward',
    },
    {
      id: 'validate-to-code',
      source: 'validate',
      target: 'code',
      kind: 'revision',
    },
  ] satisfies DevelopmentGraphEdge[],
};

export function validateDevelopmentGraph(
  nodes: DevelopmentGraphNode[],
  edges: DevelopmentGraphEdge[],
): { valid: true } | { valid: false; error: string } {
  for (const stageId of DEVELOPMENT_STAGE_IDS) {
    const count = nodes.filter((node) => node.id === stageId).length;
    if (count !== 1) {
      return {
        valid: false,
        error: `Expected exactly one stage: ${stageId}`,
      };
    }
  }

  for (const [source, target] of requiredConnections) {
    if (!edges.some((edge) => edge.source === source && edge.target === target)) {
      return {
        valid: false,
        error: `Missing required connection: ${source} -> ${target}`,
      };
    }
  }

  return { valid: true };
}
