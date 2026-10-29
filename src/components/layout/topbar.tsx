"use client";

import React, { useState } from "react";
import { useDataStore } from "@/lib/storage/data-store";
import { useTheme } from "@/lib/theme-context";
import {
  Search,
  Database,
  Calendar,
  Sparkles,
  ChevronDown,
  Bell,
  Sun,
  Moon,
  FileSpreadsheet,
  Download,
} from "lucide-react";

export function Topbar() {
  const {
    datasets,
    activeDatasetId,
    activeDataset,
    setActiveDatasetId,
    runAnalysisOnDataset,
    analysisProgress,
    loadSyntheticSampleData,
    exportDataAsCsv,
  } = useDataStore();

  const { theme, toggleTheme } = useTheme();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDatasetOpen, setIsDatasetOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState("Last 30 days");

  return (
    <div className="w-full flex items-center justify-between pb-6 shrink-0">
      {/* Left: Search Bar with Ctrl K Badge */}
      <div className="relative w-80 lg:w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 stroke-[1.75]" />
        <input
          type="text"
          placeholder="Search feedback, themes, or insights..."
          className="w-full text-xs bg-white dark:bg-[#16161a] border border-[#e8e7ec] dark:border-white/[0.08] rounded-xl pl-9 pr-14 py-2 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors"
        />
        <span className="absolute right-3 top-2 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 pointer-events-none">
          Ctrl K
        </span>
      </div>

      {/* Right: Controls & Actions Matching Reference Image */}
      <div className="flex items-center gap-3">
        {/* Dataset Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDatasetOpen(!isDatasetOpen)}
            className="h-9 px-3 bg-white dark:bg-[#16161a] border border-[#e8e7ec] dark:border-white/[0.08] rounded-xl flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-[2]" />
            <span className="truncate max-w-[140px]">
              {activeDataset?.name || "CloudPulse SaaS (Demo)"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDatasetOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDatasetOpen(false)}
              />
              <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-[#16161a] border border-[#e8e7ec] dark:border-white/[0.08] rounded-xl shadow-xl py-1 z-50 text-xs animate-in fade-in duration-100">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Dataset
                </div>
                {datasets.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setActiveDatasetId(d.id);
                      setIsDatasetOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-between ${
                      d.id === activeDatasetId
                        ? "text-indigo-600 font-semibold bg-indigo-50/50 dark:bg-indigo-500/10"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="truncate">{d.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {d.rowCount} records
                    </span>
                  </button>
                ))}
                {datasets.length === 0 && (
                  <button
                    onClick={() => {
                      loadSyntheticSampleData();
                      setIsDatasetOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-indigo-600 hover:bg-indigo-50 font-medium"
                  >
                    + Load Demo Dataset
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Date Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDateOpen(!isDateOpen)}
            className="h-9 px-3 bg-white dark:bg-[#16161a] border border-[#e8e7ec] dark:border-white/[0.08] rounded-xl flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{selectedDateFilter}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDateOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDateOpen(false)}
              />
              <div className="absolute right-0 mt-1.5 w-40 bg-white dark:bg-[#16161a] border border-[#e8e7ec] dark:border-white/[0.08] rounded-xl shadow-xl py-1 z-50 text-xs animate-in fade-in duration-100">
                {["Last 7 days", "Last 30 days", "Last 3 months", "Last 12 months", "All Time"].map(
                  (range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setSelectedDateFilter(range);
                        setIsDateOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-white/5 ${
                        selectedDateFilter === range
                          ? "text-indigo-600 font-semibold"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {range}
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </div>

        {/* Black "✦ Analyze" Button */}
        <button
          onClick={() => runAnalysisOnDataset()}
          disabled={analysisProgress.isAnalyzing}
          className="h-9 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
        >
          {analysisProgress.isAnalyzing ? (
            <span>Analyzing...</span>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 stroke-[2]" />
              <span>Analyze</span>
            </>
          )}
        </button>

        {/* Bell Notification Icon with Red Dot */}
        <button
          title="Notifications"
          className="w-9 h-9 rounded-xl bg-white dark:bg-[#16161a] border border-[#e8e7ec] dark:border-white/[0.08] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors relative shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
        >
          <Bell className="w-4 h-4 stroke-[1.75]" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white dark:ring-[#16161a]" />
        </button>

        {/* Theme Switcher (Moon / Sun) */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="w-9 h-9 rounded-xl bg-white dark:bg-[#16161a] border border-[#e8e7ec] dark:border-white/[0.08] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 stroke-[1.75]" />
          ) : (
            <Moon className="w-4 h-4 stroke-[1.75]" />
          )}
        </button>
      </div>
    </div>
  );
}
