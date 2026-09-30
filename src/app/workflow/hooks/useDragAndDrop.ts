'use client';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useReactFlow } from '@xyflow/react';

import { AppNodeType, createNodeByType } from '@/app/workflow/components/nodes';
import { nodesConfig } from '@/app/workflow/config';
import { useAppStore } from '@/app/workflow/store';
import { AppStore } from '@/app/workflow/store/app-store';

export const NODE_DRAG_MIME = 'application/reactflow';

const selector = (state: AppStore) => state.addNode;

type DragData = Pick<DataTransfer, 'types' | 'getData'>;

function isAppNodeType(value: unknown): value is AppNodeType {
  return typeof value === 'string' && Object.hasOwn(nodesConfig, value);
}

// dragover can only read `types`; the payload itself is readable on drop.
export function isNodeDrag(dataTransfer: Pick<DataTransfer, 'types'>): boolean {
  return Array.from(dataTransfer.types).includes(NODE_DRAG_MIME);
}

export function parseNodeDragPayload(
  dataTransfer: DragData,
): AppNodeType | null {
  if (!isNodeDrag(dataTransfer)) return null;

  const raw = dataTransfer.getData(NODE_DRAG_MIME);
  if (!raw) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof payload !== 'object' || payload === null) return null;
  const { id } = payload as { id?: unknown };

  return isAppNodeType(id) ? id : null;
}

export function useDragAndDrop() {
  const { screenToFlowPosition } = useReactFlow();
  const addNode = useAppStore(useShallow(selector));

  const onDrop: React.DragEventHandler = useCallback(
    (event) => {
      const type = parseNodeDragPayload(event.dataTransfer);
      if (!type) return;

      event.preventDefault();
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(createNodeByType({ type, position }));
    },
    [addNode, screenToFlowPosition],
  );

  const onDragOver: React.DragEventHandler = useCallback((event) => {
    if (isNodeDrag(event.dataTransfer)) event.preventDefault();
  }, []);

  return useMemo(() => ({ onDrop, onDragOver }), [onDrop, onDragOver]);
}
