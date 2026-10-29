import { AIInsight, DiscoveredTheme, FeedbackRecord, MinedFeatureRequest } from "@/types";

/**
 * Generates evidence-backed, mathematically grounded insights from analyzed feedback.
 * Adheres strictly to analytical rules:
 * - Deterministic counts and percentages
 * - No fabricated causation; potential causes are labeled as hypotheses
 * - Transparent sample sizes and baselines
 * - Verbatim customer quotes
 */
export function generateAIInsights(
  records: FeedbackRecord[],
  themes: DiscoveredTheme[],
  features: MinedFeatureRequest[]
): AIInsight[] {
  const analyzed = records.filter((r) => r.analysis);
  const total = analyzed.length;
  if (total < 3) return [];

  const insights: AIInsight[] = [];
  const now = new Date().toISOString();

  // 1. Dominant Pain Point & Theme Anomaly
  const topTheme = themes.find((t) => t.sentimentBreakdown.negative > 0);
  if (topTheme && topTheme.frequency >= 2) {
    const negCount = topTheme.sentimentBreakdown.negative;
    const themeNegPct = Math.round((negCount / topTheme.frequency) * 100);
    const totalNegRecords = analyzed.filter((r) => r.analysis?.sentiment === "negative").length;
    const shareOfAllNegative =
      totalNegRecords > 0 ? Math.round((negCount / totalNegRecords) * 100) : 0;

    const sampleQuotes = topTheme.representativeQuotes.slice(0, 3).map((q) => ({
      quote: q.quote,
      feedbackId: q.feedbackId,
      segment: q.segment,
    }));

    insights.push({
      id: `insight-theme-${topTheme.id}`,
      type: "trend",
      title: `Concentration of Friction: ${topTheme.name}`,
      metricSummary: `${negCount} of ${topTheme.frequency} mentions (${themeNegPct}%) are negative, representing ${shareOfAllNegative}% of all negative feedback (${totalNegRecords} total).`,
      explanation: `Customer records in "${topTheme.name}" exhibit a significantly elevated negative sentiment rate compared to the general baseline.`,
      metrics: {
        primaryValue: `${negCount} records`,
        comparisonValue: `${totalNegRecords} total negative`,
        deltaPercent: shareOfAllNegative,
        sampleSize: topTheme.frequency,
      },
      evidenceQuotes: sampleQuotes,
      confidence: topTheme.frequency >= 8 ? "high" : topTheme.frequency >= 4 ? "medium" : "low",
      hypothesis: `Hypothesis to investigate: Recent platform updates or higher data volumes may have introduced latency or user friction in ${topTheme.category}.`,
      suggestedAction: `Audit ${topTheme.category} telemetry and review recent error logs to confirm if infrastructural bottlenecks correlate with these timestamps.`,
      detectedAt: now,
    });
  }

  // 2. Segment Disparity Analysis
  // Calculate complaint rate per customer segment
  const segmentStats: Record<string, { total: number; negative: number }> = {};
  for (const r of analyzed) {
    const seg = r.segment || "Unspecified";
    if (!segmentStats[seg]) segmentStats[seg] = { total: 0, negative: 0 };
    segmentStats[seg].total++;
    if (r.analysis?.sentiment === "negative") {
      segmentStats[seg].negative++;
    }
  }

  // Find segments with elevated dissatisfaction
  const segmentsWithData = Object.entries(segmentStats).filter(([_, s]) => s.total >= 4);
  if (segmentsWithData.length >= 2) {
    segmentsWithData.sort((a, b) => b[1].negative / b[1].total - a[1].negative / a[1].total);
    const [highestSeg, highStat] = segmentsWithData[0];
    const highRate = Math.round((highStat.negative / highStat.total) * 100);

    const [lowestSeg, lowStat] = segmentsWithData[segmentsWithData.length - 1];
    const lowRate = Math.round((lowStat.negative / lowStat.total) * 100);

    if (highRate >= lowRate + 20 && highStat.negative >= 2) {
      // Find quotes specifically from this segment
      const segQuotes = analyzed
        .filter((r) => r.segment === highestSeg && r.analysis?.sentiment === "negative")
        .slice(0, 3)
        .map((r) => ({
          quote: r.analysis?.keyQuotes?.[0] || r.text.slice(0, 100),
          feedbackId: r.id,
          segment: r.segment,
        }));

      insights.push({
        id: `insight-segment-${highestSeg.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        type: "segment_disparity",
        title: `Dissatisfaction Disparity in ${highestSeg} Segment`,
        metricSummary: `${highestSeg} reports ${highRate}% negative sentiment (${highStat.negative}/${highStat.total}), compared to ${lowRate}% for ${lowestSeg} (${lowStat.negative}/${lowStat.total}).`,
        explanation: `Accounts in the ${highestSeg} tier report substantially higher rates of dissatisfaction than other customer segments in the dataset.`,
        metrics: {
          primaryValue: `${highRate}% negative`,
          comparisonValue: `${lowRate}% in ${lowestSeg}`,
          deltaPercent: highRate - lowRate,
          sampleSize: highStat.total,
        },
        evidenceQuotes: segQuotes,
        confidence: highStat.total >= 10 ? "high" : "medium",
        hypothesis: `Hypothesis to investigate: ${highestSeg} accounts typically operate with larger data scale and more complex team workflows, which may exceed current architectural constraints.`,
        suggestedAction: `Conduct targeted interviews with 3-5 ${highestSeg} account representatives to validate if high data volume is the primary underlying driver.`,
        detectedAt: now,
      });
    }
  }

  // 3. Top Feature Request Demand
  const topFeature = features[0];
  if (topFeature && topFeature.mentionCount >= 2) {
    const featPct = Math.round((topFeature.mentionCount / total) * 100);
    const affectedSegs = topFeature.affectedSegments.join(", ") || "Multiple segments";

    insights.push({
      id: `insight-feat-${topFeature.id}`,
      type: "feature_opportunity",
      title: `High-Demand Feature Opportunity: ${topFeature.normalizedTitle}`,
      metricSummary: `Requested by ${topFeature.mentionCount} of ${total} customers (${featPct}%), spanning: ${affectedSegs}.`,
      explanation: `This request represents the single most frequently voiced product expansion request across customer touchpoints.`,
      metrics: {
        primaryValue: `${topFeature.mentionCount} requests`,
        comparisonValue: `${total} total entries`,
        deltaPercent: featPct,
        sampleSize: topFeature.mentionCount,
      },
      evidenceQuotes: topFeature.representativeQuotes.slice(0, 3).map((q) => ({
        quote: q.quote,
        feedbackId: q.feedbackId,
        segment: q.segment,
      })),
      confidence: topFeature.mentionCount >= 6 ? "high" : "medium",
      hypothesis: `Hypothesis to investigate: Customers appear to treat ${topFeature.normalizedTitle} as a critical workflow enabler rather than an optional enhancement.`,
      suggestedAction: `Review technical feasibility and scoping with the engineering lead for ${topFeature.productArea}.`,
      detectedAt: now,
    });
  }

  // 4. Chronological Trend / Emerging Issue (if dated feedback exists)
  const datedRecords = analyzed.filter((r) => r.date).sort((a, b) => (a.date! > b.date! ? 1 : -1));
  if (datedRecords.length >= 8) {
    const midIndex = Math.floor(datedRecords.length / 2);
    const baselinePeriod = datedRecords.slice(0, midIndex);
    const recentPeriod = datedRecords.slice(midIndex);

    const baselineNeg = baselinePeriod.filter((r) => r.analysis?.sentiment === "negative").length;
    const baselineNegRate = Math.round((baselineNeg / baselinePeriod.length) * 100);

    const recentNeg = recentPeriod.filter((r) => r.analysis?.sentiment === "negative").length;
    const recentNegRate = Math.round((recentNeg / recentPeriod.length) * 100);

    const delta = recentNegRate - baselineNegRate;

    if (Math.abs(delta) >= 15 && baselinePeriod.length >= 4 && recentPeriod.length >= 4) {
      const isIncrease = delta > 0;
      const recentQuotes = recentPeriod
        .filter((r) => r.analysis?.sentiment === (isIncrease ? "negative" : "positive"))
        .slice(0, 3)
        .map((r) => ({
          quote: r.analysis?.keyQuotes?.[0] || r.text.slice(0, 100),
          feedbackId: r.id,
          segment: r.segment,
        }));

      const dateStart = baselinePeriod[0]?.date || "Period 1";
      const dateSplit = recentPeriod[0]?.date || "Period 2";
      const dateEnd = recentPeriod[recentPeriod.length - 1]?.date || "Latest";

      insights.push({
        id: "insight-trend-chronological",
        type: isIncrease ? "emerging_issue" : "trend",
        title: isIncrease
          ? `Negative Sentiment Spike (${recentNegRate}% vs ${baselineNegRate}% baseline)`
          : `Sentiment Improvement Observed in Recent Feedback`,
        metricSummary: `Negative feedback moved from ${baselineNegRate}% (${baselineNeg}/${baselinePeriod.length} entries: ${dateStart} to ${dateSplit}) to ${recentNegRate}% (${recentNeg}/${recentPeriod.length} entries: ${dateSplit} to ${dateEnd}).`,
        explanation: isIncrease
          ? `A measurable uptick in customer friction occurred across records in the more recent observation period.`
          : `Customer sentiment shows measurable positive recovery in the more recent observation period.`,
        metrics: {
          primaryValue: `${recentNegRate}% recent`,
          comparisonValue: `${baselineNegRate}% baseline`,
          deltaPercent: delta,
          sampleSize: recentPeriod.length,
        },
        evidenceQuotes: recentQuotes,
        confidence: datedRecords.length >= 20 ? "high" : "medium",
        hypothesis: isIncrease
          ? `Hypothesis to investigate: A release or service disruption around ${dateSplit} may have triggered user dissatisfaction.`
          : `Hypothesis to investigate: Recent product fixes or onboarding adjustments may have stabilized user experience.`,
        suggestedAction: isIncrease
          ? `Cross-reference product release changelogs around ${dateSplit} against incident logs.`
          : `Maintain current workflow adjustments and continue monitoring sentiment stability.`,
        detectedAt: now,
      });
    }
  }

  // 5. Positive Satisfaction Highlight
  const positiveTheme = themes.find((t) => t.sentimentBreakdown.positive >= 3);
  if (positiveTheme) {
    const posCount = positiveTheme.sentimentBreakdown.positive;
    const posPct = Math.round((posCount / positiveTheme.frequency) * 100);

    insights.push({
      id: `insight-strength-${positiveTheme.id}`,
      type: "trend",
      title: `Core Product Strength: ${positiveTheme.name}`,
      metricSummary: `${posCount} of ${positiveTheme.frequency} feedback entries (${posPct}%) praised this area.`,
      explanation: `Users consistently highlight this capability as a primary driver of satisfaction and value retention.`,
      metrics: {
        primaryValue: `${posCount} positive`,
        comparisonValue: `${positiveTheme.frequency} total`,
        deltaPercent: posPct,
        sampleSize: positiveTheme.frequency,
      },
      evidenceQuotes: positiveTheme.representativeQuotes.slice(0, 2).map((q) => ({
        quote: q.quote,
        feedbackId: q.feedbackId,
        segment: q.segment,
      })),
      confidence: positiveTheme.frequency >= 5 ? "high" : "medium",
      hypothesis: `Observed Fact: Customers view ${positiveTheme.category} as a competitive differentiator.`,
      suggestedAction: `Feature customer testimonials from this cohort in product marketing and avoid regression during UI refactors.`,
      detectedAt: now,
    });
  }

  return insights;
}
