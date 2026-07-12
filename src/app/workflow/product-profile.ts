export const productProfile = {
  name: 'Vibe Flow Pro',
  tagline: 'Workflow console',
  description:
    'Map tax operations workflows, controls, owners, and handoffs in a focused React Flow workspace with Zustand powering editor state.',
  defaultFlowName: 'Tax operations mapper',
  integrationStatus: 'Server key',
  workflowStages: [
    {
      index: '01',
      title: 'Process intake',
      detail: 'Capture trigger',
    },
    {
      index: '02',
      title: 'Control mapping',
      detail: 'Document controls',
    },
    {
      index: '03',
      title: 'Owner handoff',
      detail: 'Assign accountability',
    },
  ],
  links: {
    developmentLoop: '/development-loop',
    workflow: '/workflow',
    reactFlowDocs: 'https://reactflow.dev/',
  },
} as const;
