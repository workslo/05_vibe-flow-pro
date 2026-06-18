'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  type NodeChange,
  type XYPosition,
} from '@xyflow/react';

import {
  createDevelopmentCanvasEdges,
  createDevelopmentCanvasNodes,
  developmentStagePositions,
  type DevelopmentCanvasNode,
} from '../mock-data';
import type {
  DevelopmentExecutionStage,
  DevelopmentIteration,
} from '../domain/schemas';
import {
  codeArtifactSchema,
  testArtifactSchema,
  testPlanArtifactSchema,
  validationArtifactSchema,
} from '../domain/schemas';
import {
  canonicalDevelopmentGraph,
  type DevelopmentGraphEdge,
  type DevelopmentGraphNode,
  type DevelopmentStageId,
} from '../domain/template';
import { useDevelopmentRunStore } from '../store';
import {
  DevelopmentNode,
  type DevelopmentNodeData,
  type DevelopmentNodeStatus,
} from './development-node';

export type DevelopmentGraph = {
  nodes: DevelopmentGraphNode[];
  edges: DevelopmentGraphEdge[];
};

export interface DevelopmentLoopCanvasProps {
  graph?: DevelopmentGraph;
  failedStage?: DevelopmentExecutionStage;
}

const nodeTypes = {
  'development-stage': DevelopmentNode,
};

function getArtifactSummary(
  stageId: DevelopmentStageId,
  featureSummary: string,
  stageArtifact: unknown,
  iteration?: DevelopmentIteration,
) {
  if (stageId === 'feature-brief') {
    return featureSummary || 'Describe the bounded change and acceptance checks.';
  }

  switch (stageId) {
    case 'test-plan': {
      const result = testPlanArtifactSchema.safeParse(stageArtifact);
      if (result.success) {
        return result.data.strategy;
      }
      break;
    }
    case 'code': {
      const result = codeArtifactSchema.safeParse(stageArtifact);
      if (result.success) {
        return result.data.summary;
      }
      break;
    }
    case 'test': {
      const result = testArtifactSchema.safeParse(stageArtifact);
      if (result.success) {
        return `${result.data.status === 'passed' ? 'Passed' : 'Failed'} · ${result.data.cases.length} test ${result.data.cases.length === 1 ? 'case' : 'cases'}`;
      }
      break;
    }
    case 'validate': {
      const result = validationArtifactSchema.safeParse(stageArtifact);
      if (result.success) {
        return result.data.rationale;
      }
      break;
    }
  }

  if (!iteration) {
    return 'No evidence yet.';
  }

  switch (stageId) {
    case 'test-plan':
      return iteration.testPlan.strategy;
    case 'code':
      return iteration.code.summary;
    case 'test':
      return `${iteration.test.status === 'passed' ? 'Passed' : 'Failed'} · ${iteration.test.cases.length} test ${iteration.test.cases.length === 1 ? 'case' : 'cases'}`;
    case 'validate':
      return iteration.validation.rationale;
    default:
      return 'No evidence yet.';
  }
}

function getNodeStatus(options: {
  stageId: DevelopmentStageId;
  hasBrief: boolean;
  runStatus?: string;
  currentStage?: DevelopmentExecutionStage;
  failedStage?: DevelopmentExecutionStage;
  hasArtifact: boolean;
  latestValidationVerdict?: string;
}): DevelopmentNodeStatus {
  const {
    stageId,
    hasBrief,
    runStatus,
    currentStage,
    failedStage,
    hasArtifact,
    latestValidationVerdict,
  } = options;

  if (stageId === 'feature-brief') {
    return hasBrief ? 'complete' : 'waiting';
  }

  if (failedStage === stageId) {
    return 'blocked';
  }

  if (
    runStatus === 'blocked' &&
    stageId === 'validate' &&
    latestValidationVerdict === 'blocked'
  ) {
    return 'blocked';
  }

  if (runStatus === 'running' && currentStage === stageId) {
    return 'running';
  }

  if (
    runStatus === 'running' &&
    stageId === 'validate' &&
    latestValidationVerdict === 'revise'
  ) {
    return 'revision';
  }

  return hasArtifact ? 'complete' : 'waiting';
}

export function DevelopmentLoopCanvas({
  graph = canonicalDevelopmentGraph,
  failedStage,
}: DevelopmentLoopCanvasProps) {
  const featureBrief = useDevelopmentRunStore((state) => state.featureBrief);
  const activeRun = useDevelopmentRunStore((state) => state.activeRun);
  const currentStage = useDevelopmentRunStore((state) => state.currentStage);
  const stageArtifacts = useDevelopmentRunStore(
    (state) => state.stageArtifacts,
  );
  const [positions, setPositions] = useState<
    Record<DevelopmentStageId, XYPosition>
  >(developmentStagePositions);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mediaQuery) {
      return;
    }

    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener?.('change', updatePreference);

    return () => mediaQuery.removeEventListener?.('change', updatePreference);
  }, []);

  const latestIteration = activeRun?.iterations.at(-1);
  const baseNodes = useMemo(
    () => createDevelopmentCanvasNodes(graph.nodes),
    [graph.nodes],
  );
  const nodes = useMemo(
    () =>
      baseNodes.map((node) => {
        const stageId = node.data.stageId;
        const artifactSummary = getArtifactSummary(
          stageId,
          featureBrief.summary,
          stageId === 'feature-brief' ? undefined : stageArtifacts[stageId],
          latestIteration,
        );
        const status = getNodeStatus({
          stageId,
          hasBrief: Boolean(featureBrief.summary),
          runStatus: activeRun?.status,
          currentStage,
          failedStage,
          hasArtifact:
            stageId === 'feature-brief' ||
            stageArtifacts[stageId] !== undefined ||
            (latestIteration
              ? Boolean(
                  stageId === 'test-plan'
                    ? latestIteration.testPlan
                    : stageId === 'code'
                      ? latestIteration.code
                      : stageId === 'test'
                        ? latestIteration.test
                        : latestIteration.validation,
                )
              : false),
          latestValidationVerdict: latestIteration?.validation.verdict,
        });

        return {
          ...node,
          position: positions[stageId],
          data: {
            ...node.data,
            status,
            artifactSummary,
          } satisfies DevelopmentNodeData,
        };
      }),
    [
      activeRun?.status,
      baseNodes,
      currentStage,
      failedStage,
      featureBrief.summary,
      latestIteration,
      positions,
      stageArtifacts,
    ],
  );
  const edges = useMemo(
    () =>
      createDevelopmentCanvasEdges(graph.edges).map((edge) =>
        edge.id === 'validate-to-code'
          ? { ...edge, animated: !prefersReducedMotion }
          : edge,
      ),
    [graph.edges, prefersReducedMotion],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<DevelopmentCanvasNode>[]) => {
      const positionChanges = changes.filter(
        (
          change,
        ): change is Extract<
          NodeChange<DevelopmentCanvasNode>,
          { type: 'position' }
        > => change.type === 'position' && Boolean(change.position),
      );

      if (!positionChanges.length) {
        return;
      }

      setPositions((current) => {
        const next = { ...current };
        for (const change of positionChanges) {
          if (change.position) {
            next[change.id as DevelopmentStageId] = change.position;
          }
        }
        return next;
      });
    },
    [],
  );

  return (
    <ReactFlowProvider initialNodes={nodes} initialEdges={edges}>
      <section
        aria-label="Development loop stage canvas"
        className="relative min-h-[460px] overflow-hidden bg-[hsl(var(--background))]"
        data-testid="development-loop-canvas"
      >
        <ReactFlow
          aria-label="Canonical plan, code, test, and validation workflow"
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          nodesDraggable
          nodesConnectable={false}
          edgesReconnectable={false}
          elementsSelectable
          deleteKeyCode={null}
          defaultViewport={{ x: 32, y: 290, zoom: 0.55 }}
          minZoom={0.45}
          maxZoom={1.4}
          panOnScroll
          zoomOnScroll={false}
          colorMode="light"
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="#cbd5e1"
          />
        </ReactFlow>
      </section>
    </ReactFlowProvider>
  );
}
