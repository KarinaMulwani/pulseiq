"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  MessageSquare,
  Layers,
  Sparkles,
  Brain,
  UploadCloud,
  Settings,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { useDataStore } from "@/lib/storage/data-store";

export type NavTab =
  | "overview"
  | "explorer"
  | "themes"
  | "features"
  | "insights"
  | "imports"
  | "settings";

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function Sidebar({ currentTab, onTabChange }: SidebarProps) {
  const { records, themes, features, insights } = useDataStore();

  const navItems = [
    {
      id: "overview" as NavTab,
      label: "Overview",
      icon: Home,
      badge: null,
    },
    {
      id: "explorer" as NavTab,
      label: "Feedback Explorer",
      icon: MessageSquare,
      badge: records.length > 0 ? records.length : null,
    },
    {
      id: "themes" as NavTab,
      label: "Themes & Clusters",
      icon: Layers,
      badge: themes.length > 0 ? themes.length : null,
    },
    {
      id: "features" as NavTab,
      label: "Feature Requests",
      icon: Sparkles,
      badge: features.length > 0 ? features.length : null,
    },
    {
      id: "insights" as NavTab,
      label: "AI Insights",
      icon: Brain,
      badge: insights.length > 0 ? insights.length : null,
    },
    {
      id: "imports" as NavTab,
      label: "Data Imports",
      icon: UploadCloud,
      badge: null,
    },
    {
      id: "settings" as NavTab,
      label: "Settings",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-[#f6f5f8] dark:bg-[#121216] border-r border-[#e8e7ec] dark:border-white/[0.06] flex flex-col justify-between shrink-0 select-none h-screen sticky top-0 transition-colors duration-200 z-30">
      {/* Top Part: Brand + Nav */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-sm shadow-xs">
            P
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              PulseIQ
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
              Product Feedback Miner
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group",
                  isActive
                    ? "bg-[#ece8ff] dark:bg-[#28224d] text-[#1e1b4b] dark:text-white font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors stroke-[1.75]",
                      isActive
                        ? "text-[#4f46e5] dark:text-[#818cf8]"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Part: Decorative Wave + Promo Card + User Profile */}
      <div className="relative pt-6">
        {/* Subtle Fluid Wave in Sidebar Background matching screenshot */}
        <div className="absolute left-0 bottom-20 w-full h-44 pointer-events-none overflow-hidden select-none opacity-60 dark:opacity-25">
          <img
            src="/silk-wave.jpg"
            alt=""
            className="w-full h-full object-cover object-center mix-blend-multiply dark:mix-blend-screen scale-125"
          />
        </div>

        {/* Promo Card: Turn feedback into product growth */}
        <div className="mx-3.5 mb-4 p-4 rounded-2xl bg-white dark:bg-[#1a1a20] border border-[#e8e7ec] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] relative z-10 space-y-1.5">
          <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 stroke-[1.75]" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
            Turn feedback into product growth
          </h4>
          <div className="flex items-start gap-1.5 pt-0.5">
            <span className="text-slate-400 dark:text-slate-500 text-xs leading-none mt-0.5">+</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Discover patterns, prioritise features, and build what customers love.
            </p>
          </div>
          <button
            onClick={() => onTabChange("imports")}
            className="w-full mt-3 py-2 px-3 rounded-xl bg-black dark:bg-white hover:bg-neutral-800 text-white dark:text-black text-xs font-medium flex items-center justify-center gap-1.5 transition-opacity"
          >
            <span>Upload Feedback</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Profile Footer */}
        <div className="px-4 py-3 border-t border-[#e8e7ec] dark:border-white/[0.06] flex items-center justify-between relative z-10 bg-[#f6f5f8] dark:bg-[#121216]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs">
              K
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                Karina
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Student
              </span>
            </div>
          </div>

          <button
            title="Account Options"
            onClick={() => onTabChange("settings")}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1.5 rounded-lg"
          >
            <LogOut className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
