import { DocumentType } from '../types';

export type ClassificationResult = {
  documentType: DocumentType;
  summary: string;
  suggestedTags: string[];
  confidence: number;
  signals: Record<string, number>;
};

type Rule = {
  type: DocumentType;
  keywords: Array<{ pattern: RegExp; weight: number }>;
  fields: Array<{ pattern: RegExp; weight: number }>;
  negatives?: Array<{ pattern: RegExp; weight: number }>;
};

const normalize = (text: string) =>
  text
    .replace(/\s+/g, ' ')
    .replace(/[_\-]+/g, ' ')
    .toLowerCase();

const pickSummary = (text: string) => {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Summary unavailable.';
  return cleaned.length > 200 ? `${cleaned.slice(0, 197)}...` : cleaned;
};

const uniqueTags = (tags: string[]) => Array.from(new Set(tags));

const generalIndicators: RegExp[] = [
  /roadmap|progress report|status report|technical report|executive summary/,
  /overview|introduction|architecture|specification|design doc|proposal summary/,
  /milestone|deliverable|timeline|sprint|release notes|changelog/,
];

const transactionalSignals: RegExp[] = [
  /\b(invoice|purchase order|rfq|quotation)\b/,
  /\b(no\.?|number|id|#)\b/,
  /\bline items?|quantity|unit price\b/,
  /\bamount due|balance due|total amount|grand total|subtotal|tax|vat\b/,
  /\bship to|bill to\b/,
  /\bvalid until|due date|payment terms\b/,
  /\b(usd|eur|gbp|ngn|cad|aud)\b/,
  /[$€£₦]/,
];
const typeRequiredSignals: Record<DocumentType, RegExp[]> = {
  [DocumentType.RFQ]: [
    /request for quotation|rfq\b/,
    /rfq (no\.?|number|#)|rfq id/,
    /due date|closing date|deadline/,
    /scope of work|specifications|requirements/,
  ],
  [DocumentType.PO]: [
    /purchase order|\bpo\b/,
    /po (no\.?|number|#)|po id/,
    /ship to|ship-to|bill to|bill-to/,
    /terms and conditions|payment terms|incoterms/,
    /line items|quantity|unit price|total amount|grand total|subtotal|tax|vat/,
  ],
  [DocumentType.INVOICE]: [
    /invoice|tax invoice|commercial invoice/,
    /invoice (no\.?|number|#)|invoice id/,
    /amount due|balance due|total due/,
    /subtotal|tax|vat|total amount|grand total/,
  ],
  [DocumentType.QUOTATION]: [
    /quotation|quote\b|price quote/,
    /quotation (no\.?|number|#)|quote id/,
    /valid until|quote validity|validity period/,
    /unit price|pricing|rate/,
    /subtotal|tax|vat|total amount|grand total/,
  ],
  [DocumentType.GENERAL]: [],
};

const typeHeaderSignals: Record<DocumentType, RegExp[]> = {
  [DocumentType.RFQ]: [/request for quotation|rfq\b/],
  [DocumentType.PO]: [/purchase order|\bpo\b/],
  [DocumentType.INVOICE]: [/invoice|tax invoice|commercial invoice/],
  [DocumentType.QUOTATION]: [/quotation|price quote|\bquote\b/],
  [DocumentType.GENERAL]: [],
};

const rules: Rule[] = [
  {
    type: DocumentType.RFQ,
    keywords: [
      { pattern: /request for quotation|rfq\b/, weight: 6 },
      { pattern: /bid solicitation|request for proposal|rfp\b/, weight: 3 },
      { pattern: /quotation due|submission deadline|bid due/, weight: 2 },
    ],
    fields: [
      { pattern: /rfq (no\.?|number|#)|rfq id/, weight: 4 },
      { pattern: /due date|closing date|deadline/, weight: 2 },
      { pattern: /scope of work|specifications|requirements/, weight: 2 },
    ],
    negatives: [
      { pattern: /invoice|purchase order|po\b/, weight: 3 },
    ],
  },
  {
    type: DocumentType.PO,
    keywords: [
      { pattern: /purchase order|\bpo\b/, weight: 6 },
      { pattern: /order confirmation|order date/, weight: 2 },
    ],
    fields: [
      { pattern: /po (no\.?|number|#)|po id/, weight: 4 },
      { pattern: /ship to|ship-to|bill to|bill-to/, weight: 2 },
      { pattern: /terms and conditions|payment terms|incoterms/, weight: 2 },
      { pattern: /line items|quantity|unit price|total/, weight: 1 },
    ],
    negatives: [
      { pattern: /invoice|quotation|rfq\b/, weight: 3 },
    ],
  },
  {
    type: DocumentType.INVOICE,
    keywords: [
      { pattern: /invoice|tax invoice|commercial invoice/, weight: 6 },
      { pattern: /amount due|balance due|total due/, weight: 3 },
    ],
    fields: [
      { pattern: /invoice (no\.?|number|#)|invoice id/, weight: 4 },
      { pattern: /due date|payment due|terms/, weight: 2 },
      { pattern: /subtotal|tax|vat|total/, weight: 2 },
      { pattern: /bill to|ship to/, weight: 1 },
    ],
    negatives: [
      { pattern: /purchase order|\bpo\b|rfq\b|quotation/, weight: 3 },
    ],
  },
  {
    type: DocumentType.QUOTATION,
    keywords: [
      { pattern: /quotation|quote\b|price quote/, weight: 6 },
      { pattern: /valid until|quote validity|validity period/, weight: 2 },
    ],
    fields: [
      { pattern: /quotation (no\.?|number|#)|quote id/, weight: 4 },
      { pattern: /unit price|pricing|rate/, weight: 2 },
      { pattern: /subtotal|tax|vat|total amount|grand total/, weight: 1 },
    ],
    negatives: [
      { pattern: /invoice|purchase order|\bpo\b|rfq\b/, weight: 3 },
    ],
  },
];

const computeScore = (text: string, rule: Rule) => {
  let score = 0;
  for (const { pattern, weight } of rule.keywords) {
    if (pattern.test(text)) score += weight;
  }
  for (const { pattern, weight } of rule.fields) {
    if (pattern.test(text)) score += weight;
  }
  for (const neg of rule.negatives || []) {
    if (neg.pattern.test(text)) score -= neg.weight;
  }
  return Math.max(score, 0);
};

const countMatches = (text: string, patterns: RegExp[]) =>
  patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);

export const classifyDocument = (fileName: string, content: string): ClassificationResult => {
  const text = normalize(`${fileName} ${content}`);
  const headerText = text.slice(0, 120);

  const scores: Record<string, number> = {};
  for (const rule of rules) {
    scores[rule.type] = computeScore(text, rule);
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topType, topScore] = sorted[0] || ['GENERAL', 0];
  const secondScore = sorted[1]?.[1] ?? 0;

  const confidence = topScore === 0
    ? 0
    : Math.min(0.99, (topScore / (topScore + secondScore + 1)));

  const docType = (topType as DocumentType) || DocumentType.GENERAL;
  const requiredPatterns = typeRequiredSignals[docType] || [];
  const headerPatterns = typeHeaderSignals[docType] || [];
  const requiredMatchCount = countMatches(text, requiredPatterns);
  const headerMatchCount = countMatches(headerText, headerPatterns);
  const generalHitCount = countMatches(text, generalIndicators);
  const transactionalHitCount = countMatches(text, transactionalSignals);
  const looksLikeGeneral = generalHitCount >= 2;

  // Balanced gate: allow 1 strong signal + header, or 2 required signals,
  // or 1 required signal with strong score.
  const passesRequiredGate =
    requiredMatchCount >= 2 ||
    (requiredMatchCount >= 1 && headerMatchCount >= 1) ||
    (requiredMatchCount >= 1 && topScore >= 7);

  // Slightly stricter only when it really looks like a general report.
  const scoreThreshold = looksLikeGeneral ? 7 : 5;
  const passesThreshold = topScore >= scoreThreshold;

  const passesHeaderGate =
    headerMatchCount >= 1 || transactionalHitCount >= 2;

  let documentType =
    passesRequiredGate && passesThreshold && passesHeaderGate
      ? docType
      : DocumentType.GENERAL;

  if (
    documentType === DocumentType.QUOTATION &&
    looksLikeGeneral &&
    headerMatchCount === 0 &&
    transactionalHitCount === 0
  ) {
    documentType = DocumentType.GENERAL;
  }

  const suggestedTags = uniqueTags([
    documentType,
    ...(topScore >= 5 ? [
      topType === 'PO' ? 'Purchase' : '',
      topType === 'RFQ' ? 'Sourcing' : '',
      topType === 'INVOICE' ? 'Accounts Payable' : '',
      topType === 'QUOTATION' ? 'Pricing' : '',
    ] : []),
  ].filter(Boolean));

  return {
    documentType,
    summary: pickSummary(content),
    suggestedTags,
    confidence,
    signals: scores,
  };
};