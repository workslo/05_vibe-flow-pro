import type { Metadata } from 'next';

import { TaxOpsWorkspace } from './components/tax-ops-workspace';
import { defaultBreakId } from './domain/lineage-data';
import { initialEdges, initialNodes } from './mock-data';
import { LineageProvider } from './store';

export const metadata: Metadata = {
  title: 'Tax Operations Mapper | Vibe Flow Pro',
  description:
    'Visualize tax workflows, controls, owners, and handoffs across the trade-to-1099 lineage.',
};

export default function TaxOpsMapperPage() {
  return (
    <LineageProvider
      initialState={{
        nodes: initialNodes,
        edges: initialEdges,
        activeBreakId: defaultBreakId,
      }}
    >
      <TaxOpsWorkspace />
    </LineageProvider>
  );
}
