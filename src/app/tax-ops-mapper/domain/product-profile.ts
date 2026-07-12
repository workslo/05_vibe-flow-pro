export const productProfile = {
  name: 'TradeTrace',
  tagline: 'Trade-to-1099 lineage workbench',
  description:
    'Map how direct trading data moves from client intent through systems, operational controls, tax calculations, statements, and final 1099 filing.',
  defaultFlowName: 'Equity sale to 1099-B',
  integrationStatus: 'Seeded lineage',
  workflowStages: [
    {
      index: '01',
      title: 'Client intent',
      detail: 'Sell 100 XYZ',
    },
    {
      index: '02',
      title: 'Execution to books',
      detail: 'Order, fill, settlement',
    },
    {
      index: '03',
      title: 'Tax lot engine',
      detail: 'Basis and gain/loss',
    },
    {
      index: '04',
      title: '1099-B package',
      detail: 'Form boxes and filing',
    },
  ],
  links: {
    workflow: '/tax-ops-mapper',
    reactFlowDocs: 'https://reactflow.dev/',
  },
} as const;
