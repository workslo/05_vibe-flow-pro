import { AppEdge, createEdge } from './components/edges';
import { AppNode, createNodeByType } from './components/nodes';
import { lineageStages } from './lineage-data';

export const initialNodes: AppNode[] = lineageStages.map((stage, index) =>
  createNodeByType({
    type: 'lineage-stage-node',
    id: stage.id,
    position: {
      x: 180 + index * 390,
      y:
        stage.kind === 'control'
          ? 420
          : stage.kind === 'tax'
            ? 170
            : 260,
    },
    data: {
      ...stage,
      title: stage.title,
      status: 'initial',
      icon: 'GitBranch',
    },
  }),
);

export const initialEdges: AppEdge[] = [
  createEdge(
    'client-intent',
    'order-capture',
    'lineage-output',
    'lineage-input',
  ),
  createEdge('order-capture', 'execution', 'lineage-output', 'lineage-input'),
  createEdge('execution', 'books-records', 'lineage-output', 'lineage-input'),
  createEdge('books-records', 'tax-lot', 'lineage-output', 'lineage-input'),
  createEdge('tax-lot', 'tax-review', 'lineage-output', 'lineage-input'),
  createEdge(
    'tax-review',
    'form-production',
    'lineage-output',
    'lineage-input',
  ),
  createEdge(
    'form-production',
    'client-filing',
    'lineage-output',
    'lineage-input',
  ),
];
