"use client";

import React, { useState, useMemo } from "react";
import { useDataStore } from "@/lib/storage/data-store";
import { MinedFeatureRequest } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import { Download, ChevronRight } from "lucide-react";

export function FeaturesView() {
  const { features, records, exportDataAsCsv } = useDataStore();

  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "explicit" | "inferred">("all");
  const [sortBy, setSortBy] = useState<"mentions" | "priority" | "date">("priority");
  const [activeFeatureForModal, setActiveFeatureForModal] = useState<MinedFeatureRequest | null>(
    null
  );

  // Extract unique product areas
  const productAreas = useMemo(() => {
    const set = new Set<string>();
    features.forEach((f) => set.add(f.productArea));
    return Array.from(set).sort();
  }, [features]);

  // Filter and sort features
  const processedFeatures = useMemo(() => {
    return features
      .filter((f) => {
        if (filterArea !== "all" && f.productArea !== filterArea) return false;
        if (filterType === "explicit" && !f.isExplicit) return false;
        if (filterType === "inferred" && f.isExplicit) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          return b.priorityScore - a.priorityScore;
        } else if (sortBy === "mentions") {
          return b.mentionCount - a.mentionCount;
        } else if (sortBy === "date") {
          return (b.latestSeenDate || "") > (a.latestSeenDate || "") ? 1 : -1;
        }
        return 0;
      });
  }, [features, filterArea, filterType, sortBy]);

  // Supporting records for modal
  const modalRecords = useMemo(() => {
    if (!activeFeatureForModal) return [];
    const idSet = new Set(activeFeatureForModal.feedbackIds);
    return records.filter((r) => idSet.has(r.id));
  }, [activeFeatureForModal, records]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Feature Requests
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {features.length} opportunities mined from feedback
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => exportDataAsCsv("features")}
          className="text-xs gap-1.5 self-start sm:self-auto font-normal"
        >
          <Download className="w-3.5 h-3.5 stroke-[1.75]" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Clean Apple Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="text-xs backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-neutral-800 dark:text-neutral-200 focus:outline-none"
          >
            <option value="all" className="dark:bg-neutral-900">All Modules ({features.length})</option>
            {productAreas.map((area) => (
              <option key={area} value={area} className="dark:bg-neutral-900">
                {area}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e: any) => setFilterType(e.target.value)}
            className="text-xs backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-neutral-800 dark:text-neutral-200 focus:outline-none"
          >
            <option value="all" className="dark:bg-neutral-900">All Requests</option>
            <option value="explicit" className="dark:bg-neutral-900">Explicit Requests</option>
            <option value="inferred" className="dark:bg-neutral-900">Inferred Opportunities</option>
          </select>
        </div>

        {/* Minimalist Segmented Sorter */}
        <div className="inline-flex rounded-xl backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/[0.08] p-0.5 text-xs">
          <button
            onClick={() => setSortBy("priority")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              sortBy === "priority"
                ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-xs font-semibold"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            Priority
          </button>
          <button
            onClick={() => setSortBy("mentions")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              sortBy === "mentions"
                ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-xs font-semibold"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            Demand
          </button>
          <button
            onClick={() => setSortBy("date")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              sortBy === "date"
                ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-xs font-semibold"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            Recent
          </button>
        </div>
      </div>

      {/* Feature Request Cards */}
      {processedFeatures.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-neutral-300 dark:border-neutral-800">
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            No feature requests mined yet
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Click &quot;Analyze Feedback&quot; in the top navigation to extract feature opportunities with NVIDIA AI.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {processedFeatures.map((feat) => {
            return (
              <Card
                key={feat.id}
                className="flex flex-col justify-between hover:border-black/10 dark:hover:border-white/15 transition-all"
              >
              <div className="p-6 space-y-4">
                {/* Header & Priority Number */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        {feat.productArea}
                      </span>
                      <Badge
                        variant={feat.isExplicit ? "secondary" : "outline"}
                        className="text-[10px]"
                      >
                        {feat.isExplicit ? "Explicit" : "Inferred"}
                      </Badge>
                    </div>

                    <h3 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                      {feat.normalizedTitle}
                    </h3>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                      {feat.priorityScore}
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                      Priority
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {feat.description}
                </p>

                {/* Evidence Stats Bar */}
                <div className="grid grid-cols-3 gap-2 py-2.5 px-3.5 backdrop-blur-md bg-black/[0.02] dark:bg-white/[0.03] rounded-xl border border-black/[0.04] dark:border-white/[0.05] text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block">
                      Demand
                    </span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {feat.mentionCount} mentions
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block">
                      Sentiment
                    </span>
                    <span
                      className={`font-medium ${
                        feat.sentimentScore < 0
                          ? "text-rose-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {feat.sentimentScore > 0 ? "+" : ""}
                      {feat.sentimentScore}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block">
                      Latest
                    </span>
                    <span className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                      {feat.latestSeenDate ? formatDate(feat.latestSeenDate) : "—"}
                    </span>
                  </div>
                </div>

                {/* Verbatim Supporting Quote */}
                {feat.representativeQuotes.length > 0 && (
                  <div className="backdrop-blur-xl bg-black/[0.02] dark:bg-white/[0.03] p-3.5 rounded-xl border border-black/[0.04] dark:border-white/[0.05] space-y-1">
                    <p className="text-xs italic text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      &ldquo;{feat.representativeQuotes[0].quote}&rdquo;
                    </p>
                    {feat.representativeQuotes[0].source && (
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block">
                        {feat.representativeQuotes[0].source}
                        {feat.representativeQuotes[0].segment ? ` · ${feat.representativeQuotes[0].segment}` : ""}
                      </span>
                    )}
                  </div>
                )}

                {/* Affected Segments */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  {feat.affectedSegments.map((segment) => (
                    <span
                      key={segment}
                      className="text-[10px] px-2 py-0.5 rounded-md backdrop-blur-md bg-black/[0.03] dark:bg-white/[0.05] text-neutral-600 dark:text-neutral-400 font-medium"
                    >
                      {segment}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-xs">
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  {feat.mentionCount} submissions
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setActiveFeatureForModal(feat)}
                  className="text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white gap-1 h-7 px-2 font-normal"
                >
                  <span>Statements</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[1.5]" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      )}

      {/* Feature Quotes Modal */}
      {activeFeatureForModal && (
        <Modal
          isOpen={Boolean(activeFeatureForModal)}
          onClose={() => setActiveFeatureForModal(null)}
          title={activeFeatureForModal.normalizedTitle}
          description={`${modalRecords.length} customer feedback entries`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05] max-h-[60vh] overflow-y-auto pr-1">
              {modalRecords.map((r) => (
                <div key={r.id} className="py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {r.segment}
                      </span>
                      <span className="text-neutral-400 dark:text-neutral-500">· {r.source}</span>
                    </div>
                    <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
                      {formatDate(r.date)}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed backdrop-blur-md bg-black/[0.02] dark:bg-white/[0.03] p-3 rounded-xl border border-black/[0.04] dark:border-white/[0.05]">
                    &ldquo;{r.text}&rdquo;
                  </p>

                  {r.analysis?.featureRequest && (
                    <div className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
                      <span className="text-neutral-400 dark:text-neutral-500">Extracted:</span>{" "}
                      {r.analysis.featureRequest}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setActiveFeatureForModal(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
