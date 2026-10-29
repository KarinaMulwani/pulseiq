"use client";

import React, { useState, useEffect } from "react";
import { ThemeProvider } from "@/lib/theme-context";
import { DataStoreProvider, useDataStore } from "@/lib/storage/data-store";
import { Sidebar, NavTab } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";
import { FeedbackExplorer } from "@/components/explorer/feedback-explorer";
import { ThemesView } from "@/components/themes/themes-view";
import { FeaturesView } from "@/components/features/features-view";
import { InsightsView } from "@/components/insights/insights-view";
import { ImportsView } from "@/components/imports/imports-view";
import { SettingsView } from "@/components/settings/settings-view";

function MainContent() {
  const { isReady } = useDataStore();
  const [currentTab, setCurrentTab] = useState<NavTab>("overview");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") as NavTab;
      const validTabs: NavTab[] = [
        "overview",
        "explorer",
        "themes",
        "features",
        "insights",
        "imports",
        "settings",
      ];
      if (validTabs.includes(hash)) {
        setCurrentTab(hash);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    window.location.hash = tab;
  };


  return (
    <div className="flex min-h-screen bg-[#f2f1f6] dark:bg-[#0f0f13] text-slate-900 dark:text-slate-100 transition-colors duration-200 relative font-sans">
      {/* Sidebar */}
      <Sidebar currentTab={currentTab} onTabChange={handleTabChange} />

      {/* Main Canvas */}
      <div className="flex-1 min-w-0 relative z-10 overflow-y-auto">
        <main className="p-7 max-w-[1440px] mx-auto w-full">
          <Topbar />
          {currentTab === "overview" && <OverviewDashboard onNavigate={handleTabChange} />}
          {currentTab === "explorer" && <FeedbackExplorer />}
          {currentTab === "themes" && <ThemesView />}
          {currentTab === "features" && <FeaturesView />}
          {currentTab === "insights" && <InsightsView />}
          {currentTab === "imports" && <ImportsView />}
          {currentTab === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DataStoreProvider>
        <MainContent />
      </DataStoreProvider>
    </ThemeProvider>
  );
}
