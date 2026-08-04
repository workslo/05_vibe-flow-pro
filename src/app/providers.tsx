'use client';

import { ReactFlowProvider } from '@xyflow/react';
import type { ReactNode } from 'react';

import { AppStoreProvider } from '@/app/workflow/store';
import { ThemeProvider } from '@/components/theme-provider';

import { initialEdges, initialNodes } from './workflow/mock-data';

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AppStoreProvider
      initialState={{ nodes: initialNodes, edges: initialEdges }}
    >
      <ReactFlowProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </ReactFlowProvider>
    </AppStoreProvider>
  );
}
