import type { Edge } from '@xyflow/react';

import type { LineageStageNodeType } from './components/lineage-stage-node';
import { lineageStages } from './domain/lineage-data';

export const initialNodes: LineageStageNodeType[] = lineageStages.map(
  (stage, index) => ({
    id: stage.id,
    type: 'lineage-stage-node',
    position: {
      x: 180 + index * 390,
      y: stage.kind === 'control' ? 420 : stage.kind === 'tax' ? 170 : 260,
    },
    data: {
      title: stage.title,
      kind: stage.kind,
      owner: stage.owner,
      system: stage.system,
      summary: stage.summary,
      dataFields: stage.dataFields,
      controls: stage.controls,
      outputs: stage.outputs,
      risks: stage.risks,
    },
  }),
);

export const initialEdges: Edge[] = lineageStages.slice(1).map(
  (stage, index) => {
    const source = lineageStages[index].id;

    return {
      id: `${source}->${stage.id}`,
      source,
      target: stage.id,
      sourceHandle: 'lineage-output',
      targetHandle: 'lineage-input',
    };
  },
);
