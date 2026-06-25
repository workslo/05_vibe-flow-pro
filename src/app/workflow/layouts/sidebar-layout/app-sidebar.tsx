'use client';

import { useState, useCallback, ComponentProps } from 'react';
import { useReactFlow } from '@xyflow/react';
import { GitBranch, GripVertical, Plus } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { SettingsDialog } from '@/app/workflow/components/settings-dialog';
import {
  AppNode,
  createNodeByType,
  type NodeConfig,
} from '@/app/workflow/components/nodes';
import { cn } from '@/lib/utils';
import { iconMapping } from '@/app/workflow/utils/icon-mapping';
import { useAppStore } from '@/app/workflow/store';
import { type AppStore } from '@/app/workflow/store/app-store';
import { productProfile } from '@/app/workflow/product-profile';
import { lineageStages } from '@/app/workflow/lineage-data';
import { nodesConfig } from '../../config';

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="py-0">
        <div className="flex gap-2 px-1 h-14 items-center ">
          <div className="flex aspect-square size-5 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <GitBranch className="size-3" />
          </div>
          <span className="truncate font-semibold">{productProfile.name}</span>
        </div>
        <SidebarMenu>
          {Object.values(nodesConfig)
            .filter((item) => item.id === 'lineage-stage-node')
            .map((item) => (
              <DraggableItem key={item.title} {...item} />
            ))}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <SettingsDialog />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

const selector = (state: AppStore) => state.addNode;

function DraggableItem(props: NodeConfig) {
  const { screenToFlowPosition } = useReactFlow();
  const addNode = useAppStore(useShallow(selector));
  const [isDragging, setIsDragging] = useState(false);

  const onClick = useCallback(() => {
    const starterStage = lineageStages[0];
    const newNode: AppNode = createNodeByType({
      type: props.id,
      position: screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }),
      data:
        props.id === 'lineage-stage-node'
          ? {
              ...starterStage,
              title: 'New lineage stage',
              summary:
                'Describe the system hop, workflow control, data fields, outputs, and risk for this stage.',
              status: 'initial',
              icon: 'GitBranch',
            }
          : undefined,
    });

    addNode(newNode);
  }, [props, addNode, screenToFlowPosition]);

  const onDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('application/reactflow', JSON.stringify(props));
      setIsDragging(true);
    },
    [props],
  );

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const IconComponent = props?.icon ? iconMapping[props.icon] : undefined;

  return (
    <SidebarMenuItem
      className={cn(
        'relative rounded-md border border-sidebar-border active:scale-[.99]',
        isDragging ? 'border-green-500' : '',
      )}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      draggable
      key={props.title}
    >
      {isDragging && (
        <span
          role="presentation"
          className="absolute -top-3 -right-3 rounded-md border-2 border-green-500 bg-card"
        >
          <Plus className="size-4" />
        </span>
      )}
      <SidebarMenuButton className="cursor-grab bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground active:cursor-grabbing">
        {IconComponent ? <IconComponent aria-label={props?.icon} /> : null}
        <span>{props.title}</span>
        <GripVertical className="ml-auto" />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
