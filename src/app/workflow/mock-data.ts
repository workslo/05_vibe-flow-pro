import { AppEdge, createEdge } from './components/edges';
import { AppNode, createNodeByType } from './components/nodes';

export const initialNodes: AppNode[] = [
  createNodeByType({
    type: 'text-input-node',
    id: 'characterPromptNode',
    data: {
      text: 'Describe a polished product-console hero for a workflow automation tool in one concise visual direction.',
    },
  }),
  createNodeByType({
    type: 'text-input-node',
    id: 'systemNode',
    data: {
      text: 'You are Vibe Flow Pro, a precise workflow design assistant for production-minded builders.',
    },
  }),
  createNodeByType({ type: 'generate-text-node', id: 'generateTextNode' }),
  createNodeByType({ type: 'generate-image-node', id: 'generateImageNode' }),
];

export const initialEdges: AppEdge[] = [
  createEdge('systemNode', 'generateTextNode', 'text-output', 'text-system'),
  createEdge(
    'characterPromptNode',
    'generateTextNode',
    'text-output',
    'text-prompt',
  ),
  createEdge(
    'generateTextNode',
    'generateImageNode',
    'text-output',
    'text-prompt',
  ),
];
