"use client";

import React, { useMemo, useState } from "react";
import { useDataStore } from "@/lib/storage/data-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTheme } from "@/lib/theme-context";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { NavTab } from "@/components/layout/sidebar";
import { ChevronRight } from "lucide-react";

interface OverviewDashboardProps {
  onNavigate: (tab: NavTab) => void;
}

function getSparklinePath(values: number[], width = 56, height = 28): { path: string; area: string } {
  if (values.length === 0) return { path: "", area: "" };
  if (values.length === 1) {
    const y = height / 2;
    return {
      path: `M 2 ${y} L ${width - 2} ${y}`,
      area: `M 2 ${y} L ${width - 2} ${y} L ${width - 2} ${height} L 2 ${height} Z`,
    };
  }

  const max = Math.max(...values, 1);
  const min = 0;
  const range = max - min || 1;
  const step = (width - 4) / (values.length - 1);

  const points = values.map((v, i) => {
    const x = 2 + i * step;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return { x, y };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const first = points[0];
  const area = `${path} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`;

  return { path, area };
}

export function OverviewDashboard({ onNavigate }: OverviewDashboardProps) {
  const { records, themes, features, insights, loadSyntheticSampleData, runAnalysisOnDataset, analysisProgress } = useDataStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "3M" | "6M" | "1Y">("30D");

  // 1. Dynamic KPI Stats computed purely from loaded records
  const stats = useMemo(() => {
    const total = records.length;
    const analyzed = records.filter((r) => r.analysis);
    const positiveCount = analyzed.filter((r) => r.analysis?.sentiment === "positive").length;
    const neutralCount = analyzed.filter((r) => r.analysis?.sentiment === "neutral").length;
    const negativeCount = analyzed.filter((r) => r.analysis?.sentiment === "negative").length;
    const base = analyzed.length > 0 ? analyzed.length : 1;

    return {
      total,
      analyzedCount: analyzed.length,
      positiveCount,
      neutralCount,
      negativeCount,
      positivePct: analyzed.length > 0 ? Math.round((positiveCount / base) * 100) : 0,
      neutralPct: analyzed.length > 0 ? Math.round((neutralCount / base) * 100) : 0,
      negativePct: analyzed.length > 0 ? Math.round((negativeCount / base) * 100) : 0,
    };
  }, [records]);

  // 2. Dynamic Sentiment chart data
  const sentimentChartData = useMemo(() => {
    if (stats.analyzedCount === 0) {
      return [
        { name: "Awaiting Analysis", value: 100, color: isDark ? "#27272a" : "#e2e8f0" },
      ];
    }
    return [
      { name: "Positive", value: stats.positivePct, color: "#62a088" },
      { name: "Neutral", value: stats.neutralPct, color: isDark ? "#71717a" : "#b8b8b8" },
      { name: "Negative", value: stats.negativePct, color: "#c96f6f" },
    ];
  }, [stats, isDark]);

  // 3. Dynamic Volume Over Time computed based on selected timeRange & AI sentiment
  const volumeChartData = useMemo(() => {
    if (records.length === 0) return [];

    const parsedRecords = records.map((r) => {
      const rawDate = r.date || r.createdAt;
      const d = new Date(rawDate);
      const time = isNaN(d.getTime()) ? Date.now() : d.getTime();
      return {
        ...r,
        timestamp: time,
        sentiment: r.analysis?.sentiment || "neutral",
      };
    }).sort((a, b) => a.timestamp - b.timestamp);

    const maxTime = parsedRecords[parsedRecords.length - 1]?.timestamp || Date.now();
    const maxDate = new Date(maxTime);

    if (timeRange === "7D") {
      const days = 7;
      const result: Array<{ date: string; count: number; positive: number; neutral: number; negative: number }> = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(maxDate.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const dayRecords = parsedRecords.filter((r) => {
          const rDate = new Date(r.timestamp).toISOString().split("T")[0];
          return rDate === dayStr;
        });
        const pos = dayRecords.filter((r) => r.sentiment === "positive").length;
        const neg = dayRecords.filter((r) => r.sentiment === "negative").length;
        const neu = dayRecords.filter((r) => r.sentiment === "neutral").length;
        result.push({ date: label, count: dayRecords.length, positive: pos, neutral: neu, negative: neg });
      }
      return result;
    } else if (timeRange === "30D") {
      const days = 30;
      const result: Array<{ date: string; count: number; positive: number; neutral: number; negative: number }> = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(maxDate.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const dayRecords = parsedRecords.filter((r) => {
          const rDate = new Date(r.timestamp).toISOString().split("T")[0];
          return rDate === dayStr;
        });
        const pos = dayRecords.filter((r) => r.sentiment === "positive").length;
        const neg = dayRecords.filter((r) => r.sentiment === "negative").length;
        const neu = dayRecords.filter((r) => r.sentiment === "neutral").length;
        result.push({ date: label, count: dayRecords.length, positive: pos, neutral: neu, negative: neg });
      }
      return result;
    } else if (timeRange === "3M" || timeRange === "6M") {
      const weeks = timeRange === "3M" ? 12 : 24;
      const result: Array<{ date: string; count: number; positive: number; neutral: number; negative: number }> = [];
      for (let i = weeks - 1; i >= 0; i--) {
        const start = maxDate.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000;
        const end = maxDate.getTime() - i * 7 * 24 * 60 * 60 * 1000;
        const d = new Date(start);
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const bucketRecords = parsedRecords.filter((r) => r.timestamp >= start && r.timestamp < end);
        const pos = bucketRecords.filter((r) => r.sentiment === "positive").length;
        const neg = bucketRecords.filter((r) => r.sentiment === "negative").length;
        const neu = bucketRecords.filter((r) => r.sentiment === "neutral").length;
        result.push({ date: label, count: bucketRecords.length, positive: pos, neutral: neu, negative: neg });
      }
      return result;
    } else {
      // 1Y: 12 monthly buckets
      const result: Array<{ date: string; count: number; positive: number; neutral: number; negative: number }> = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(maxDate.getFullYear(), maxDate.getMonth() - i, 1);
        const nextMonth = new Date(maxDate.getFullYear(), maxDate.getMonth() - i + 1, 1);
        const label = d.toLocaleDateString("en-US", { month: "short" });
        const bucketRecords = parsedRecords.filter((r) => r.timestamp >= d.getTime() && r.timestamp < nextMonth.getTime());
        const pos = bucketRecords.filter((r) => r.sentiment === "positive").length;
        const neg = bucketRecords.filter((r) => r.sentiment === "negative").length;
        const neu = bucketRecords.filter((r) => r.sentiment === "neutral").length;
        result.push({ date: label, count: bucketRecords.length, positive: pos, neutral: neu, negative: neg });
      }
      return result;
    }
  }, [records, timeRange]);

  // Dynamic Sparklines for each KPI card generated from real timeline points
  const totalSpark = useMemo(() => getSparklinePath(volumeChartData.map((d) => d.count)), [volumeChartData]);
  const positiveSpark = useMemo(() => getSparklinePath(volumeChartData.map((d) => d.positive)), [volumeChartData]);
  const neutralSpark = useMemo(() => getSparklinePath(volumeChartData.map((d) => d.neutral)), [volumeChartData]);
  const negativeSpark = useMemo(() => getSparklinePath(volumeChartData.map((d) => d.negative)), [volumeChartData]);

  // 4. Dynamic Top Friction Areas from themes & records
  const topFrictionAreas = useMemo(() => {
    const negThemes = themes
      .filter((t) => t.sentimentBreakdown.negative > 0)
      .sort((a, b) => b.sentimentBreakdown.negative - a.sentimentBreakdown.negative);

    if (negThemes.length > 0) {
      const totalNeg = negThemes.reduce((acc, t) => acc + t.sentimentBreakdown.negative, 0) || 1;
      return negThemes.slice(0, 5).map((t) => ({
        name: t.name,
        percentage: Math.min(100, Math.round((t.sentimentBreakdown.negative / totalNeg) * 100)),
      }));
    }

    const categoryCounts = new Map<string, number>();
    let totalNeg = 0;
    records.forEach((r) => {
      if (r.analysis && (r.analysis.sentiment === "negative" || r.analysis.painPoint)) {
        const cat = r.analysis.primaryCategory || "General UX";
        categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
        totalNeg++;
      }
    });

    if (categoryCounts.size > 0 && totalNeg > 0) {
      return Array.from(categoryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({
          name,
          percentage: Math.round((count / totalNeg) * 100),
        }));
    }

    return [];
  }, [themes, records]);

  // 5. Dynamic Most Requested Features from features & records
  const mostRequestedFeatures = useMemo(() => {
    if (features.length > 0) {
      return [...features]
        .sort((a, b) => b.mentionCount - a.mentionCount)
        .slice(0, 5)
        .map((f) => ({
          title: f.normalizedTitle,
          count: f.mentionCount,
        }));
    }

    const reqCounts = new Map<string, number>();
    records.forEach((r) => {
      if (r.analysis?.featureRequest) {
        const req = r.analysis.featureRequest;
        reqCounts.set(req, (reqCounts.get(req) || 0) + 1);
      }
    });

    if (reqCounts.size > 0) {
      return Array.from(reqCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([title, count]) => ({ title, count }));
    }

    return [];
  }, [features, records]);

  // 6. Dynamic Recent AI Insights
  const recentAiInsights = useMemo(() => {
    const dotColors = ["bg-[#ef4444]", "bg-[#6366f1]", "bg-[#8b5cf6]", "bg-[#10b981]"];
    const badgeClasses = [
      "text-rose-600 bg-rose-50 dark:bg-rose-500/10",
      "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10",
      "text-purple-600 bg-purple-50 dark:bg-purple-500/10",
      "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
    ];

    if (insights.length > 0) {
      return insights.slice(0, 4).map((ins, i) => ({
        id: ins.id,
        title: ins.title,
        snippet: ins.metricSummary || ins.explanation,
        dotColor: dotColors[i % dotColors.length],
        badgeText: ins.type === "emerging_issue" ? "Pain Point" : ins.type === "feature_opportunity" ? "Opportunity" : "Insight",
        badgeClass: badgeClasses[i % badgeClasses.length],
      }));
    }

    const analyzed = records.filter((r) => r.analysis);
    if (analyzed.length > 0) {
      const topNeg = analyzed.find((r) => r.analysis?.sentiment === "negative" && r.analysis.painPoint);
      const topReq = analyzed.find((r) => r.analysis?.featureRequest);
      const topPos = analyzed.find((r) => r.analysis?.sentiment === "positive");

      const items = [];
      if (topNeg) {
        items.push({
          id: "neg-ins",
          title: `Friction: ${topNeg.analysis?.primaryCategory}`,
          snippet: topNeg.analysis?.painPoint || topNeg.text,
          dotColor: "bg-[#ef4444]",
          badgeText: "High Friction",
          badgeClass: "text-rose-600 bg-rose-50 dark:bg-rose-500/10",
        });
      }
      if (topReq) {
        items.push({
          id: "req-ins",
          title: `Requested: ${topReq.analysis?.featureRequest}`,
          snippet: topReq.analysis?.explanation || topReq.text,
          dotColor: "bg-[#6366f1]",
          badgeText: "Feature Demand",
          badgeClass: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10",
        });
      }
      if (topPos) {
        items.push({
          id: "pos-ins",
          title: `Strength: ${topPos.analysis?.productArea || topPos.analysis?.primaryCategory}`,
          snippet: topPos.analysis?.explanation || topPos.text,
          dotColor: "bg-[#10b981]",
          badgeText: "Positive",
          badgeClass: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
        });
      }
      return items;
    }

    return [];
  }, [insights, records]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Welcome Section Card with Editorial Heading & Silk Wave Graphic */}
      <Card className="p-7 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#e8e7ec] dark:border-white/[0.08] shadow-[0_1px_4px_rgba(0,0,0,0.02)] bg-white dark:bg-[#16161a]">
        {/* Silk Wave Image embedded right */}
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-[48%] pointer-events-none overflow-hidden select-none">
          <img
            src="/silk-wave.jpg"
            alt="Fluid silk wave"
            className="w-full h-full object-cover object-center opacity-85 dark:opacity-35 mix-blend-multiply dark:mix-blend-screen"
          />
        </div>

        {/* Left: Eyebrow + Welcome Title + Subtitle */}
        <div className="relative z-10 max-w-xl">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase block mb-1">
            OVERVIEW
          </span>
          <h1 className="text-2xl sm:text-[32px] font-serif font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Welcome back, Karina
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-lg">
            Here&apos;s what your customers are saying. Analyze feedback, uncover key themes, and find opportunities to build a better product.
          </p>
        </div>

        {/* Right: Editorial Quote Callout + Dynamic Actions */}
        <div className="relative z-10 md:max-w-xs shrink-0 flex flex-col items-start md:items-end gap-2.5">
          <div className="text-left md:text-right">
            <p className="font-serif text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
              Customer feedback is your product&apos;s compass.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Turn real voices into meaningful decisions.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => loadSyntheticSampleData()}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>✦ Regenerate Sample Data</span>
            </button>
            <button
              onClick={() => runAnalysisOnDataset()}
              disabled={analysisProgress.isAnalyzing}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>{analysisProgress.isAnalyzing ? "Analyzing..." : "✦ Run NVIDIA AI"}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* 2. 4 KPI Cards in a Row (Matching Reference Image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Feedback */}
        <Card className="p-5 flex items-center justify-between border-[#e8e7ec] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Feedback
            </span>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.total.toLocaleString()}
            </div>
            <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>
                {stats.analyzedCount > 0
                  ? `${stats.analyzedCount} of ${stats.total} analyzed (${Math.round((stats.analyzedCount / (stats.total || 1)) * 100)}%)`
                  : "Awaiting analysis"}
              </span>
            </div>
          </div>
          {/* Dynamic Indigo Sparkline Wave */}
          <div className="shrink-0 pl-2">
            <svg width="60" height="28" viewBox="0 0 60 28" fill="none">
              <defs>
                <linearGradient id="totalSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              {totalSpark.area && <path d={totalSpark.area} fill="url(#totalSparkGrad)" />}
              {totalSpark.path && (
                <path d={totalSpark.path} stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </div>
        </Card>

        {/* KPI 2: Positive */}
        <Card className="p-5 flex items-center justify-between border-[#e8e7ec] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Positive
            </span>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.positivePct}%
            </div>
            <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>{stats.positiveCount} feedback items</span>
            </div>
          </div>
          {/* Dynamic Green Sparkline Wave */}
          <div className="shrink-0 pl-2">
            <svg width="60" height="28" viewBox="0 0 60 28" fill="none">
              <defs>
                <linearGradient id="positiveSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              {positiveSpark.area && <path d={positiveSpark.area} fill="url(#positiveSparkGrad)" />}
              {positiveSpark.path && (
                <path d={positiveSpark.path} stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </div>
        </Card>

        {/* KPI 3: Neutral */}
        <Card className="p-5 flex items-center justify-between border-[#e8e7ec] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Neutral
            </span>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.neutralPct}%
            </div>
            <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span>{stats.neutralCount} feedback items</span>
            </div>
          </div>
          {/* Dynamic Amber Sparkline Wave */}
          <div className="shrink-0 pl-2">
            <svg width="60" height="28" viewBox="0 0 60 28" fill="none">
              <defs>
                <linearGradient id="neutralSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              {neutralSpark.area && <path d={neutralSpark.area} fill="url(#neutralSparkGrad)" />}
              {neutralSpark.path && (
                <path d={neutralSpark.path} stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </div>
        </Card>

        {/* KPI 4: Negative */}
        <Card className="p-5 flex items-center justify-between border-[#e8e7ec] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Negative
            </span>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.negativePct}%
            </div>
            <div className="text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
              <span>{stats.negativeCount} feedback items</span>
            </div>
          </div>
          {/* Dynamic Rose Sparkline Wave */}
          <div className="shrink-0 pl-2">
            <svg width="60" height="28" viewBox="0 0 60 28" fill="none">
              <defs>
                <linearGradient id="negativeSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              {negativeSpark.area && <path d={negativeSpark.area} fill="url(#negativeSparkGrad)" />}
              {negativeSpark.path && (
                <path d={negativeSpark.path} stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </div>
        </Card>
      </div>

      {/* 3. Charts Row: Volume Chart (Left 2/3) + Sentiment Donut (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Card: Feedback Volume Over Time */}
        <Card className="lg:col-span-2 flex flex-col justify-between border-[#e8e7ec] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <div>
              <CardTitle>Feedback Volume Over Time</CardTitle>
              <CardDescription>Track how customer feedback is changing</CardDescription>
            </div>

            {/* Time Filter Pill Control (7D | 30D | 3M | 6M | 1Y) */}
            <div className="inline-flex items-center rounded-lg bg-slate-100/90 dark:bg-white/5 p-0.5 text-xs">
              {(["7D", "30D", "3M", "6M", "1Y"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    timeRange === range
                      ? "bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-2xs font-semibold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={volumeChartData}
                  margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="volumeIndigoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="0"
                    vertical={false}
                    stroke={isDark ? "rgba(255, 255, 255, 0.05)" : "#f1f0ee"}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: isDark ? "#71717a" : "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: isDark ? "#71717a" : "#94a3b8" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-xl px-4 py-2.5 shadow-xl text-left animate-in fade-in duration-100">
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block mb-1">
                              {data.date}
                            </span>
                            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              <span>{data.count} Total Feedback</span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-white/5 pt-1.5">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {data.positive} pos
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                {data.neutral} neu
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                {data.negative} neg
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#5850ec"
                    strokeWidth={2.5}
                    fill="url(#volumeIndigoGrad)"
                    activeDot={{ r: 5, fill: "#5850ec", stroke: "#ffffff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right Card: Sentiment Distribution */}
        <Card className="flex flex-col justify-between border-[#e8e7ec] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <div>
              <CardTitle>Sentiment Distribution</CardTitle>
              <CardDescription>Overall sentiment across all feedback</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="flex items-center justify-between p-4 pt-2">
            {/* Donut Chart with Centered Total */}
            <div className="relative w-44 h-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {sentimentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 0.98)",
                      borderRadius: "10px",
                      border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e9e7e2",
                      fontSize: "12px",
                      color: isDark ? "#f5f5f7" : "#18181b",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Metrics (1,248 / Feedback) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {stats.total.toLocaleString()}
                </span>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Feedback
                </span>
              </div>
            </div>

            {/* Vertical Legend (Right side, aligned like reference) */}
            <div className="space-y-4 pr-2 flex-1 pl-4">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#62a088]" />
                  Positive
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {stats.positivePct}%
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#b8b8b8]" />
                  Neutral
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {stats.neutralPct}%
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c96f6f]" />
                  Negative
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {stats.negativePct}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Bottom Row: 3 Insight Sections (Exact Match to Reference Screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: Top Friction Areas */}
        <Card className="border-[#e8e7ec] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <div>
              <CardTitle>Top Friction Areas</CardTitle>
              <CardDescription>Most common pain points from customer feedback</CardDescription>
            </div>
            <button
              onClick={() => onNavigate("themes")}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-[#e8e7ec] dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              View all
            </button>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {topFrictionAreas.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No friction areas detected yet.<br />Run AI analysis to uncover customer pain points.
              </div>
            ) : (
              topFrictionAreas.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                    {item.name}
                  </span>

                  {/* Horizontal Progress Bar */}
                  <div className="flex-1 mx-2 h-2 rounded-full bg-[#eeedf2] dark:bg-white/10 overflow-hidden">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className="h-full rounded-full bg-[#6e6b9c] dark:bg-[#8582b8] transition-all duration-300"
                    />
                  </div>

                  <span className="font-semibold text-slate-800 dark:text-slate-200 w-8 text-right font-mono text-[11px]">
                    {item.percentage}%
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Column 2: Most Requested Features */}
        <Card className="border-[#e8e7ec] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <div>
              <CardTitle>Most Requested Features</CardTitle>
              <CardDescription>Features customers want to see next</CardDescription>
            </div>
            <button
              onClick={() => onNavigate("features")}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-[#e8e7ec] dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              View all
            </button>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {mostRequestedFeatures.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No feature requests extracted yet.<br />Run AI analysis to identify top product requests.
              </div>
            ) : (
              mostRequestedFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigate("features")}
                  className="flex items-center justify-between text-xs cursor-pointer group hover:opacity-85 transition-opacity"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                    {feat.title}
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-mono text-[11px]">
                    {feat.count}
                    <ChevronRight className="w-3 h-3 stroke-[2] text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Column 3: Recent AI Insights */}
        <Card className="border-[#e8e7ec] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <div>
              <CardTitle>Recent AI Insights</CardTitle>
              <CardDescription>Key findings from your customer feedback</CardDescription>
            </div>
            <button
              onClick={() => onNavigate("insights")}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-[#e8e7ec] dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              View all
            </button>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {recentAiInsights.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No AI insights generated yet.<br />Run AI analysis to surface data-backed recommendations.
              </div>
            ) : (
              recentAiInsights.map((ins) => (
                <div
                  key={ins.id}
                  onClick={() => onNavigate("insights")}
                  className="flex items-start justify-between gap-3 text-xs cursor-pointer group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${ins.dotColor} shrink-0 mt-1.5`} />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {ins.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {ins.snippet}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${ins.badgeClass}`}>
                    {ins.badgeText}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
