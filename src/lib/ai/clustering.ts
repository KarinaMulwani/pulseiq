import { DiscoveredTheme, FeedbackRecord } from "@/types";

/**
 * Discovers and clusters recurring themes from feedback records.
 * Uses category normalization, pain point grouping, and verbatim quote attribution.
 * All frequency metrics are deterministically counted from distinct records.
 */
export function clusterFeedbackThemes(records: FeedbackRecord[]): DiscoveredTheme[] {
  const analyzedRecords = records.filter((r) => r.analysis);
  if (analyzedRecords.length === 0) return [];

  // Group records by category and pain points
  const groupMap = new Map<
    string,
    {
      name: string;
      description: string;
      category: string;
      records: FeedbackRecord[];
    }
  >();

  for (const record of analyzedRecords) {
    const analysis = record.analysis!;
    const category = analysis.primaryCategory || "General UX";

    // Cluster key: combine category and core pain point or category
    let clusterKey = category;
    let themeName = category;
    let themeDesc = `Customer sentiment and observations regarding ${category.toLowerCase()}.`;

    if (analysis.painPoint) {
      // Normalize common pain points
      const ppLower = analysis.painPoint.toLowerCase();
      if (ppLower.includes("latency") || ppLower.includes("slow") || ppLower.includes("loading") || ppLower.includes("speed")) {
        clusterKey = "Performance: Latency & Sluggish Loads";
        themeName = "Slow Dashboard & Query Performance";
        themeDesc = "Complaints regarding query wait times, loading spinners, and interface latency.";
      } else if (ppLower.includes("billing") || ppLower.includes("invoice") || ppLower.includes("pricing") || ppLower.includes("credit")) {
        clusterKey = "Billing: Invoicing & Subscription Clarity";
        themeName = "Billing Transparency & Invoice Management";
        themeDesc = "Friction regarding invoice access, unexpected charges, or pricing tier ambiguity.";
      } else if (ppLower.includes("onboarding") || ppLower.includes("learning curve") || ppLower.includes("docs") || ppLower.includes("setup")) {
        clusterKey = "Onboarding: Setup Friction & Documentation";
        themeName = "Steep Learning Curve & Onboarding Gaps";
        themeDesc = "Users struggling to configure workspace and finding onboarding guides insufficient.";
      } else if (ppLower.includes("integration") || ppLower.includes("sync") || ppLower.includes("webhook") || ppLower.includes("slack")) {
        clusterKey = "Integrations: Third-Party Ecosystem Gaps";
        themeName = "Missing Integrations & Webhook Support";
        themeDesc = "Demand for seamless connectivity with external tools like Slack, Jira, and CRM systems.";
      } else if (ppLower.includes("navigation") || ppLower.includes("clutter") || ppLower.includes("find") || ppLower.includes("layout")) {
        clusterKey = "UI/UX: Navigation & Information Architecture";
        themeName = "Confusing Navigation & Feature Discoverability";
        themeDesc = "Feedback highlighting difficulty navigating menus and discovering advanced features.";
      } else if (ppLower.includes("mobile") || ppLower.includes("responsive") || ppLower.includes("screen")) {
        clusterKey = "Mobile: Usability on Smaller Screens";
        themeName = "Mobile Experience & Responsive UI Issues";
        themeDesc = "Problems accessing charts, tables, or alerts effectively on mobile devices.";
      } else {
        clusterKey = `${category}: ${analysis.painPoint.slice(0, 40)}`;
        themeName = `${category} - ${analysis.painPoint.slice(0, 35)}...`;
        themeDesc = `Recurring friction: ${analysis.painPoint}`;
      }
    } else if (analysis.sentiment === "positive") {
      clusterKey = `${category}: Positive Satisfaction`;
      themeName = `Reliable ${category}`;
      themeDesc = `Positive commendations regarding ${category.toLowerCase()} capabilities.`;
    }

    if (!groupMap.has(clusterKey)) {
      groupMap.set(clusterKey, {
        name: themeName,
        description: themeDesc,
        category,
        records: [],
      });
    }

    groupMap.get(clusterKey)!.records.push(record);
  }

  // Convert groups into DiscoveredThemes with exact metrics
  const themes: DiscoveredTheme[] = [];

  groupMap.forEach((group, id) => {
    // Distinct feedback IDs
    const feedbackIds = Array.from(new Set(group.records.map((r) => r.id)));
    const frequency = feedbackIds.length;

    // Sentiment breakdown
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    const segmentCounts: Record<string, number> = {};

    const quotes: Array<{ quote: string; feedbackId: string; segment?: string }> = [];

    // Track dates to compute growth and first/last seen
    const sortedDates: string[] = [];

    for (const record of group.records) {
      const s = record.analysis?.sentiment || "neutral";
      if (s === "positive") positive++;
      else if (s === "negative") negative++;
      else neutral++;

      const seg = record.segment || "Unspecified";
      segmentCounts[seg] = (segmentCounts[seg] || 0) + 1;

      if (record.date) {
        sortedDates.push(record.date);
      }

      // Collect representative verbatim quotes
      if (record.analysis?.keyQuotes && record.analysis.keyQuotes.length > 0) {
        for (const q of record.analysis.keyQuotes) {
          if (quotes.length < 4 && q && q.trim().length > 10) {
            quotes.push({
              quote: q.trim(),
              feedbackId: record.id,
              segment: record.segment,
            });
          }
        }
      } else if (quotes.length < 4 && record.text) {
        quotes.push({
          quote: record.text.slice(0, 120),
          feedbackId: record.id,
          segment: record.segment,
        });
      }
    }

    sortedDates.sort();
    const firstSeenDate = sortedDates[0];
    const lastSeenDate = sortedDates[sortedDates.length - 1];

    // Determine growth trend based on date split if multiple dates exist
    let growthTrend: "increasing" | "stable" | "decreasing" = "stable";
    if (sortedDates.length >= 4) {
      const mid = Math.floor(sortedDates.length / 2);
      const firstHalf = sortedDates.slice(0, mid);
      const secondHalf = sortedDates.slice(mid);
      if (secondHalf.length > firstHalf.length * 1.3) {
        growthTrend = "increasing";
      } else if (secondHalf.length < firstHalf.length * 0.7) {
        growthTrend = "decreasing";
      }
    } else if (negative > positive * 2 && frequency >= 3) {
      growthTrend = "increasing";
    }

    themes.push({
      id: `theme-${id.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: group.name,
      description: group.description,
      category: group.category,
      frequency,
      feedbackIds,
      sentimentBreakdown: { positive, neutral, negative },
      segmentBreakdown: segmentCounts,
      representativeQuotes: quotes,
      growthTrend,
      firstSeenDate,
      lastSeenDate,
    });
  });

  // Sort by frequency descending by default
  return themes.sort((a, b) => b.frequency - a.frequency);
}
