"use client";

import React, { useState } from "react";
import { useDataStore } from "@/lib/storage/data-store";
import { useTheme } from "@/lib/theme-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { AVAILABLE_NVIDIA_MODELS } from "@/lib/ai/nvidia-client";
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
} from "lucide-react";

export function SettingsView() {
  const { modelSettings, updateModelSettings, clearAllData } = useDataStore();
  const { theme, setTheme } = useTheme();

  const [apiKeyInput, setApiKeyInput] = useState(modelSettings.apiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Test NVIDIA NIM connection
  const handleTestConnection = async () => {
    setIsTestingKey(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput }),
      });
      const data = await res.json();
      setTestResult({
        valid: data.valid,
        message: data.message || (data.valid ? "Connection established" : "Failed to connect"),
      });
    } catch (e: any) {
      setTestResult({
        valid: false,
        message: e.message || "Network error while connecting to NVIDIA NIM API",
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  // Save settings
  const handleSaveSettings = () => {
    updateModelSettings({
      apiKey: apiKeyInput.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Settings
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Appearance, NVIDIA NIM API models, and data management
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Select your interface theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              onClick={() => setTheme("light")}
              className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                theme === "light"
                  ? "bg-black/[0.04] dark:bg-white/[0.1] border-black/20 dark:border-white/20 shadow-xs"
                  : "bg-transparent border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-black/10 flex items-center justify-center text-neutral-800 shadow-xs">
                <Sun className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                  Light Mode
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Clean frosted glass
                </span>
              </div>
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                theme === "dark"
                  ? "bg-black/[0.04] dark:bg-white/[0.1] border-black/20 dark:border-white/20 shadow-xs"
                  : "bg-transparent border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-white shadow-xs">
                <Moon className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                  Dark Mode
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Deep dark glass
                </span>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* NVIDIA NIM API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>NVIDIA NIM API</CardTitle>
          <CardDescription>
            Targeting endpoint{" "}
            <code className="font-mono text-neutral-700 dark:text-neutral-300">
              https://integrate.api.nvidia.com/v1
            </code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* API Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                NVIDIA API Key
              </label>
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                Leave empty for automatic local NLP mode
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? "text" : "password"}
                  placeholder="nvapi-..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full text-xs font-mono backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl pl-3 pr-9 py-2 focus:outline-none text-neutral-900 dark:text-neutral-100"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  {showKey ? <EyeOff className="w-4 h-4 stroke-[1.5]" /> : <Eye className="w-4 h-4 stroke-[1.5]" />}
                </button>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestConnection}
                isLoading={isTestingKey}
                className="text-xs whitespace-nowrap font-normal"
              >
                Test
              </Button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  testResult.valid
                    ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20"
                }`}
              >
                {testResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Model Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Primary Model
              </label>
              <select
                value={modelSettings.primaryModel}
                onChange={(e) => updateModelSettings({ primaryModel: e.target.value })}
                className="w-full text-xs backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 focus:outline-none text-neutral-800 dark:text-neutral-200"
              >
                {AVAILABLE_NVIDIA_MODELS.map((m) => (
                  <option key={m.id} value={m.id} className="dark:bg-neutral-900">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Fallback Model 1
              </label>
              <select
                value={modelSettings.fallbackModel1}
                onChange={(e) => updateModelSettings({ fallbackModel1: e.target.value })}
                className="w-full text-xs backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 focus:outline-none text-neutral-800 dark:text-neutral-200"
              >
                {AVAILABLE_NVIDIA_MODELS.map((m) => (
                  <option key={m.id} value={m.id} className="dark:bg-neutral-900">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Fallback Model 2
              </label>
              <select
                value={modelSettings.fallbackModel2}
                onChange={(e) => updateModelSettings({ fallbackModel2: e.target.value })}
                className="w-full text-xs backdrop-blur-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 focus:outline-none text-neutral-800 dark:text-neutral-200"
              >
                {AVAILABLE_NVIDIA_MODELS.map((m) => (
                  <option key={m.id} value={m.id} className="dark:bg-neutral-900">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Batch & Timeout Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Batch Chunk Size
                </span>
                <span className="font-mono text-neutral-500 dark:text-neutral-400">
                  {modelSettings.batchSize} items
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                value={modelSettings.batchSize}
                onChange={(e) => updateModelSettings({ batchSize: parseInt(e.target.value) })}
                className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Timeout Threshold
                </span>
                <span className="font-mono text-neutral-500 dark:text-neutral-400">
                  {modelSettings.timeoutMs / 1000}s
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="50000"
                step="5000"
                value={modelSettings.timeoutMs}
                onChange={(e) => updateModelSettings({ timeoutMs: parseInt(e.target.value) })}
                className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-black/[0.04] dark:border-white/[0.05]">
            <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={modelSettings.useFallback}
                onChange={(e) => updateModelSettings({ useFallback: e.target.checked })}
                className="rounded text-neutral-900 focus:ring-0 w-3.5 h-3.5"
              />
              <span>Enable automatic model fallback on HTTP 429 errors</span>
            </label>

            <Button size="sm" variant="primary" onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-1.5 border border-emerald-500/20 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Settings updated successfully</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage & Persistence */}
      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
          <CardDescription>
            Local browser storage + optional Supabase PostgreSQL sync
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl backdrop-blur-md bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between">
            <span className="font-medium text-neutral-800 dark:text-neutral-200">
              Browser Local Storage
            </span>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="p-4 rounded-2xl backdrop-blur-md bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                Supabase PostgreSQL
              </span>
              <Badge variant="outline">Optional</Badge>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local` to sync with Supabase. Schema is in `supabase/schema.sql`.
            </p>
          </div>

          {/* Reset Action */}
          <div className="pt-4 border-t border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between">
            <div>
              <span className="font-medium text-rose-600 dark:text-rose-400 block">
                Reset Workspace
              </span>
              <span className="text-neutral-400 dark:text-neutral-500 text-[11px]">
                Remove all imported datasets, themes, and records
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmResetOpen(true)}
              className="text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/30 hover:bg-rose-500/10 font-normal"
            >
              Reset Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {confirmResetOpen && (
        <Modal
          isOpen={confirmResetOpen}
          onClose={() => setConfirmResetOpen(false)}
          title="Reset Workspace Data"
          description="Are you sure you want to clear all data?"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs text-neutral-600 dark:text-neutral-300">
            <p>
              This will remove all datasets, feedback records, and insights. You can reload the benchmark data anytime.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
              <Button size="sm" variant="secondary" onClick={() => setConfirmResetOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  clearAllData();
                  setConfirmResetOpen(false);
                }}
              >
                Clear Everything
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
