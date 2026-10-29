export type SentimentType = "positive" | "neutral" | "negative";

export interface FeedbackAnalysis {
  sentiment: SentimentType;
  sentimentScore: number; // -1.0 (very negative) to 1.0 (very positive)
  primaryCategory: string; // e.g. "Performance", "Navigation", "Integrations", "Billing", "Onboarding"
  painPoint: string | null;
  featureRequest: string | null;
  isExplicitRequest: boolean;
  productArea: string; // e.g. "Core Platform", "Billing", "API", "Mobile", "Analytics"
  explanation: string;
  keyQuotes: string[];
  modelUsed?: string;
  analyzedAt: string;
}

export interface FeedbackRecord {
  id: string;
  datasetId: string;
  text: string;
  date?: string; // YYYY-MM-DD
  segment?: string; // e.g., "Enterprise", "Mid-Market", "SMB", "Startup"
  product?: string; // e.g., "Dashboard", "API", "Billing", "Mobile App"
  source?: string; // e.g., "G2 Review", "Zendesk", "In-App CSAT", "Sales Call"
  rating?: number | null; // e.g. 1 to 5
  metadata?: Record<string, any>;
  createdAt: string;
  analysis?: FeedbackAnalysis | null;
}

export interface DiscoveredTheme {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: number; // Distinct feedback record count
  feedbackIds: string[];
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  segmentBreakdown: Record<string, number>;
  representativeQuotes: Array<{
    quote: string;
    feedbackId: string;
    segment?: string;
  }>;
  growthTrend: "increasing" | "stable" | "decreasing";
  firstSeenDate?: string;
  lastSeenDate?: string;
}

export interface MinedFeatureRequest {
  id: string;
  normalizedTitle: string;
  description: string;
  productArea: string;
  mentionCount: number;
  feedbackIds: string[];
  representativeQuotes: Array<{
    quote: string;
    feedbackId: string;
    source?: string;
    segment?: string;
  }>;
  sentimentScore: number;
  firstSeenDate?: string;
  latestSeenDate?: string;
  affectedSegments: string[];
  isExplicit: boolean; // Explicit request vs inferred opportunity
  priorityScore: number; // calculated from mentions, sentiment urgency, and segments
}

export interface AIInsight {
  id: string;
  type: "trend" | "anomaly" | "segment_disparity" | "emerging_issue" | "feature_opportunity";
  title: string;
  explanation: string;
  metricSummary: string;
  metrics: {
    primaryValue: string | number;
    comparisonValue?: string | number;
    deltaPercent?: number;
    sampleSize: number;
  };
  evidenceQuotes: Array<{
    quote: string;
    feedbackId: string;
    segment?: string;
  }>;
  confidence: "high" | "medium" | "low";
  hypothesis: string;
  suggestedAction: string;
  detectedAt: string;
}

export interface Dataset {
  id: string;
  name: string;
  fileName: string;
  rowCount: number;
  analyzedCount: number;
  createdAt: string;
  updatedAt: string;
  isSynthetic?: boolean;
}

export interface ColumnMapping {
  idField: string;
  textField: string;
  dateField?: string;
  segmentField?: string;
  productField?: string;
  sourceField?: string;
  ratingField?: string;
}

export interface NvidiaModel {
  id: string;
  name: string;
  contextWindow: number;
  category: "reasoning" | "fast" | "general";
  recommendedFor: string;
}

export interface ModelSettings {
  apiKey: string;
  primaryModel: string;
  fallbackModel1: string;
  fallbackModel2: string;
  batchSize: number;
  concurrency: number;
  timeoutMs: number;
  useFallback: boolean;
}

export interface AnalysisProgress {
  isAnalyzing: boolean;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentBatch: number;
  activeModel: string;
  errorMessage?: string | null;
}
