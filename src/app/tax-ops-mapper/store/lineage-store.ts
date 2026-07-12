import { applyNodeChanges, type Edge, type NodeChange } from '@xyflow/react';
import { create } from 'zustand';

import type { LineageStageNodeType } from '../components/lineage-stage-node';

export type LineageState = {
  nodes: LineageStageNodeType[];
  edges: Edge[];
  selectedStageId?: string;
  activeBreakId?: string;
};

export type LineageActions = {
  onNodesChange: (changes: NodeChange<LineageStageNodeType>[]) => void;
  setSelectedStageId: (stageId: string | undefined) => void;
  setActiveBreakId: (breakId: string | undefined) => void;
};

export type LineageStore = LineageState & LineageActions;

export function createLineageStore(
  initialState: Partial<LineageState> | undefined = undefined,
) {
  return create<LineageStore>()((set, get) => ({
    nodes: initialState?.nodes ?? [],
    edges: initialState?.edges ?? [],
    selectedStageId: initialState?.selectedStageId,
    activeBreakId: initialState?.activeBreakId,

    onNodesChange: (changes) =>
      set({ nodes: applyNodeChanges(changes, get().nodes) }),

    setSelectedStageId: (stageId) => set({ selectedStageId: stageId }),

    setActiveBreakId: (breakId) => set({ activeBreakId: breakId }),
  }));
}
