import { memo } from 'react';
import {
  Handle,
  Position,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import {
  Braces,
  ClipboardCheck,
  FileText,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { DevelopmentStageId } from '../domain/template';

export type DevelopmentNodeStatus =
  | 'waiting'
  | 'running'
  | 'complete'
  | 'revision'
  | 'blocked';

export type DevelopmentNodeData = {
  stageId: DevelopmentStageId;
  label: string;
  status: DevelopmentNodeStatus;
  artifactSummary: string;
};

export type DevelopmentNodeType = Node<
  DevelopmentNodeData,
  'development-stage'
>;

const stageIcons = {
  'feature-brief': FileText,
  'test-plan': ClipboardCheck,
  code: Braces,
  test: FlaskConical,
  validate: ShieldCheck,
} satisfies Record<DevelopmentStageId, typeof FileText>;

const statusLabels = {
  waiting: 'Waiting',
  running: 'Running',
  complete: 'Complete',
  revision: 'Needs revision',
  blocked: 'Blocked',
} satisfies Record<DevelopmentNodeStatus, string>;

const statusClasses = {
  waiting: 'border-slate-300 bg-white text-slate-600',
  running:
    'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-300/60',
  complete: 'border-emerald-500 bg-emerald-50 text-emerald-950',
  revision: 'border-amber-500 bg-amber-50 text-amber-950',
  blocked: 'border-red-500 bg-red-50 text-red-950',
} satisfies Record<DevelopmentNodeStatus, string>;

function DevelopmentNodeComponent({
  data,
}: NodeProps<DevelopmentNodeType>) {
  const Icon = stageIcons[data.stageId];
  const canReceiveRevision = data.stageId === 'code';
  const canSendRevision = data.stageId === 'validate';

  return (
    <article
      aria-label={`${data.label}: ${statusLabels[data.status]}`}
      className={cn(
        'relative w-56 border bg-white px-4 py-3 shadow-sm transition-colors',
        statusClasses[data.status],
      )}
    >
      <Handle
        id="incoming"
        type="target"
        position={Position.Left}
        className="!size-2.5 !border-2 !border-white !bg-slate-400"
      />
      <Handle
        id="forward"
        type="source"
        position={Position.Right}
        className="!size-2.5 !border-2 !border-white !bg-slate-400"
      />
      {canReceiveRevision ? (
        <Handle
          id="revision"
          type="target"
          position={Position.Bottom}
          className="!size-2.5 !border-2 !border-white !bg-amber-600"
        />
      ) : null}
      {canSendRevision ? (
        <Handle
          id="revision"
          type="source"
          position={Position.Bottom}
          className="!size-2.5 !border-2 !border-white !bg-amber-600"
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          <h3 className="truncate text-sm font-semibold text-slate-950">
            {data.label}
          </h3>
        </div>
        <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
          {statusLabels[data.status]}
        </span>
      </div>

      <p className="mt-3 line-clamp-3 min-h-12 text-xs leading-5 text-slate-600">
        {data.artifactSummary}
      </p>
      <p className="mt-3 border-t border-current/15 pt-2 font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
        {data.stageId}
      </p>
    </article>
  );
}

export const DevelopmentNode = memo(DevelopmentNodeComponent);
