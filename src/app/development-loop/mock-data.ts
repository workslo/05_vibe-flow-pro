import {
  MarkerType,
  type Edge,
  type Node,
  type XYPosition,
} from '@xyflow/react';

import type { DevelopmentNodeData } from './components/development-node';
import {
  canonicalDevelopmentGraph,
  type DevelopmentGraphEdge,
  type DevelopmentGraphNode,
  type DevelopmentStageId,
} from './domain/template';

export const developmentStagePositions = {
  'feature-brief': { x: 0, y: 160 },
  'test-plan': { x: 280, y: 160 },
  code: { x: 560, y: 160 },
  test: { x: 840, y: 160 },
  validate: { x: 1120, y: 160 },
} satisfies Record<DevelopmentStageId, XYPosition>;

export type DevelopmentCanvasNode = Node<
  DevelopmentNodeData,
  'development-stage'
>;

export type DevelopmentCanvasEdge = Edge<
  Record<string, never>,
  'smoothstep'
>;

export function createDevelopmentCanvasNodes(
  graphNodes: DevelopmentGraphNode[] = canonicalDevelopmentGraph.nodes,
): DevelopmentCanvasNode[] {
  return graphNodes.map((node) => ({
    id: node.id,
    type: 'development-stage',
    position: developmentStagePositions[node.id],
    data: {
      stageId: node.id,
      label: node.label,
      status: 'waiting',
      artifactSummary: 'No evidence yet.',
    },
    draggable: true,
    deletable: false,
  }));
}

export function createDevelopmentCanvasEdges(
  graphEdges: DevelopmentGraphEdge[] = canonicalDevelopmentGraph.edges,
): DevelopmentCanvasEdge[] {
  return graphEdges.map((edge) => {
    const isRevision = edge.kind === 'revision';

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: isRevision ? 'revision' : 'forward',
      targetHandle: isRevision ? 'revision' : 'incoming',
      type: 'smoothstep',
      animated: isRevision,
      label: isRevision ? 'Revise' : undefined,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isRevision ? '#d97706' : '#94a3b8',
        width: 18,
        height: 18,
      },
      style: {
        stroke: isRevision ? '#d97706' : '#94a3b8',
        strokeDasharray: isRevision ? '8 6' : undefined,
        strokeWidth: isRevision ? 2.25 : 1.5,
      },
      labelStyle: isRevision
        ? {
            fill: '#92400e',
            fontSize: 11,
            fontWeight: 700,
          }
        : undefined,
      labelBgStyle: isRevision
        ? {
            fill: '#fffbeb',
            fillOpacity: 0.96,
          }
        : undefined,
      labelBgPadding: isRevision ? [7, 4] : undefined,
      labelBgBorderRadius: isRevision ? 2 : undefined,
      deletable: false,
      reconnectable: false,
    };
  });
}

export const initialDevelopmentNodes = createDevelopmentCanvasNodes();
export const initialDevelopmentEdges = createDevelopmentCanvasEdges();
