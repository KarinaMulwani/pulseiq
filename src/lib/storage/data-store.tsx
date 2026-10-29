"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  AIInsight,
  AnalysisProgress,
  Dataset,
  DiscoveredTheme,
  FeedbackRecord,
  MinedFeatureRequest,
  ModelSettings,
} from "@/types";
import {
  RAW_SAMPLE_FEEDBACK,
  SAMPLE_DATASET_ID,
  SAMPLE_DATASET_NAME,
  generateSyntheticFeedbackList,
} from "@/lib/sample-data";
import { analyzeFeedbackRecords, fallbackAnalyzeRecord } from "@/lib/ai/analyzer";
import { clusterFeedbackThemes } from "@/lib/ai/clustering";
import { mineFeatureRequests } from "@/lib/ai/feature-miner";
import { generateAIInsights } from "@/lib/ai/insights-engine";

interface DataStoreContextType {
  datasets: Dataset[];
  activeDatasetId: string | null;
  activeDataset: Dataset | null;
  records: FeedbackRecord[];
  themes: DiscoveredTheme[];
  features: MinedFeatureRequest[];
  insights: AIInsight[];
  modelSettings: ModelSettings;
  analysisProgress: AnalysisProgress;
  isReady: boolean;
  setActiveDatasetId: (id: string) => void;
  loadSyntheticSampleData: () => Promise<void>;
  importCsvDataset: (
    name: string,
    fileName: string,
    rawRecords: Array<Omit<FeedbackRecord, "id" | "datasetId" | "createdAt" | "analysis">>
  ) => Promise<string>;
  deleteDataset: (id: string) => void;
  runAnalysisOnDataset: (datasetId?: string) => Promise<void>;
  recomputeArtifacts: () => void;
  updateModelSettings: (settings: Partial<ModelSettings>) => void;
  exportDataAsCsv: (type: "feedback" | "themes" | "features" | "insights") => void;
  clearAllData: () => void;
}

const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  apiKey: "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",
  primaryModel: "nvidia/nemotron-3.5-super-vl-120b-a12b",
  fallbackModel1: "nvidia/nemotron-3.5-lightning-30b-a3b",
  fallbackModel2: "meta/llama-3.2-11b-vision-instruct",
  batchSize: 5,
  concurrency: 2,
  timeoutMs: 30000,
  useFallback: true,
};

const DataStoreContext = createContext<DataStoreContextType | null>(null);

const STORAGE_KEY_DATASETS = "pulseiq_datasets_v1";
const STORAGE_KEY_RECORDS = "pulseiq_records_v1";
const STORAGE_KEY_SETTINGS = "pulseiq_settings_v1";

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<FeedbackRecord[]>([]);
  const [modelSettings, setModelSettings] = useState<ModelSettings>(DEFAULT_MODEL_SETTINGS);
  const [isReady, setIsReady] = useState(false);

  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({
    isAnalyzing: false,
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    currentBatch: 0,
    activeModel: "Ready",
  });

  // Load persisted state from localStorage on initial render
  useEffect(() => {
    try {
      const savedDatasets = localStorage.getItem(STORAGE_KEY_DATASETS);
      const savedRecords = localStorage.getItem(STORAGE_KEY_RECORDS);
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);

      let loadedDatasets: Dataset[] = [];
      let loadedRecords: FeedbackRecord[] = [];

      if (savedDatasets) {
        loadedDatasets = JSON.parse(savedDatasets);
      }
      if (savedRecords) {
        loadedRecords = JSON.parse(savedRecords);
      }
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (!parsed.apiKey) {
          parsed.apiKey = DEFAULT_MODEL_SETTINGS.apiKey;
        }
        if (
          !parsed.primaryModel ||
          parsed.primaryModel === "meta/llama-3.3-70b-instruct" ||
          parsed.primaryModel === "meta/llama-3.1-8b-instruct"
        ) {
          parsed.primaryModel = "meta/llama-3.2-11b-vision-instruct";
        }
        setModelSettings({ ...DEFAULT_MODEL_SETTINGS, ...parsed });
      }

      if (loadedDatasets.length > 0) {
        // Upgrade legacy cached 40-record sample dataset if present in user's localStorage
        const hasLegacySample = loadedDatasets.some(
          (d) => d.id === SAMPLE_DATASET_ID && d.rowCount < 80
        );
        if (hasLegacySample) {
          const freshRecords = generateSyntheticFeedbackList();
          const otherDatasets = loadedDatasets.filter((d) => d.id !== SAMPLE_DATASET_ID);
          const otherRecords = loadedRecords.filter((r) => r.datasetId !== SAMPLE_DATASET_ID);
          const sampleDataset: Dataset = {
            id: SAMPLE_DATASET_ID,
            name: "CloudPulse SaaS (Demo)",
            fileName: "cloudpulse_feedback_benchmark.csv",
            rowCount: freshRecords.length,
            analyzedCount: freshRecords.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isSynthetic: true,
          };
          setDatasets([sampleDataset, ...otherDatasets]);
          setAllRecords([...freshRecords, ...otherRecords]);
          setActiveDatasetId(SAMPLE_DATASET_ID);
        } else {
          setDatasets(loadedDatasets);
          setAllRecords(loadedRecords);
          setActiveDatasetId(loadedDatasets[0].id);
        }
      } else {
        // Automatically initialize CloudPulse SaaS (Demo) benchmark dataset
        const initialRecords = generateSyntheticFeedbackList();

        const initialDataset: Dataset = {
          id: SAMPLE_DATASET_ID,
          name: "CloudPulse SaaS (Demo)",
          fileName: "cloudpulse_feedback_benchmark.csv",
          rowCount: initialRecords.length,
          analyzedCount: initialRecords.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isSynthetic: true,
        };

        setDatasets([initialDataset]);
        setAllRecords(initialRecords);
        setActiveDatasetId(SAMPLE_DATASET_ID);
      }
    } catch (e) {
      console.error("Failed to load local storage state:", e);
    } finally {
      setIsReady(true);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (!isReady) return;
    try {
      localStorage.setItem(STORAGE_KEY_DATASETS, JSON.stringify(datasets));
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(allRecords));
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(modelSettings));
    } catch (e) {
      console.warn("Storage quota or error saving state:", e);
    }
  }, [datasets, allRecords, modelSettings, isReady]);

  // Active dataset and its records
  const activeDataset = useMemo(() => {
    return datasets.find((d) => d.id === activeDatasetId) || null;
  }, [datasets, activeDatasetId]);

  const activeRecords = useMemo(() => {
    if (!activeDatasetId) return [];
    return allRecords.filter((r) => r.datasetId === activeDatasetId);
  }, [allRecords, activeDatasetId]);

  // Discovered Themes computed from active records
  const themes = useMemo(() => {
    return clusterFeedbackThemes(activeRecords);
  }, [activeRecords]);

  // Mined Feature Requests computed from active records
  const features = useMemo(() => {
    return mineFeatureRequests(activeRecords);
  }, [activeRecords]);

  // AI Insights computed deterministically from active records, themes, features
  const insights = useMemo(() => {
    return generateAIInsights(activeRecords, themes, features);
  }, [activeRecords, themes, features]);

  // Load / Regenerate Synthetic Sample Data
  const loadSyntheticSampleData = async () => {
    const freshRecords = generateSyntheticFeedbackList();
    const now = new Date().toISOString();
    const newDataset: Dataset = {
      id: SAMPLE_DATASET_ID,
      name: "CloudPulse SaaS (Demo)",
      fileName: "cloudpulse_feedback_benchmark.csv",
      rowCount: freshRecords.length,
      analyzedCount: freshRecords.length,
      createdAt: now,
      updatedAt: now,
      isSynthetic: true,
    };

    const remainingDatasets = datasets.filter((d) => d.id !== SAMPLE_DATASET_ID);
    const remainingRecords = allRecords.filter((r) => r.datasetId !== SAMPLE_DATASET_ID);

    setDatasets([newDataset, ...remainingDatasets]);
    setAllRecords([...freshRecords, ...remainingRecords]);
    setActiveDatasetId(SAMPLE_DATASET_ID);
  };

  // Import CSV Records
  const importCsvDataset = async (
    name: string,
    fileName: string,
    rawRecords: Array<Omit<FeedbackRecord, "id" | "datasetId" | "createdAt" | "analysis">>
  ): Promise<string> => {
    const datasetId = `dataset-${Date.now()}`;
    const now = new Date().toISOString();

    const formattedRecords: FeedbackRecord[] = rawRecords.map((r, index) => ({
      id: `rec-${datasetId}-${index + 1}`,
      datasetId,
      text: r.text,
      date: r.date || now.split("T")[0],
      segment: r.segment || "Unspecified",
      product: r.product || "General",
      source: r.source || "CSV Import",
      rating: r.rating ?? null,
      metadata: r.metadata || {},
      createdAt: now,
      analysis: null,
    }));

    const newDataset: Dataset = {
      id: datasetId,
      name,
      fileName,
      rowCount: formattedRecords.length,
      analyzedCount: 0,
      createdAt: now,
      updatedAt: now,
      isSynthetic: false,
    };

    setDatasets((prev) => [newDataset, ...prev]);
    setAllRecords((prev) => [...formattedRecords, ...prev]);
    setActiveDatasetId(datasetId);

    return datasetId;
  };

  // Delete a dataset
  const deleteDataset = (id: string) => {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    setAllRecords((prev) => prev.filter((r) => r.datasetId !== id));
    if (activeDatasetId === id) {
      const remaining = datasets.filter((d) => d.id !== id);
      setActiveDatasetId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Run AI analysis on dataset records
  const runAnalysisOnDataset = async (targetDatasetId?: string) => {
    const targetId = targetDatasetId || activeDatasetId;
    if (!targetId) return;

    const datasetRecords = allRecords.filter((r) => r.datasetId === targetId);
    if (datasetRecords.length === 0) return;

    setAnalysisProgress({
      isAnalyzing: true,
      total: datasetRecords.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentBatch: 0,
      activeModel: modelSettings.apiKey ? modelSettings.primaryModel : "PulseIQ Deterministic NLP",
    });

    try {
      const analyzed = await analyzeFeedbackRecords(datasetRecords, {
        apiKey: modelSettings.apiKey,
        primaryModel: modelSettings.primaryModel,
        fallbackModels: [modelSettings.fallbackModel1, modelSettings.fallbackModel2],
        timeoutMs: modelSettings.timeoutMs,
        onProgress: (processed, total, currentModel) => {
          setAnalysisProgress((prev) => ({
            ...prev,
            processed,
            succeeded: processed,
            currentBatch: Math.ceil(processed / modelSettings.batchSize),
            activeModel: currentModel,
          }));
        },
      });

      // Update records
      const analyzedMap = new Map<string, FeedbackRecord>();
      analyzed.forEach((r) => analyzedMap.set(r.id, r));

      setAllRecords((prev) =>
        prev.map((r) => (analyzedMap.has(r.id) ? analyzedMap.get(r.id)! : r))
      );

      // Update dataset analyzedCount
      setDatasets((prev) =>
        prev.map((d) =>
          d.id === targetId
            ? {
                ...d,
                analyzedCount: analyzed.filter((r) => r.analysis).length,
                updatedAt: new Date().toISOString(),
              }
            : d
        )
      );

      setAnalysisProgress((prev) => ({
        ...prev,
        isAnalyzing: false,
        processed: datasetRecords.length,
        succeeded: datasetRecords.length,
      }));
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setAnalysisProgress((prev) => ({
        ...prev,
        isAnalyzing: false,
        errorMessage: err.message || "Analysis request failed",
      }));
    }
  };

  const recomputeArtifacts = () => {
    // Triggers memo recalculation
    setAllRecords((prev) => [...prev]);
  };

  const updateModelSettings = (newSettings: Partial<ModelSettings>) => {
    setModelSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const clearAllData = () => {
    setDatasets([]);
    setAllRecords([]);
    setActiveDatasetId(null);
    localStorage.removeItem(STORAGE_KEY_DATASETS);
    localStorage.removeItem(STORAGE_KEY_RECORDS);
  };

  const exportDataAsCsv = (type: "feedback" | "themes" | "features" | "insights") => {
    let csvContent = "";
    let fileName = `pulseiq_${type}_${Date.now()}.csv`;

    if (type === "feedback") {
      const headers = [
        "ID",
        "Date",
        "Segment",
        "Product",
        "Source",
        "Rating",
        "Sentiment",
        "SentimentScore",
        "Category",
        "PainPoint",
        "FeatureRequest",
        "FeedbackText",
      ];
      const rows = activeRecords.map((r) => [
        `"${r.id}"`,
        `"${r.date || ""}"`,
        `"${r.segment || ""}"`,
        `"${r.product || ""}"`,
        `"${r.source || ""}"`,
        r.rating ?? "",
        `"${r.analysis?.sentiment || ""}"`,
        r.analysis?.sentimentScore ?? "",
        `"${r.analysis?.primaryCategory || ""}"`,
        `"${(r.analysis?.painPoint || "").replace(/"/g, '""')}"`,
        `"${(r.analysis?.featureRequest || "").replace(/"/g, '""')}"`,
        `"${(r.text || "").replace(/"/g, '""')}"`,
      ]);
      csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    } else if (type === "themes") {
      const headers = [
        "ThemeName",
        "Category",
        "Frequency",
        "PositiveCount",
        "NeutralCount",
        "NegativeCount",
        "GrowthTrend",
        "Description",
      ];
      const rows = themes.map((t) => [
        `"${t.name.replace(/"/g, '""')}"`,
        `"${t.category}"`,
        t.frequency,
        t.sentimentBreakdown.positive,
        t.sentimentBreakdown.neutral,
        t.sentimentBreakdown.negative,
        `"${t.growthTrend}"`,
        `"${t.description.replace(/"/g, '""')}"`,
      ]);
      csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    } else if (type === "features") {
      const headers = [
        "FeatureTitle",
        "Mentions",
        "ProductArea",
        "PriorityScore",
        "AvgSentiment",
        "AffectedSegments",
        "IsExplicit",
        "Description",
      ];
      const rows = features.map((f) => [
        `"${f.normalizedTitle.replace(/"/g, '""')}"`,
        f.mentionCount,
        `"${f.productArea}"`,
        f.priorityScore,
        f.sentimentScore,
        `"${f.affectedSegments.join("; ")}"`,
        f.isExplicit ? "Yes" : "No",
        `"${f.description.replace(/"/g, '""')}"`,
      ]);
      csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    } else if (type === "insights") {
      const headers = [
        "Type",
        "Title",
        "MetricSummary",
        "Explanation",
        "Confidence",
        "Hypothesis",
        "SuggestedAction",
      ];
      const rows = insights.map((i) => [
        `"${i.type}"`,
        `"${i.title.replace(/"/g, '""')}"`,
        `"${i.metricSummary.replace(/"/g, '""')}"`,
        `"${i.explanation.replace(/"/g, '""')}"`,
        `"${i.confidence}"`,
        `"${i.hypothesis.replace(/"/g, '""')}"`,
        `"${i.suggestedAction.replace(/"/g, '""')}"`,
      ]);
      csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DataStoreContext.Provider
      value={{
        datasets,
        activeDatasetId,
        activeDataset,
        records: activeRecords,
        themes,
        features,
        insights,
        modelSettings,
        analysisProgress,
        isReady,
        setActiveDatasetId,
        loadSyntheticSampleData,
        importCsvDataset,
        deleteDataset,
        runAnalysisOnDataset,
        recomputeArtifacts,
        updateModelSettings,
        exportDataAsCsv,
        clearAllData,
      }}
    >
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext);
  if (!ctx) {
    throw new Error("useDataStore must be used within a DataStoreProvider");
  }
  return ctx;
}
