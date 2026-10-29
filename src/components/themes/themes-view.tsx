"use client";

import React, { useState, useMemo } from "react";
import { useDataStore } from "@/lib/storage/data-store";
import { DiscoveredTheme } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import { Download, ChevronRight } from "lucide-react";

export function ThemesView() {
  const { themes, records, exportDataAsCsv } = useDataStore();

  const [sortBy, setSortBy] = useState<"frequency" | "negative" | "growth">("frequency");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeThemeForModal, setActiveThemeForModal] = useState<DiscoveredTheme | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    themes.forEach((t) => set.add(t.category));
    return Array.from(set).sort();
  }, [themes]);

  // Sort and filter themes
  const processedThemes = useMemo(() => {
    return themes
      .filter((t) => {
        if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "frequency") {
          return b.frequency - a.frequency;
        } else if (sortBy === "negative") {
          const negRatioA = a.frequency > 0 ? a.sentimentBreakdown.negative / a.frequency : 0;
          const negRatioB = b.frequency > 0 ? b.sentimentBreakdown.negative / b.frequency : 0;
          return negRatioB - negRatioA;
        } else if (sortBy === "growth") {
          const rank = { increasing: 3, stable: 2, decreasing: 1 };
          return rank[b.growthTrend] - rank[a.growthTrend];
        }
        return 0;
      });
  }, [themes, sortBy, selectedCategory]);

  // Records belonging to modal theme
  const modalRecords = useMemo(() => {
    if (!activeThemeForModal) return [];
    const idSet = new Set(activeThemeForModal.feedbackIds);
    return records.filter((r) => idSet.has(r.id));
  }, [activeThemeForModal, records]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Themes
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {themes.length} semantic clusters discovered
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => exportDataAsCsv("themes")}
          className="text-xs gap-1.5 self-start sm:self-auto font-normal"
        >
          <Download className="w-3.5 h-3.5 stroke-[1.75]" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Clean Apple Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-neutral-800 dark:text-neutral-200 focus:outline-none"
          >
            <option value="all" className="dark:bg-neutral-900">All Categories ({themes.length})</option>
            {categories.map((c) => (
              <option key={c} value={c} className="dark:bg-neutral-900">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Minimalist Segmented Sorter */}
        <div className="inline-flex rounded-xl backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/[0.08] p-0.5 text-xs">
          <button
            onClick={() => setSortBy("frequency")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              sortBy === "frequency"
                ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-xs font-semibold"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            Most Frequent
          </button>
          <button
            onClick={() => setSortBy("negative")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              sortBy === "negative"
                ? "bg-white dark:bg-white/15 text-rose-600 dark:text-rose-400 shadow-xs font-semibold"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            High Friction
          </button>
          <button
            onClick={() => setSortBy("growth")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              sortBy === "growth"
                ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-xs font-semibold"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            Trending
          </button>
        </div>
      </div>

      {/* Themes Grid */}
      {processedThemes.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-neutral-300 dark:border-neutral-800">
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            No semantic themes discovered yet
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Click &quot;Analyze Feedback&quot; in the top navigation to run NVIDIA AI clustering on your records.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {processedThemes.map((theme) => {
            const totalRecords = theme.frequency || 1;
            const posPct = Math.round((theme.sentimentBreakdown.positive / totalRecords) * 100);
            const neuPct = Math.round((theme.sentimentBreakdown.neutral / totalRecords) * 100);
            const negPct = Math.round((theme.sentimentBreakdown.negative / totalRecords) * 100);

            return (
              <Card
                key={theme.id}
                className="flex flex-col justify-between hover:border-black/10 dark:hover:border-white/15 transition-all"
              >
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      {theme.category}
                    </span>
                    <h3 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                      {theme.name}
                    </h3>
                  </div>

                  <Badge
                    variant={
                      theme.growthTrend === "increasing"
                        ? "danger"
                        : theme.growthTrend === "decreasing"
                        ? "success"
                        : "secondary"
                    }
                    className="capitalize text-[10px] shrink-0"
                  >
                    {theme.growthTrend}
                  </Badge>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {theme.description}
                </p>

                {/* Subtle Sentiment Distribution Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                    <span>{theme.frequency} submissions</span>
                    <span className="text-[11px] font-mono">
                      {posPct}% pos · {negPct}% neg
                    </span>
                  </div>

                  {/* Clean 3px Bar */}
                  <div className="w-full h-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] flex overflow-hidden">
                    {posPct > 0 && (
                      <div
                        style={{ width: `${posPct}%` }}
                        className="bg-emerald-500 h-full"
                        title={`Positive: ${posPct}%`}
                      />
                    )}
                    {neuPct > 0 && (
                      <div
                        style={{ width: `${neuPct}%` }}
                        className="bg-neutral-300 dark:bg-neutral-600 h-full"
                        title={`Neutral: ${neuPct}%`}
                      />
                    )}
                    {negPct > 0 && (
                      <div
                        style={{ width: `${negPct}%` }}
                        className="bg-rose-500 h-full"
                        title={`Negative: ${negPct}%`}
                      />
                    )}
                  </div>
                </div>

                {/* Representative Verbatim Quote */}
                {theme.representativeQuotes.length > 0 && (
                  <div className="backdrop-blur-xl bg-black/[0.02] dark:bg-white/[0.03] p-3.5 rounded-xl border border-black/[0.04] dark:border-white/[0.05] space-y-1">
                    <p className="text-xs italic text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      &ldquo;{theme.representativeQuotes[0].quote}&rdquo;
                    </p>
                    {theme.representativeQuotes[0].segment && (
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block">
                        {theme.representativeQuotes[0].segment}
                      </span>
                    )}
                  </div>
                )}

                {/* Customer Segment Distribution Pills */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  {Object.entries(theme.segmentBreakdown).map(([segment, count]) => (
                    <span
                      key={segment}
                      className="text-[10px] px-2 py-0.5 rounded-md backdrop-blur-md bg-black/[0.03] dark:bg-white/[0.05] text-neutral-600 dark:text-neutral-400 font-medium"
                    >
                      {segment} ({count})
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-xs">
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                  {theme.firstSeenDate && formatDate(theme.firstSeenDate)} -{" "}
                  {theme.lastSeenDate && formatDate(theme.lastSeenDate)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setActiveThemeForModal(theme)}
                  className="text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white gap-1 h-7 px-2 font-normal"
                >
                  <span>Inspect ({theme.frequency})</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[1.5]" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      )}

      {/* Theme Records Modal */}
      {activeThemeForModal && (
        <Modal
          isOpen={Boolean(activeThemeForModal)}
          onClose={() => setActiveThemeForModal(null)}
          title={activeThemeForModal.name}
          description={`${modalRecords.length} records in ${activeThemeForModal.category}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05] max-h-[60vh] overflow-y-auto pr-1">
              {modalRecords.map((r) => (
                <div key={r.id} className="py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          r.analysis?.sentiment === "positive"
                            ? "success"
                            : r.analysis?.sentiment === "negative"
                            ? "danger"
                            : "secondary"
                        }
                        className="text-[10px] capitalize"
                      >
                        {r.analysis?.sentiment || "neutral"}
                      </Badge>
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

                  {r.analysis?.painPoint && (
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      <span className="text-neutral-500 dark:text-neutral-400">Friction:</span>{" "}
                      {r.analysis.painPoint}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setActiveThemeForModal(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
