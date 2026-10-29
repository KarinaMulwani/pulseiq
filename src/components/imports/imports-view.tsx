"use client";

import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { useDataStore } from "@/lib/storage/data-store";
import { ColumnMapping, FeedbackRecord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  Trash2,
  RefreshCw,
} from "lucide-react";

export function ImportsView() {
  const {
    datasets,
    activeDatasetId,
    setActiveDatasetId,
    importCsvDataset,
    deleteDataset,
    loadSyntheticSampleData,
    runAnalysisOnDataset,
  } = useDataStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawPreviewRows, setRawPreviewRows] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    idField: "",
    textField: "",
    dateField: "",
    segmentField: "",
    productField: "",
    sourceField: "",
    ratingField: "",
  });

  const [datasetName, setDatasetName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Handle file drop / select
  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setParseError("Please select a valid .csv file.");
      return;
    }

    setParseError(null);
    setIsParsing(true);
    setUploadedFile(file);
    setDatasetName(file.name.replace(/\.[^/.]+$/, ""));

    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      preview: 50,
      complete: (results) => {
        setIsParsing(false);
        if (results.errors.length > 0 && results.data.length === 0) {
          setParseError(`CSV Parsing error: ${results.errors[0].message}`);
          return;
        }

        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setRawPreviewRows(results.data);

        // Auto-detect columns intelligently
        const autoMap: ColumnMapping = {
          idField: "",
          textField: "",
          dateField: "",
          segmentField: "",
          productField: "",
          sourceField: "",
          ratingField: "",
        };

        headers.forEach((h) => {
          const lower = h.toLowerCase().trim();
          if (["id", "feedback_id", "ticket_id", "uuid", "record_id"].includes(lower)) {
            autoMap.idField = h;
          } else if (
            [
              "text",
              "feedback",
              "review",
              "content",
              "comment",
              "body",
              "message",
              "description",
            ].some((k) => lower.includes(k))
          ) {
            if (!autoMap.textField) autoMap.textField = h;
          } else if (["date", "created_at", "timestamp", "submission_date"].some((k) => lower.includes(k))) {
            autoMap.dateField = h;
          } else if (["segment", "tier", "plan", "cohort", "account_type"].some((k) => lower.includes(k))) {
            autoMap.segmentField = h;
          } else if (["product", "feature", "module", "area", "component"].some((k) => lower.includes(k))) {
            autoMap.productField = h;
          } else if (["source", "channel", "platform", "origin", "type"].some((k) => lower.includes(k))) {
            autoMap.sourceField = h;
          } else if (["rating", "score", "stars", "csat", "nps"].some((k) => lower.includes(k))) {
            autoMap.ratingField = h;
          }
        });

        // If textField not detected by keyword, automatically pick column with longest text
        if (!autoMap.textField && headers.length > 0 && results.data.length > 0) {
          let bestHeader = headers[0];
          let maxLen = 0;
          headers.forEach((h) => {
            const avgLen = results.data.reduce((acc: number, row: any) => acc + (String(row[h] || "").length), 0);
            if (avgLen > maxLen) {
              maxLen = avgLen;
              bestHeader = h;
            }
          });
          autoMap.textField = bestHeader;
        }

        // If dateField not detected by keyword, detect date formatted column
        if (!autoMap.dateField && headers.length > 0) {
          const dateMatch = headers.find((h) => {
            const firstRow = results.data[0] as Record<string, any> | undefined;
            const sample = firstRow?.[h];
            return sample && !isNaN(Date.parse(sample)) && String(sample).length >= 8;
          });
          if (dateMatch) autoMap.dateField = dateMatch;
        }

        if (!autoMap.idField && headers.length > 0) {
          autoMap.idField = headers[0];
        }

        setColumnMapping(autoMap);
      },
      error: (err) => {
        setIsParsing(false);
        setParseError(`Failed to parse CSV: ${err.message}`);
      },
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleCommitImport = () => {
    if (!uploadedFile) return;
    if (!columnMapping.textField) {
      setParseError("Please select which column contains the Feedback Text.");
      return;
    }

    setIsParsing(true);
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: "greedy",
      complete: async (results) => {
        const rows: any[] = results.data;
        const validRecords: Array<Omit<FeedbackRecord, "id" | "datasetId" | "createdAt" | "analysis">> = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const text = (row[columnMapping.textField] || "").trim();
          if (!text) continue;

          const date = columnMapping.dateField ? row[columnMapping.dateField] : undefined;
          const segment = columnMapping.segmentField ? row[columnMapping.segmentField] : undefined;
          const product = columnMapping.productField ? row[columnMapping.productField] : undefined;
          const source = columnMapping.sourceField ? row[columnMapping.sourceField] : undefined;
          const rawRating = columnMapping.ratingField ? parseFloat(row[columnMapping.ratingField]) : null;
          const rating = isNaN(rawRating as any) ? null : rawRating;

          validRecords.push({
            text,
            date,
            segment,
            product,
            source,
            rating,
            metadata: row,
          });
        }

        if (validRecords.length === 0) {
          setIsParsing(false);
          setParseError("No valid rows with feedback text were found in the CSV.");
          return;
        }

        const newId = await importCsvDataset(
          datasetName || uploadedFile.name,
          uploadedFile.name,
          validRecords
        );

        setIsParsing(false);
        setUploadedFile(null);
        setRawPreviewRows([]);
        setCsvHeaders([]);

        runAnalysisOnDataset(newId);
      },
      error: (err) => {
        setIsParsing(false);
        setParseError(`Import failed: ${err.message}`);
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Data Imports
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {datasets.length} datasets available
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => loadSyntheticSampleData()}
          className="text-xs font-normal"
        >
          Load Benchmark Dataset
        </Button>
      </div>

      {/* CSV Drag & Drop Uploader */}
      {!uploadedFile ? (
        <div
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="apple-glass rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 hover:border-black/10 dark:hover:border-white/15 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            accept=".csv"
            className="hidden"
          />

          <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] text-neutral-700 dark:text-neutral-300 flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-105">
            <UploadCloud className="w-5 h-5 stroke-[1.5]" />
          </div>

          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">
            Drop your feedback CSV here
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-4">
            Supports Zendesk tickets, G2 reviews, CSAT surveys, or user interviews.
          </p>

          <Button size="sm" variant="secondary" className="text-xs pointer-events-none font-normal">
            Choose CSV File
          </Button>
        </div>
      ) : (
        /* Column Mapping & Preview View */
        <Card className="animate-in fade-in duration-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Map CSV Columns</CardTitle>
                <CardDescription>
                  {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setUploadedFile(null);
                  setRawPreviewRows([]);
                }}
                className="text-xs text-neutral-500 dark:text-neutral-400"
              >
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {parseError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Dataset Name Input */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Dataset Name
              </label>
              <input
                type="text"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                placeholder="e.g. Q3 Feedback"
                className="w-full sm:w-80 text-xs backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3 py-2 focus:outline-none text-neutral-900 dark:text-neutral-100"
              />
            </div>

            {/* Column Mapping Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
              {/* Feedback Text (Required) */}
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-1">
                  Feedback Text <span className="text-rose-500">*</span>
                </label>
                <select
                  value={columnMapping.textField}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, textField: e.target.value })
                  }
                  className="w-full text-xs backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 focus:outline-none text-neutral-800 dark:text-neutral-200"
                >
                  <option value="" className="dark:bg-neutral-900">Select column...</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h} className="dark:bg-neutral-900">
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-1">
                  Submission Date
                </label>
                <select
                  value={columnMapping.dateField || ""}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, dateField: e.target.value })
                  }
                  className="w-full text-xs backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 focus:outline-none text-neutral-700 dark:text-neutral-300"
                >
                  <option value="" className="dark:bg-neutral-900">(None)</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h} className="dark:bg-neutral-900">
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Segment */}
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-1">
                  Customer Segment
                </label>
                <select
                  value={columnMapping.segmentField || ""}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, segmentField: e.target.value })
                  }
                  className="w-full text-xs backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 focus:outline-none text-neutral-700 dark:text-neutral-300"
                >
                  <option value="" className="dark:bg-neutral-900">(None)</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h} className="dark:bg-neutral-900">
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product */}
              <div>
                <label className="block text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-1">
                  Module / Area
                </label>
                <select
                  value={columnMapping.productField || ""}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, productField: e.target.value })
                  }
                  className="w-full text-xs backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 focus:outline-none text-neutral-700 dark:text-neutral-300"
                >
                  <option value="" className="dark:bg-neutral-900">(None)</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h} className="dark:bg-neutral-900">
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Commit Import Button */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.05]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUploadedFile(null);
                  setRawPreviewRows([]);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCommitImport}
                disabled={!columnMapping.textField || isParsing}
                isLoading={isParsing}
              >
                Import & Analyze
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dataset Manager Table */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Datasets</CardTitle>
          <CardDescription>Switch between imported sets or manage them</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {datasets.length > 0 ? (
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {datasets.map((dataset) => {
                const isActive = dataset.id === activeDatasetId;
                return (
                  <div
                    key={dataset.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isActive
                        ? "bg-black/[0.02] dark:bg-white/[0.03]"
                        : "hover:bg-black/[0.01] dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-md bg-black/[0.04] dark:bg-white/[0.08] text-neutral-600 dark:text-neutral-400">
                        <FileSpreadsheet className="w-4 h-4 stroke-[1.5]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                            {dataset.name}
                          </h4>
                          {isActive && (
                            <Badge variant="secondary" className="text-[10px]">
                              Active
                            </Badge>
                          )}
                          {dataset.isSynthetic && (
                            <Badge variant="outline" className="text-[10px]">
                              Benchmark
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {dataset.rowCount} records · {dataset.analyzedCount} analyzed ·{" "}
                          {formatDate(dataset.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setActiveDatasetId(dataset.id)}
                          className="h-8 text-xs font-normal"
                        >
                          Select
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => runAnalysisOnDataset(dataset.id)}
                        className="h-8 text-xs font-normal text-neutral-700 dark:text-neutral-300"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1 stroke-[1.5]" />
                        Re-Analyze
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDeleteId(dataset.id)}
                        className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-neutral-400 text-xs">
              No datasets yet. Upload a CSV or load the benchmark.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <Modal
          isOpen={Boolean(confirmDeleteId)}
          onClose={() => setConfirmDeleteId(null)}
          title="Delete Dataset"
          description="Are you sure you want to remove this dataset?"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs text-neutral-600 dark:text-neutral-300">
            <p>
              This action will permanently delete all records, themes, feature requests,
              and insights associated with this dataset.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
              <Button size="sm" variant="secondary" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  deleteDataset(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
