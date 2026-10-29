"use client";

import React, { useState, useMemo } from "react";
import { useDataStore } from "@/lib/storage/data-store";
import { FeedbackRecord } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function FeedbackExplorer() {
  const { records, exportDataAsCsv } = useDataStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSegment, setSelectedSegment] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const [inspectRecord, setInspectRecord] = useState<FeedbackRecord | null>(null);

  // Extract unique options
  const categories = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.analysis?.primaryCategory) set.add(r.analysis.primaryCategory);
    });
    return Array.from(set).sort();
  }, [records]);

  const segments = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.segment) set.add(r.segment);
    });
    return Array.from(set).sort();
  }, [records]);

  // Filter
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = r.text.toLowerCase().includes(q);
        const matchExp = r.analysis?.explanation?.toLowerCase().includes(q);
        const matchPp = r.analysis?.painPoint?.toLowerCase().includes(q);
        const matchFr = r.analysis?.featureRequest?.toLowerCase().includes(q);
        if (!matchText && !matchExp && !matchPp && !matchFr) return false;
      }

      if (selectedSentiment !== "all") {
        if (r.analysis?.sentiment !== selectedSentiment) return false;
      }

      if (selectedCategory !== "all") {
        if (r.analysis?.primaryCategory !== selectedCategory) return false;
      }

      if (selectedSegment !== "all") {
        if (r.segment !== selectedSegment) return false;
      }

      return true;
    });
  }, [records, searchQuery, selectedSentiment, selectedCategory, selectedSegment]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Feedback
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {filteredRecords.length} customer submissions
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => exportDataAsCsv("feedback")}
          className="text-xs gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Clean Apple Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-3 stroke-[1.5]" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 focus:outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedSentiment}
            onChange={(e) => {
              setSelectedSentiment(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 focus:outline-none"
          >
            <option value="all" className="dark:bg-neutral-900">All Sentiments</option>
            <option value="positive" className="dark:bg-neutral-900">Positive</option>
            <option value="neutral" className="dark:bg-neutral-900">Neutral</option>
            <option value="negative" className="dark:bg-neutral-900">Negative</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 focus:outline-none"
          >
            <option value="all" className="dark:bg-neutral-900">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c} className="dark:bg-neutral-900">
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedSegment}
            onChange={(e) => {
              setSelectedSegment(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 focus:outline-none"
          >
            <option value="all" className="dark:bg-neutral-900">All Segments</option>
            {segments.map((s) => (
              <option key={s} value={s} className="dark:bg-neutral-900">
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clean Apple Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/[0.04] dark:border-white/[0.06] text-neutral-400 dark:text-neutral-500 font-medium text-[11px]">
                <th className="py-3 px-5 w-24">Sentiment</th>
                <th className="py-3 px-5">Feedback</th>
                <th className="py-3 px-5 w-36">Category</th>
                <th className="py-3 px-5 w-28">Segment</th>
                <th className="py-3 px-5 w-24">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((r) => {
                  const s = r.analysis?.sentiment || "neutral";
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setInspectRecord(r)}
                      className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <Badge
                          variant={
                            s === "positive"
                              ? "success"
                              : s === "negative"
                              ? "danger"
                              : "secondary"
                          }
                          className="capitalize text-[10px]"
                        >
                          {s}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-5 max-w-md">
                        <p className="text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-relaxed">
                          {r.text}
                        </p>
                      </td>

                      <td className="py-3.5 px-5 whitespace-nowrap text-neutral-700 dark:text-neutral-300">
                        {r.analysis?.primaryCategory || "—"}
                      </td>

                      <td className="py-3.5 px-5 whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                        {r.segment || "—"}
                      </td>

                      <td className="py-3.5 px-5 whitespace-nowrap text-neutral-400 dark:text-neutral-500 font-mono text-[11px]">
                        {formatDate(r.date)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Clean Minimalist Pagination */}
        <div className="px-5 py-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
          <div>
            {filteredRecords.length} records · Page {currentPage} of {totalPages}
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Clean Detail Record Modal */}
      {inspectRecord && (
        <Modal
          isOpen={Boolean(inspectRecord)}
          onClose={() => setInspectRecord(null)}
          title="Feedback Record"
          description={`ID: ${inspectRecord.id}`}
          maxWidth="xl"
        >
          <div className="space-y-5 text-xs">
            <div className="p-4 backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.05] rounded-2xl border border-black/[0.05] dark:border-white/[0.08] text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed">
              &ldquo;{inspectRecord.text}&rdquo;
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 text-neutral-600 dark:text-neutral-400">
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Segment</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {inspectRecord.segment || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Product</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {inspectRecord.product || "General"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Date</span>
                <span className="font-mono text-neutral-900 dark:text-neutral-100">
                  {formatDate(inspectRecord.date)}
                </span>
              </div>
            </div>

            {inspectRecord.analysis && (
              <div className="space-y-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      inspectRecord.analysis.sentiment === "positive"
                        ? "success"
                        : inspectRecord.analysis.sentiment === "negative"
                        ? "danger"
                        : "secondary"
                    }
                    className="capitalize"
                  >
                    {inspectRecord.analysis.sentiment}
                  </Badge>
                  <span className="font-mono text-neutral-400">
                    Score: {inspectRecord.analysis.sentimentScore}
                  </span>
                  <span className="text-neutral-500">· {inspectRecord.analysis.primaryCategory}</span>
                </div>

                {inspectRecord.analysis.painPoint && (
                  <div className="p-3 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                    <span className="font-semibold block text-[10px] uppercase">Friction</span>
                    <p className="mt-0.5">{inspectRecord.analysis.painPoint}</p>
                  </div>
                )}

                {inspectRecord.analysis.featureRequest && (
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    <span className="font-semibold block text-[10px] uppercase">Feature Request</span>
                    <p className="mt-0.5">{inspectRecord.analysis.featureRequest}</p>
                  </div>
                )}

                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed pt-1">
                  {inspectRecord.analysis.explanation}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
