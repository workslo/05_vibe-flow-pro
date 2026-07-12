'use client';

import { memo } from 'react';
import { type Node, NodeProps, Position } from '@xyflow/react';
import { AlertTriangle, Building2, CheckCircle2, FileText } from 'lucide-react';

import {
  DataField,
  LineageStageKind,
} from '@/app/tax-ops-mapper/domain/lineage-data';
import { BaseNode, BaseNodeContent } from '@/components/base-node';
import { LabeledHandle } from '@/components/labeled-handle';
import { cn } from '@/lib/utils';

export type LineageStageNodeType = Node<
  LineageStageNodeData,
  'lineage-stage-node'
>;

export type LineageStageNodeData = {
  title: string;
  kind: LineageStageKind;
  owner: string;
  system: string;
  summary: string;
  dataFields: DataField[];
  controls: string[];
  outputs: string[];
  risks: string[];
  highlightedByBreak?: boolean;
};

const kindLabel: Record<LineageStageKind, string> = {
  client: 'Client',
  system: 'System',
  control: 'Workflow control',
  tax: 'Tax engine',
  'client-output': 'Client output',
};

const kindClasses: Record<LineageStageKind, string> = {
  client: 'border-sky-300 bg-sky-500/10 text-sky-700 dark:text-sky-200',
  system: 'border-violet-300 bg-violet-500/10 text-violet-700 dark:text-violet-200',
  control: 'border-amber-300 bg-amber-500/10 text-amber-700 dark:text-amber-200',
  tax: 'border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
  'client-output':
    'border-rose-300 bg-rose-500/10 text-rose-700 dark:text-rose-200',
};

function LineageStageNode({ data, selected }: NodeProps<LineageStageNodeType>) {
  const hasRisk = data.risks.length > 0;

  return (
    <BaseNode
      className={cn(
        'w-[320px] overflow-hidden transition-shadow',
        selected && 'ring-2 ring-primary',
        data.highlightedByBreak &&
          'border-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.22)]',
      )}
    >
      <LabeledHandle
        id="lineage-input"
        title="In"
        type="target"
        position={Position.Left}
        className="-left-3 top-1/2"
      />
      <BaseNodeContent className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {kindLabel[data.kind]}
            </p>
            <h3 className="mt-1 text-base font-semibold leading-tight">
              {data.title}
            </h3>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold',
              kindClasses[data.kind],
            )}
          >
            {data.system}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-5 text-muted-foreground">
          {data.summary}
        </p>

        <div className="grid gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="size-3.5 text-muted-foreground" />
            <span className="truncate">{data.owner}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {data.dataFields.slice(0, 5).map((field) => (
              <span
                key={field}
                className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px]"
              >
                {field}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-500" />
            {data.controls.length} controls
          </div>
          <div className="flex items-center gap-1">
            <FileText className="size-3 text-sky-500" />
            {data.outputs.length} outputs
          </div>
          {hasRisk ? (
            <div className="col-span-2 flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3" />
              {data.risks[0]}
            </div>
          ) : null}
        </div>
      </BaseNodeContent>
      <LabeledHandle
        id="lineage-output"
        title="Out"
        type="source"
        position={Position.Right}
        className="-right-3 top-1/2"
      />
    </BaseNode>
  );
}

export default memo(LineageStageNode) as typeof LineageStageNode;
