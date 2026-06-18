export const productProfile = {
  name: 'Vibe Flow Pro',
  tagline: 'Workflow console',
  description:
    'Design, run, and inspect AI generation flows in a focused React Flow workspace with Zustand powering the editor state.',
  defaultFlowName: 'Brand signal generator',
  integrationStatus: 'Server key',
  workflowStages: [
    {
      index: '01',
      title: 'Creative brief',
      detail: 'Prompt input',
    },
    {
      index: '02',
      title: 'Narrative pass',
      detail: 'Generate text',
    },
    {
      index: '03',
      title: 'Visual draft',
      detail: 'Generate image',
    },
  ],
  links: {
    developmentLoop: '/development-loop',
    workflow: '/workflow',
    reactFlowDocs: 'https://reactflow.dev/',
  },
} as const;
