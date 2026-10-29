import { FeedbackRecord, MinedFeatureRequest } from "@/types";

/**
 * Mines and normalizes feature requests from analyzed feedback records.
 * Aggregates supporting quotes, affected segments, explicit ratios, and sentiment impact.
 */
export function mineFeatureRequests(records: FeedbackRecord[]): MinedFeatureRequest[] {
  const requestRecords = records.filter(
    (r) => r.analysis && r.analysis.featureRequest && r.analysis.featureRequest.trim().length > 0
  );

  if (requestRecords.length === 0) return [];

  // Group by normalized feature title
  const groups = new Map<
    string,
    {
      normalizedTitle: string;
      description: string;
      productArea: string;
      records: FeedbackRecord[];
      isExplicitCount: number;
    }
  >();

  for (const record of requestRecords) {
    const rawReq = record.analysis!.featureRequest!.trim();
    const productArea = record.analysis!.productArea || "Platform";
    const isExplicit = record.analysis!.isExplicitRequest ?? false;

    // Normalize request title into consolidated features
    let normalized = rawReq;
    let desc = `Request for ${rawReq.toLowerCase()}`;
    const lower = rawReq.toLowerCase();

    if (lower.includes("slack")) {
      normalized = "Native Slack Alerts & Workflow Integration";
      desc = "Real-time automated alert dispatch and notification forwarding into Slack channels.";
    } else if (lower.includes("dark mode") || lower.includes("dark theme")) {
      normalized = "Dark Mode UI Theme";
      desc = "Full dark mode support for night-time analytics and low-light environments.";
    } else if (lower.includes("webhook") || lower.includes("api key") || lower.includes("rest api")) {
      normalized = "Outbound Webhooks & Public REST API";
      desc = "Developer endpoints and webhook triggers for automated external system syncing.";
    } else if (lower.includes("export") || lower.includes("csv") || lower.includes("excel") || lower.includes("pdf")) {
      normalized = "Scheduled CSV / Excel / PDF Report Export";
      desc = "Automated email and direct file export for executive reporting and spreadsheet analysis.";
    } else if (lower.includes("mobile") || lower.includes("ios") || lower.includes("android")) {
      normalized = "Dedicated Mobile App & Responsive Views";
      desc = "Native iOS/Android companion app or optimized responsive layout for tablets and phones.";
    } else if (lower.includes("sso") || lower.includes("saml") || lower.includes("okta")) {
      normalized = "Enterprise SAML 2.0 & Okta SSO";
      desc = "Single Sign-On authentication integration for corporate identity providers.";
    } else if (lower.includes("role") || lower.includes("permission") || lower.includes("rbac")) {
      normalized = "Granular Role-Based Access Control (RBAC)";
      desc = "Custom permission profiles and read-only viewer roles for cross-department access.";
    } else if (lower.includes("cache") || lower.includes("caching") || lower.includes("background")) {
      normalized = "Background Query Caching & Async Processing";
      desc = "Pre-computed metrics caching and asynchronous export pipelines to eliminate UI freezing.";
    } else {
      // Capitalize first letter
      normalized = rawReq.charAt(0).toUpperCase() + rawReq.slice(1);
    }

    if (!groups.has(normalized)) {
      groups.set(normalized, {
        normalizedTitle: normalized,
        description: desc,
        productArea,
        records: [],
        isExplicitCount: 0,
      });
    }

    const g = groups.get(normalized)!;
    g.records.push(record);
    if (isExplicit) {
      g.isExplicitCount++;
    }
  }

  const results: MinedFeatureRequest[] = [];

  groups.forEach((group, title) => {
    const feedbackIds = Array.from(new Set(group.records.map((r) => r.id)));
    const mentionCount = feedbackIds.length;

    // Collect quotes directly from original records
    const quotes: Array<{
      quote: string;
      feedbackId: string;
      source?: string;
      segment?: string;
    }> = [];

    const segmentsSet = new Set<string>();
    const dates: string[] = [];
    let sentimentSum = 0;

    for (const record of group.records) {
      if (record.segment) segmentsSet.add(record.segment);
      if (record.date) dates.push(record.date);
      sentimentSum += record.analysis?.sentimentScore ?? 0;

      if (quotes.length < 4) {
        const quoteText =
          record.analysis?.keyQuotes?.[0] ||
          (record.text.length > 120 ? record.text.slice(0, 120) + "..." : record.text);

        quotes.push({
          quote: quoteText,
          feedbackId: record.id,
          source: record.source,
          segment: record.segment,
        });
      }
    }

    dates.sort();
    const firstSeenDate = dates[0];
    const latestSeenDate = dates[dates.length - 1];

    const explicitRatio = mentionCount > 0 ? group.isExplicitCount / mentionCount : 0;
    const avgSentiment = mentionCount > 0 ? sentimentSum / mentionCount : 0;

    // Priority score formula: weighted by mentions, explicit desire, and affected segments
    const priorityScore = Math.min(
      100,
      Math.round(
        mentionCount * 12 +
          explicitRatio * 25 +
          segmentsSet.size * 10 +
          (avgSentiment < 0 ? 15 : 5) // negative sentiment makes feature more urgent!
      )
    );

    results.push({
      id: `feat-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      normalizedTitle: title,
      description: group.description,
      productArea: group.productArea,
      mentionCount,
      feedbackIds,
      representativeQuotes: quotes,
      sentimentScore: Math.round(avgSentiment * 100) / 100,
      firstSeenDate,
      latestSeenDate,
      affectedSegments: Array.from(segmentsSet),
      isExplicit: explicitRatio >= 0.5,
      priorityScore,
    });
  });

  return results.sort((a, b) => b.mentionCount - a.mentionCount || b.priorityScore - a.priorityScore);
}
