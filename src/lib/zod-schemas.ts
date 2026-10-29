import { z } from "zod";

export const FeedbackAnalysisSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  sentimentScore: z.number().min(-1).max(1),
  primaryCategory: z.string().min(1),
  painPoint: z.string().nullable().optional().default(null),
  featureRequest: z.string().nullable().optional().default(null),
  isExplicitRequest: z.boolean().default(false),
  productArea: z.string().default("General"),
  explanation: z.string().min(1),
  keyQuotes: z.array(z.string()).default([]),
});

export const BatchAnalysisItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  segment: z.string().optional(),
  product: z.string().optional(),
  source: z.string().optional(),
  rating: z.number().optional().nullable(),
});

export const BatchAnalysisRequestSchema = z.object({
  items: z.array(BatchAnalysisItemSchema),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional().default(0.2),
});

export const ColumnMappingSchema = z.object({
  idField: z.string().min(1, "ID column mapping is required"),
  textField: z.string().min(1, "Feedback text column is required"),
  dateField: z.string().optional(),
  segmentField: z.string().optional(),
  productField: z.string().optional(),
  sourceField: z.string().optional(),
  ratingField: z.string().optional(),
});

export const ModelSettingsSchema = z.object({
  apiKey: z.string().optional().default(""),
  primaryModel: z.string().min(1),
  fallbackModel1: z.string().min(1),
  fallbackModel2: z.string().min(1),
  batchSize: z.number().min(1).max(20).default(5),
  concurrency: z.number().min(1).max(5).default(2),
  timeoutMs: z.number().min(5000).max(60000).default(30000),
  useFallback: z.boolean().default(true),
});

export type ValidatedFeedbackAnalysis = z.infer<typeof FeedbackAnalysisSchema>;
export type ValidatedBatchRequest = z.infer<typeof BatchAnalysisRequestSchema>;
export type ValidatedColumnMapping = z.infer<typeof ColumnMappingSchema>;
export type ValidatedModelSettings = z.infer<typeof ModelSettingsSchema>;
