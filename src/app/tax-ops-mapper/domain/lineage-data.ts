export type LineageStageKind =
  | 'client'
  | 'system'
  | 'control'
  | 'tax'
  | 'client-output';

export type DataField =
  | 'intent'
  | 'orderId'
  | 'tradeDate'
  | 'settlementDate'
  | 'cusip'
  | 'quantity'
  | 'price'
  | 'proceeds'
  | 'costBasis'
  | 'gainLoss'
  | 'washSale'
  | 'withholding'
  | 'form1099B';

export type LineageStage = {
  id: string;
  title: string;
  kind: LineageStageKind;
  owner: string;
  system: string;
  summary: string;
  dataFields: DataField[];
  controls: string[];
  outputs: string[];
  risks: string[];
};

export type LineageBreak = {
  id: string;
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  field: DataField;
  impactedStageIds: string[];
  clientImpact: string;
  fixPath: string[];
};

export const lineageStages: LineageStage[] = [
  {
    id: 'client-intent',
    title: 'Client trading intent',
    kind: 'client',
    owner: 'Client / Advisor',
    system: 'Conversation, portal, or advisor workstation',
    summary:
      'The lineage starts before a formal record exists: the client decides to sell 100 shares of XYZ and communicates that intent.',
    dataFields: ['intent', 'cusip', 'quantity'],
    controls: ['Suitability context captured', 'Account authority verified'],
    outputs: ['Trade instruction'],
    risks: ['Ambiguous instruction', 'Wrong account or security selected'],
  },
  {
    id: 'order-capture',
    title: 'Order capture',
    kind: 'system',
    owner: 'Front office operations',
    system: 'OMS',
    summary:
      'The instruction becomes a structured order with account, security, side, quantity, and order identifiers.',
    dataFields: ['orderId', 'cusip', 'quantity'],
    controls: ['Order validation', 'Restricted-list check', 'Buying-power check'],
    outputs: ['Routed sell order'],
    risks: ['CUSIP mismatch', 'Rejected order not visible downstream'],
  },
  {
    id: 'execution',
    title: 'Trade execution',
    kind: 'system',
    owner: 'Trading desk',
    system: 'Execution venue / broker',
    summary:
      'The sell order is executed and the economics that later become gross proceeds are locked in.',
    dataFields: ['tradeDate', 'quantity', 'price', 'proceeds'],
    controls: ['Execution report match', 'Cancel/correct monitoring'],
    outputs: ['Execution report', 'Trade confirmation economics'],
    risks: ['Partial fill handling', 'Late correction changes proceeds'],
  },
  {
    id: 'books-records',
    title: 'Books and records',
    kind: 'system',
    owner: 'Middle office',
    system: 'Books & records / custody platform',
    summary:
      'Execution data lands in official books, settlement status is tracked, and the position decrement becomes the operational source of truth.',
    dataFields: ['settlementDate', 'cusip', 'quantity', 'proceeds'],
    controls: ['Trade-date reconciliation', 'Settlement exception review'],
    outputs: ['Settled transaction record', 'Position update'],
    risks: ['Failed settlement', 'Position or quantity break'],
  },
  {
    id: 'tax-lot',
    title: 'Tax lot selection',
    kind: 'tax',
    owner: 'Tax operations',
    system: 'Tax lot engine',
    summary:
      'The disposal is matched to acquisition lots so basis, holding period, gain/loss, and wash-sale treatment can be computed.',
    dataFields: ['costBasis', 'gainLoss', 'washSale', 'tradeDate', 'cusip'],
    controls: ['Lot relief method check', 'Wash-sale scan', 'Missing basis queue'],
    outputs: ['Realized gain/loss lot detail'],
    risks: ['Missing acquisition basis', 'Incorrect covered/noncovered flag'],
  },
  {
    id: 'tax-review',
    title: 'Exception and signoff workflow',
    kind: 'control',
    owner: 'Tax reporting controls',
    system: 'Reconciliation dashboard / break queue',
    summary:
      'Operations reviews variances, manual adjustments, late corrections, and readiness for year-end reporting.',
    dataFields: ['proceeds', 'costBasis', 'gainLoss', 'washSale', 'withholding'],
    controls: ['Proceeds-to-books tieout', 'Basis completeness review', 'Supervisor signoff'],
    outputs: ['Approved tax reporting dataset'],
    risks: ['Manual adjustment lacks evidence', 'Unresolved break leaks to forms'],
  },
  {
    id: 'form-production',
    title: '1099-B production',
    kind: 'client-output',
    owner: 'Client tax reporting',
    system: 'Tax form renderer',
    summary:
      'Approved tax data is transformed into form boxes and statement disclosures for the client package.',
    dataFields: ['form1099B', 'proceeds', 'costBasis', 'gainLoss', 'washSale'],
    controls: ['Form-box mapping validation', 'Sample package review'],
    outputs: ['1099-B boxes 1a–1g', 'Annual tax statement'],
    risks: ['Wrong box mapping', 'Late correction after package generation'],
  },
  {
    id: 'client-filing',
    title: 'Client files tax return',
    kind: 'client',
    owner: 'Client / tax preparer',
    system: 'Client tax software or CPA workflow',
    summary:
      'The client uses the 1099 package as source evidence when filing the tax return.',
    dataFields: ['form1099B', 'proceeds', 'costBasis', 'gainLoss'],
    controls: ['Client statement available', 'Corrected form monitoring'],
    outputs: ['Filed return using 1099-B data'],
    risks: ['Client files before corrected form', 'Form data not understood'],
  },
];

export const lineageBreaks: LineageBreak[] = [
  {
    id: 'missing-basis',
    title: 'Missing cost basis',
    severity: 'High',
    field: 'costBasis',
    impactedStageIds: ['tax-lot', 'tax-review', 'form-production', 'client-filing'],
    clientImpact:
      'The client may receive a 1099-B with missing or incorrect basis, overstating taxable gain or requiring manual tax preparer follow-up.',
    fixPath: [
      'Find acquisition lot evidence',
      'Update tax lot engine',
      'Rerun realized gain/loss',
      'Re-approve form production dataset',
    ],
  },
  {
    id: 'proceeds-variance',
    title: 'Proceeds variance',
    severity: 'Medium',
    field: 'proceeds',
    impactedStageIds: ['execution', 'books-records', 'tax-review', 'form-production'],
    clientImpact:
      'Trade economics on the client statement and 1099-B may not tie to execution records.',
    fixPath: [
      'Compare execution report to books',
      'Resolve cancel/correct event',
      'Refresh tax reporting extract',
    ],
  },
  {
    id: 'wash-sale-mismatch',
    title: 'Wash sale mismatch',
    severity: 'Medium',
    field: 'washSale',
    impactedStageIds: ['tax-lot', 'tax-review', 'form-production'],
    clientImpact:
      'Disallowed loss may be wrong on the 1099 package, changing reportable gain/loss.',
    fixPath: [
      'Re-run wash-sale scan',
      'Check related purchase window',
      'Approve adjusted lot basis',
    ],
  },
];

export const defaultBreakId = lineageBreaks[0].id;
