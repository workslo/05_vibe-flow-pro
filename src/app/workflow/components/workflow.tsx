'use client';

import { type ReactNode, useCallback, useEffect, useState } from 'react';
import {
  Background,
  Connection,
  Edge,
  NodeMouseHandler,
  Panel,
  ReactFlow,
  useNodesInitialized,
  useReactFlow,
} from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';

import FlowContextMenu from '@/app/workflow/components/flow-context-menu';
import { nodeTypes } from '@/app/workflow/components/nodes';
import { useDragAndDrop } from '@/app/workflow/hooks/useDragAndDrop';
import { useAppStore } from '@/app/workflow/store';
import { AppStore } from '@/app/workflow/store/app-store';
import {
  defaultBreakId,
  lineageBreaks,
  lineageStages,
} from '@/app/workflow/lineage-data';
import { layoutGraph } from '../utils/layout-helper';
import { WorkflowControls } from './controls';

const selector = (state: AppStore) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  setNodes: state.setNodes,
});

// We assume that the handle ids are in the format `${typeFlowingOnWire}-${handleId}`
// For example `image-output` or `text-prompt`.
// See also:
// - `components/nodes/index.tsx` for definition of the node configuration
// - `data/workflow-data.tsx` for a definition of an initial flow
// - Components `generate-text-node.tsx` and `generate-image-node.tsx`
const isValidConnection = (c: Edge | Connection) => {
  return (
    typeof c.sourceHandle === 'string' &&
    typeof c.targetHandle === 'string' &&
    c.sourceHandle.split('-')[0] === c.targetHandle.split('-')[0]
  );
};

export default function Workflow() {
  const store = useAppStore(useShallow(selector));
  const { onDragOver, onDrop } = useDragAndDrop();
  const { fitView } = useReactFlow();
  const [hasLayouted, setHasLayouted] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState(lineageStages[0].id);
  const [selectedBreakId, setSelectedBreakId] = useState(defaultBreakId);
  const nodesInitialized = useNodesInitialized();

  const selectedBreak = lineageBreaks.find(
    (lineageBreak) => lineageBreak.id === selectedBreakId,
  );
  const selectedStage =
    lineageStages.find((stage) => stage.id === selectedStageId) ??
    lineageStages[0];
  const highlightedStageIds = new Set(selectedBreak?.impactedStageIds ?? []);
  const decoratedNodes = store.nodes.map((node) => {
    if (node.type !== 'lineage-stage-node') {
      return node;
    }

    return {
      ...node,
      data: {
        ...node.data,
        highlightedByBreak: highlightedStageIds.has(node.id),
      },
    };
  });
  const decoratedEdges = store.edges.map((edge) => {
    const highlighted =
      highlightedStageIds.has(edge.source) && highlightedStageIds.has(edge.target);

    return {
      ...edge,
      animated: highlighted,
      className: highlighted ? 'stroke-amber-500' : undefined,
    };
  });

  const layoutNodes = useCallback(async () => {
    const layoutedNodes = await layoutGraph(store.nodes, store.edges);
    store.setNodes(layoutedNodes);
    setHasLayouted(true);
    fitView();
  }, [fitView, store]);

  useEffect(() => {
    if (nodesInitialized && !hasLayouted) {
      layoutNodes();
    }
  }, [nodesInitialized, hasLayouted, layoutNodes]);

  const onNodeClick = useCallback<NodeMouseHandler>((_, node) => {
    setSelectedStageId(node.id);
  }, []);

  return (
    <ReactFlow
      className="h-full"
      nodes={decoratedNodes}
      edges={decoratedEdges}
      onNodesChange={store.onNodesChange}
      onEdgesChange={store.onEdgesChange}
      onConnect={store.onConnect}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      onDragOver={onDragOver}
      onDrop={onDrop}
      isValidConnection={isValidConnection}
      colorMode="system"
    >
      <Background />
      <WorkflowControls />
      <FlowContextMenu />
      <Panel
        position="top-left"
        className="max-w-md rounded-lg border bg-card/95 p-4 text-card-foreground shadow-lg backdrop-blur"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Trade-to-1099 journey
        </p>
        <h2 className="mt-1 text-lg font-semibold">
          Equity sale to 1099-B lineage
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Follow direct data from a client deciding to sell 100 shares of XYZ,
          through order capture, execution, books and records, tax lots, control
          signoff, form production, and final client filing.
        </p>
      </Panel>
      <Panel
        position="top-right"
        className="w-[390px] rounded-lg border bg-card/95 p-4 text-card-foreground shadow-lg backdrop-blur"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Data passport
            </p>
            <h2 className="mt-1 text-lg font-semibold">{selectedStage.title}</h2>
          </div>
          <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
            {selectedStage.owner}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {selectedStage.summary}
        </p>

        <div className="mt-4 grid gap-3">
          <PanelSection title="System">
            <p>{selectedStage.system}</p>
          </PanelSection>
          <PanelSection title="Fields on this hop">
            <div className="flex flex-wrap gap-1.5">
              {selectedStage.dataFields.map((field) => (
                <span
                  key={field}
                  className="rounded-md bg-muted px-2 py-1 font-mono text-[11px]"
                >
                  {field}
                </span>
              ))}
            </div>
          </PanelSection>
          <PanelSection title="Controls">
            <CompactList values={selectedStage.controls} />
          </PanelSection>
          <PanelSection title="Outputs">
            <CompactList values={selectedStage.outputs} />
          </PanelSection>
          <PanelSection title="Risks">
            <CompactList values={selectedStage.risks} />
          </PanelSection>
        </div>
      </Panel>
      <Panel
        position="bottom-center"
        className="w-[760px] rounded-lg border bg-card/95 p-3 text-card-foreground shadow-lg backdrop-blur"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Break explorer
            </p>
            <div className="mt-2 grid gap-2">
              {lineageBreaks.map((lineageBreak) => (
                <button
                  key={lineageBreak.id}
                  type="button"
                  onClick={() => setSelectedBreakId(lineageBreak.id)}
                  className={`rounded-md border p-2 text-left text-sm transition hover:bg-accent ${
                    selectedBreakId === lineageBreak.id
                      ? 'border-amber-500 bg-amber-500/10'
                      : ''
                  }`}
                >
                  <span className="font-medium">{lineageBreak.title}</span>
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {lineageBreak.severity}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {selectedBreak ? (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="font-medium">
                Field at risk:{' '}
                <span className="font-mono">{selectedBreak.field}</span>
              </p>
              <p className="mt-2 leading-6 text-muted-foreground">
                {selectedBreak.clientImpact}
              </p>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Fix path
                </p>
                <CompactList values={selectedBreak.fixPath} />
              </div>
            </div>
          ) : null}
        </div>
      </Panel>
    </ReactFlow>
  );
}

function PanelSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border bg-background/70 p-3 text-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </section>
  );
}

function CompactList({ values }: { values: string[] }) {
  return (
    <ul className="space-y-1 text-sm text-muted-foreground">
      {values.map((value) => (
        <li key={value} className="leading-5">
          • {value}
        </li>
      ))}
    </ul>
  );
}
