'use client';

import { type ReactNode, useCallback } from 'react';
import {
  Background,
  type NodeMouseHandler,
  Panel,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';

import {
  lineageBreaks,
  lineageStages,
} from '../domain/lineage-data';
import { productProfile } from '../domain/product-profile';
import { useLineageStore } from '../store';
import type { LineageStore } from '../store/lineage-store';
import LineageStageNode, {
  type LineageStageNodeType,
} from './lineage-stage-node';

const nodeTypes = {
  'lineage-stage-node': LineageStageNode,
};

const selector = (state: LineageStore) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  selectedStageId: state.selectedStageId,
  activeBreakId: state.activeBreakId,
  setSelectedStageId: state.setSelectedStageId,
  setActiveBreakId: state.setActiveBreakId,
});

function LineageCanvas() {
  const store = useLineageStore(useShallow(selector));

  const activeBreak = lineageBreaks.find(
    (lineageBreak) => lineageBreak.id === store.activeBreakId,
  );
  const selectedStage =
    lineageStages.find((stage) => stage.id === store.selectedStageId) ??
    lineageStages[0];
  const highlightedStageIds = new Set(activeBreak?.impactedStageIds ?? []);

  const decoratedNodes: LineageStageNodeType[] = store.nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      highlightedByBreak: highlightedStageIds.has(node.id),
    },
  }));
  const decoratedEdges = store.edges.map((edge) => {
    const highlighted =
      highlightedStageIds.has(edge.source) &&
      highlightedStageIds.has(edge.target);

    return {
      ...edge,
      animated: highlighted,
      className: highlighted ? 'stroke-amber-500' : undefined,
    };
  });

  const onNodeClick = useCallback<NodeMouseHandler>(
    (_, node) => {
      store.setSelectedStageId(node.id);
    },
    [store],
  );

  return (
    <ReactFlow
      className="h-full"
      nodes={decoratedNodes}
      edges={decoratedEdges}
      onNodesChange={store.onNodesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      nodesConnectable={false}
      fitView
      colorMode="system"
    >
      <Background />
      <Panel
        position="top-left"
        className="max-w-md rounded-lg border bg-card/95 p-4 text-card-foreground shadow-lg backdrop-blur"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {productProfile.tagline}
        </p>
        <h2 className="mt-1 text-lg font-semibold">
          {productProfile.defaultFlowName} lineage
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
                  onClick={() => store.setActiveBreakId(lineageBreak.id)}
                  className={`rounded-md border p-2 text-left text-sm transition hover:bg-accent ${
                    store.activeBreakId === lineageBreak.id
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
          {activeBreak ? (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="font-medium">
                Field at risk:{' '}
                <span className="font-mono">{activeBreak.field}</span>
              </p>
              <p className="mt-2 leading-6 text-muted-foreground">
                {activeBreak.clientImpact}
              </p>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Fix path
                </p>
                <CompactList values={activeBreak.fixPath} />
              </div>
            </div>
          ) : null}
        </div>
      </Panel>
    </ReactFlow>
  );
}

export function TaxOpsWorkspace() {
  return (
    <main className="h-screen bg-background">
      <ReactFlowProvider>
        <LineageCanvas />
      </ReactFlowProvider>
    </main>
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
