"use client";

import React, { useState } from "react";
import { useDataStore } from "@/lib/storage/data-store";
import { AIInsight } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, Check, FileText } from "lucide-react";

export function InsightsView() {
  const { insights, records, activeDataset, exportDataAsCsv } = useDataStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const filteredInsights = insights.filter((i) => {
    if (filterType !== "all" && i.type !== filterType) return false;
    return true;
  });

  const handleCopyInsight = (insight: AIInsight) => {
    const text = `[PulseIQ Insight] ${insight.title}
Evidence: ${insight.metricSummary}
Confidence: ${insight.confidence.toUpperCase()}
Hypothesis: ${insight.hypothesis}
Action: ${insight.suggestedAction}`;

    navigator.clipboard.writeText(text);
    setCopiedId(insight.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownloadExecutiveReport = () => {
    const markdown = `# PulseIQ Executive Product Intelligence Report
Generated: ${new Date().toLocaleDateString()}
Dataset: ${activeDataset?.name || "Active Dataset"}
Total Records Analyzed: ${records.length}

---

${insights
  .map(
    (ins, idx) => `## ${idx + 1}. ${ins.title}
**Category:** ${ins.type.replace(/_/g, " ").toUpperCase()}  
**Confidence Level:** ${ins.confidence.toUpperCase()}  

### Observed Evidence:
${ins.metricSummary}

### Context & Explanation:
${ins.explanation}

### Hypothesis to Validate:
${ins.hypothesis}

### Recommended Product Action:
${ins.suggestedAction}

### Supporting Customer Quotes:
${ins.evidenceQuotes.map((q) => `- "${q.quote}" (ID: ${q.feedbackId}, Segment: ${q.segment || "All"})`).join("\n")}

---
`
  )
  .join("\n")}
`;

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PulseIQ_Report_${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Insights
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {insights.length} data-backed intelligence insights
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleDownloadExecutiveReport}
            className="text-xs gap-1.5 font-normal"
          >
            <FileText className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>Download Report (MD)</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => exportDataAsCsv("insights")}
            className="text-xs gap-1.5 font-normal"
          >
            <Download className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Clean Apple Filter Bar */}
      <div className="inline-flex rounded-xl backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/[0.08] p-0.5 text-xs overflow-x-auto max-w-full">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            filterType === "all"
              ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-xs font-semibold"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
          }`}
        >
          All Insights ({insights.length})
        </button>
        <button
          onClick={() => setFilterType("trend")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            filterType === "trend"
              ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-xs font-semibold"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
          }`}
        >
          Friction Trends
        </button>
        <button
          onClick={() => setFilterType("segment_disparity")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            filterType === "segment_disparity"
              ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-xs font-semibold"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
          }`}
        >
          Segment Disparities
        </button>
        <button
          onClick={() => setFilterType("emerging_issue")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            filterType === "emerging_issue"
              ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-xs font-semibold"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
          }`}
        >
          Shifts
        </button>
        <button
          onClick={() => setFilterType("feature_opportunity")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            filterType === "feature_opportunity"
              ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-xs font-semibold"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
          }`}
        >
          Feature Demands
        </button>
      </div>

      {/* Insights Cards List */}
      {filteredInsights.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-neutral-300 dark:border-neutral-800">
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            No intelligence insights available yet
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Click &quot;Analyze Feedback&quot; to synthesize product opportunities and data-backed recommendations with NVIDIA AI.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {filteredInsights.map((insight) => (
            <Card key={insight.id} className="overflow-hidden hover:border-black/10 dark:hover:border-white/15 transition-all">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.04] dark:border-white/[0.05] pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    {insight.type.replace(/_/g, " ")}
                  </span>
                  <h3 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                    {insight.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize text-[10px]">
                    {insight.confidence} confidence
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyInsight(insight)}
                    className="h-7 px-2.5 text-xs gap-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 font-normal"
                  >
                    {copiedId === insight.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2]" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 stroke-[1.5]" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Observed Quantitative Proof */}
              <div className="backdrop-blur-md bg-black/[0.02] dark:bg-white/[0.03] p-4 rounded-xl border border-black/[0.04] dark:border-white/[0.05] space-y-1">
                <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
                  Observed Mathematical Evidence
                </span>
                <p className="text-xs font-mono font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed">
                  {insight.metricSummary}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 pt-1 leading-relaxed">
                  {insight.explanation}
                </p>
              </div>

              {/* Hypothesis & Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hypothesis Block */}
                <div className="backdrop-blur-md bg-black/[0.02] dark:bg-white/[0.03] p-4 rounded-xl border border-black/[0.04] dark:border-white/[0.05] space-y-1">
                  <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
                    Hypothesis to Validate
                  </span>
                  <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    {insight.hypothesis}
                  </p>
                </div>

                {/* Suggested Action Block */}
                <div className="backdrop-blur-md bg-black/[0.02] dark:bg-white/[0.03] p-4 rounded-xl border border-black/[0.04] dark:border-white/[0.05] space-y-1">
                  <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
                    Recommended Action
                  </span>
                  <p className="text-xs text-neutral-900 dark:text-neutral-100 font-medium leading-relaxed">
                    {insight.suggestedAction}
                  </p>
                </div>
              </div>

              {/* Supporting Customer Verbatim Evidence */}
              {insight.evidenceQuotes.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
                    Supporting Customer Quotes
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {insight.evidenceQuotes.map((q, idx) => (
                      <div
                        key={idx}
                        className="backdrop-blur-md bg-black/[0.015] dark:bg-white/[0.02] p-3 rounded-xl border border-black/[0.03] dark:border-white/[0.04] text-xs text-neutral-700 dark:text-neutral-300 italic space-y-1"
                      >
                        <p>&ldquo;{q.quote}&rdquo;</p>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 not-italic block font-mono">
                          ID: {q.feedbackId} {q.segment ? `· ${q.segment}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
        </div>
      )}
    </div>
  );
}
