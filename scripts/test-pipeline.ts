import { fallbackAnalyzeRecord } from "../src/lib/ai/analyzer";
import { clusterFeedbackThemes } from "../src/lib/ai/clustering";
import { mineFeatureRequests } from "../src/lib/ai/feature-miner";
import { generateAIInsights } from "../src/lib/ai/insights-engine";
import { RAW_SAMPLE_FEEDBACK, SAMPLE_DATASET_ID } from "../src/lib/sample-data";
import { FeedbackRecord } from "../src/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTestSuite() {
  console.log("=== RUNNING PULSEIQ VERIFICATION TEST SUITE ===\n");

  // TEST 1: Sample Data Integrity
  console.log("--- TEST 1: Synthetic Benchmark Dataset ---");
  assert(RAW_SAMPLE_FEEDBACK.length >= 40, `Sample feedback contains ${RAW_SAMPLE_FEEDBACK.length} records (expected >= 40)`);
  const uniqueIds = new Set(RAW_SAMPLE_FEEDBACK.map((r) => r.id));
  assert(uniqueIds.size === RAW_SAMPLE_FEEDBACK.length, "All sample feedback records have unique IDs");

  // TEST 2: Deterministic NLP Analyzer on Sample Data
  console.log("\n--- TEST 2: Feedback Record Analysis ---");
  const analyzedRecords: FeedbackRecord[] = RAW_SAMPLE_FEEDBACK.map((r) => {
    const full: FeedbackRecord = { ...r, createdAt: r.createdAt || new Date().toISOString() };
    return fallbackAnalyzeRecord(full, "Test-NLP-Runner");
  });

  assert(analyzedRecords.every((r) => r.analysis !== null), "All records analyzed successfully");
  const posCount = analyzedRecords.filter((r) => r.analysis?.sentiment === "positive").length;
  const negCount = analyzedRecords.filter((r) => r.analysis?.sentiment === "negative").length;
  const neuCount = analyzedRecords.filter((r) => r.analysis?.sentiment === "neutral").length;

  console.log(`Sentiment breakdown: Positive=${posCount}, Negative=${negCount}, Neutral=${neuCount}`);
  assert(posCount > 0 && negCount > 0 && neuCount >= 0, "Dataset demonstrates multiple sentiment types");

  // TEST 3: Verbatim Quote Preservation
  console.log("\n--- TEST 3: Verbatim Quote Attribution ---");
  for (const record of analyzedRecords.slice(0, 5)) {
    if (record.analysis?.keyQuotes && record.analysis.keyQuotes.length > 0) {
      for (const quote of record.analysis.keyQuotes) {
        assert(
          record.text.includes(quote),
          `Quote "${quote}" is a verbatim substring of feedback record ${record.id}`
        );
      }
    }
  }

  // TEST 4: Theme Discovery and Semantic Clustering
  console.log("\n--- TEST 4: Theme Clustering & Frequency Validation ---");
  const themes = clusterFeedbackThemes(analyzedRecords);
  assert(themes.length >= 4, `Discovered ${themes.length} distinct themes (expected >= 4)`);

  for (const theme of themes) {
    assert(theme.frequency > 0, `Theme "${theme.name}" has frequency ${theme.frequency} > 0`);
    assert(
      theme.feedbackIds.length === theme.frequency,
      `Theme "${theme.name}" frequency matches underlying distinct feedback IDs (${theme.feedbackIds.length})`
    );

    const sumBreakdown =
      theme.sentimentBreakdown.positive +
      theme.sentimentBreakdown.neutral +
      theme.sentimentBreakdown.negative;
    assert(
      sumBreakdown === theme.frequency,
      `Theme "${theme.name}" sentiment breakdown (${sumBreakdown}) equals frequency (${theme.frequency})`
    );

    // Verify representative quotes belong to records assigned to this theme
    for (const repQuote of theme.representativeQuotes) {
      assert(
        theme.feedbackIds.includes(repQuote.feedbackId),
        `Representative quote links to valid feedbackId ${repQuote.feedbackId}`
      );
    }
  }

  // TEST 5: Feature Request Mining
  console.log("\n--- TEST 5: Feature Request Mining ---");
  const features = mineFeatureRequests(analyzedRecords);
  assert(features.length >= 3, `Mined ${features.length} feature requests (expected >= 3)`);

  for (const feat of features) {
    assert(feat.mentionCount > 0, `Feature "${feat.normalizedTitle}" has mentionCount ${feat.mentionCount}`);
    assert(
      feat.feedbackIds.length === feat.mentionCount,
      `Feature mentionCount matches feedbackIds length for "${feat.normalizedTitle}"`
    );
    assert(feat.priorityScore >= 0 && feat.priorityScore <= 100, `Priority score ${feat.priorityScore} is within [0, 100]`);

    // Verify representative quotes belong to records requesting this feature
    for (const q of feat.representativeQuotes) {
      assert(
        feat.feedbackIds.includes(q.feedbackId),
        `Feature quote linked to valid feedbackId ${q.feedbackId}`
      );
    }
  }

  // TEST 6: AI Insights Generation & Analytical Rules
  console.log("\n--- TEST 6: Evidence-Backed AI Insights ---");
  const insights = generateAIInsights(analyzedRecords, themes, features);
  assert(insights.length >= 2, `Generated ${insights.length} validated AI insights`);

  for (const ins of insights) {
    assert(ins.title.length > 5, `Insight has clear title: "${ins.title}"`);
    assert(ins.metricSummary.length > 10, `Insight provides quantitative proof: "${ins.metricSummary}"`);
    assert(
      ins.hypothesis.toLowerCase().includes("hypothesis") || ins.hypothesis.toLowerCase().includes("fact"),
      `Insight clearly labels hypothesis: "${ins.hypothesis}"`
    );
    assert(ins.suggestedAction.length > 10, `Insight suggests concrete next action`);
    assert(["high", "medium", "low"].includes(ins.confidence), `Confidence indicator is calibrated (${ins.confidence})`);
  }

  // TEST 7: Malformed / Edge Case Handling
  console.log("\n--- TEST 7: Edge Cases & Malformed Inputs ---");
  const emptyThemes = clusterFeedbackThemes([]);
  assert(emptyThemes.length === 0, "Empty record set safely produces empty theme array");

  const emptyFeatures = mineFeatureRequests([]);
  assert(emptyFeatures.length === 0, "Empty record set safely produces empty feature array");

  const emptyInsights = generateAIInsights([], [], []);
  assert(emptyInsights.length === 0, "Empty dataset safely produces 0 insights without division by zero");

  // Single record with blank text
  const blankRecord: FeedbackRecord = {
    id: "blank-1",
    datasetId: "test",
    text: "",
    createdAt: new Date().toISOString(),
  };
  const analyzedBlank = fallbackAnalyzeRecord(blankRecord);
  assert(analyzedBlank.analysis !== null, "Handled blank feedback text safely");

  console.log("\n=== ALL TEST SUITE ASSERTIONS PASSED SUCCESSFULLY! ===");
}

runTestSuite().catch((e) => {
  console.error("Test execution error:", e);
  process.exit(1);
});
