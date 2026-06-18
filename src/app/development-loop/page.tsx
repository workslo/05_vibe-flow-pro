import type { Metadata } from 'next';

import { DevelopmentLoopWorkspace } from './components/development-loop-workspace';
import { DevelopmentRunProvider } from './store';

export const metadata: Metadata = {
  title: 'AI Development Loop | Vibe Flow Pro',
  description: 'Plan, code, test, validate, and revise a feature workflow.',
};

export default function DevelopmentLoopPage() {
  return (
    <DevelopmentRunProvider>
      <DevelopmentLoopWorkspace />
    </DevelopmentRunProvider>
  );
}
