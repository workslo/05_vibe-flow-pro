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
  { source: 'feature-brief', target: 'test-plan', kind: 'forward' },
  { source: 'test-plan', target: 'code', kind: 'forward' },
  { source: 'code', target: 'test', kind: 'forward' },
  { source: 'test', target: 'validate', kind: 'forward' },
  { source: 'validate', target: 'code', kind: 'revision' },
] as const;

function edgeSignature(edge: Pick<DevelopmentGraphEdge, 'source' | 'target' | 'kind'>) {
  return `${edge.source}::${edge.target}::${edge.kind}`;
}

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

  const requiredConnectionSignatures = new Set(
    requiredConnections.map((edge) => edgeSignature(edge)),
  );
  const actualConnectionCounts = new Map<string, number>();

  for (const edge of edges) {
    const signature = edgeSignature(edge);
    actualConnectionCounts.set(
      signature,
      (actualConnectionCounts.get(signature) ?? 0) + 1,
    );

    if (!requiredConnectionSignatures.has(signature)) {
      return {
        valid: false,
        error: `Unexpected connection: ${edge.source} -> ${edge.target}`,
      };
    }
  }

  for (const requiredConnection of requiredConnections) {
    const signature = edgeSignature(requiredConnection);
    if ((actualConnectionCounts.get(signature) ?? 0) !== 1) {
      return {
        valid: false,
        error: `Missing required connection: ${requiredConnection.source} -> ${requiredConnection.target}`,
      };
    }
  }

  return { valid: true };
}
