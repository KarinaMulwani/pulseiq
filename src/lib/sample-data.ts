import { FeedbackRecord } from "@/types";

export const SAMPLE_DATASET_ID = "dataset-synthetic-saas-demo";
export const SAMPLE_DATASET_NAME = "CloudPulse SaaS Feedback (Synthetic Benchmark)";

// Realistic customer feedback templates across key SaaS modules
const FEEDBACK_TEMPLATES = [
  // Friction / Negative items
  {
    text: "The analytics dashboard takes over 18 seconds to load when querying quarterly data across 50 regions. We urgently need query caching or background calculation.",
    sentiment: "negative" as const,
    sentimentScore: -0.85,
    primaryCategory: "Performance & Latency",
    painPoint: "Dashboard takes 18+ seconds to load quarterly data across regional teams",
    featureRequest: "Query caching or asynchronous background calculation",
    isExplicitRequest: false,
    product: "Analytics Engine",
    segment: "Enterprise",
    source: "Zendesk Ticket",
    rating: 1,
    quotes: ["takes over 18 seconds to load", "need query caching or background calculation"],
  },
  {
    text: "Finance team cannot download automated PDF receipts. We have to email support every month just to get itemized VAT receipts for tax filing.",
    sentiment: "negative" as const,
    sentimentScore: -0.75,
    primaryCategory: "Billing & Invoicing",
    painPoint: "No automated PDF receipts or VAT invoice downloads",
    featureRequest: "Automated monthly PDF invoices and self-serve billing receipt portal",
    isExplicitRequest: false,
    product: "Billing & Checkout",
    segment: "SMB",
    source: "Zendesk Ticket",
    rating: 2,
    quotes: ["cannot download automated PDF receipts", "have to email support every month"],
  },
  {
    text: "The web app is very clunky on iPad and tablets. Touch targets are too small and tooltips get stuck on screen during triage.",
    sentiment: "negative" as const,
    sentimentScore: -0.65,
    primaryCategory: "Mobile & Responsive UI",
    painPoint: "Small touch targets and sticky tooltips on iPad tablet screens",
    featureRequest: "Dedicated tablet-responsive layout with larger touch targets",
    isExplicitRequest: false,
    product: "Mobile Web",
    segment: "SMB",
    source: "App Store",
    rating: 2,
    quotes: ["clunky on iPad and tablets", "tooltips get stuck on screen"],
  },
  {
    text: "Setting up our workspace was confusing. Documentation does not explain how role permissions inherit across sub-teams. Wasted 2 days debugging invites.",
    sentiment: "negative" as const,
    sentimentScore: -0.7,
    primaryCategory: "Onboarding & Permissions",
    painPoint: "Unclear documentation on role permission inheritance across sub-teams",
    featureRequest: "Interactive role permission visualizer and team setup checklist",
    isExplicitRequest: false,
    product: "User Onboarding",
    segment: "Enterprise",
    source: "User Interview",
    rating: 2,
    quotes: ["setting up our workspace was confusing", "documentation does not explain role permissions"],
  },
  {
    text: "CSV exports keep timing out on datasets with more than 10,000 rows. The browser tab freezes completely.",
    sentiment: "negative" as const,
    sentimentScore: -0.8,
    primaryCategory: "Reporting & Export",
    painPoint: "CSV exports timeout and freeze browser on large datasets (>10k rows)",
    featureRequest: "Asynchronous background export with email/webhook notification",
    isExplicitRequest: false,
    product: "Analytics Engine",
    segment: "Enterprise",
    source: "Zendesk Ticket",
    rating: 1,
    quotes: ["exports keep timing out on datasets with more than 10,000 rows", "browser tab freezes completely"],
  },
  {
    text: "Session timeout is too aggressive. I get logged out every 15 minutes of inactivity and lose unsaved filter settings.",
    sentiment: "negative" as const,
    sentimentScore: -0.6,
    primaryCategory: "Authentication & Security",
    painPoint: "Aggressive 15-minute inactivity timeout causes loss of unsaved filters",
    featureRequest: "Configurable session duration and auto-saving dashboard filter state",
    isExplicitRequest: false,
    product: "Core Platform",
    segment: "Mid-Market",
    source: "In-App CSAT",
    rating: 2,
    quotes: ["session timeout is too aggressive", "lose unsaved filter settings"],
  },
  {
    text: "Webhooks fail silently when our endpoint returns a 504. There is no retry policy or failure alert in the dashboard.",
    sentiment: "negative" as const,
    sentimentScore: -0.7,
    primaryCategory: "Integrations & APIs",
    painPoint: "Webhooks fail silently on 504 gateway timeouts without retry logic",
    featureRequest: "Exponential backoff retry mechanism and dead-letter queue for webhooks",
    isExplicitRequest: false,
    product: "Integrations Hub",
    segment: "Enterprise",
    source: "Zendesk Ticket",
    rating: 2,
    quotes: ["webhooks fail silently", "no retry policy or failure alert"],
  },

  // Feature Requests / Mixed
  {
    text: "Please add a native Slack integration! Our DevOps team needs real-time metric breach alerts delivered straight into #alerts-ops.",
    sentiment: "positive" as const,
    sentimentScore: 0.65,
    primaryCategory: "Integrations & APIs",
    painPoint: null,
    featureRequest: "Native Slack integration for real-time metric breach alerts",
    isExplicitRequest: true,
    product: "Integrations Hub",
    segment: "Mid-Market",
    source: "In-App CSAT",
    rating: 4,
    quotes: ["Please add a native Slack integration", "delivered straight into #alerts-ops"],
  },
  {
    text: "We really need Dark Mode. Staring at bright white data grids at 2 AM during customer incident triage causes severe eye strain.",
    sentiment: "neutral" as const,
    sentimentScore: 0.1,
    primaryCategory: "Core UI & Accessibility",
    painPoint: "Eye strain from bright white interface during night triage",
    featureRequest: "Dark Mode theme option with automatic OS preference sync",
    isExplicitRequest: true,
    product: "Core Platform",
    segment: "Mid-Market",
    source: "In-App CSAT",
    rating: 3,
    quotes: ["We really need Dark Mode", "causes severe eye strain"],
  },
  {
    text: "We need SAML 2.0 Single Sign-On with Okta. Corporate security prohibits password logins without mandatory corporate SSO enforcement.",
    sentiment: "neutral" as const,
    sentimentScore: 0.05,
    primaryCategory: "Authentication & Security",
    painPoint: null,
    featureRequest: "Enterprise SAML 2.0 & Okta SSO integration",
    isExplicitRequest: true,
    product: "Core Platform",
    segment: "Enterprise",
    source: "Sales Call Note",
    rating: 3,
    quotes: ["We need SAML 2.0 Single Sign-On with Okta", "prohibits password logins without mandatory SSO"],
  },
  {
    text: "Would love automated recurring reports sent to our leadership team via email every Monday morning at 8 AM.",
    sentiment: "positive" as const,
    sentimentScore: 0.7,
    primaryCategory: "Reporting & Export",
    painPoint: null,
    featureRequest: "Scheduled automated weekly PDF/CSV report email delivery",
    isExplicitRequest: true,
    product: "Analytics Engine",
    segment: "Mid-Market",
    source: "In-App CSAT",
    rating: 4,
    quotes: ["automated recurring reports sent to our leadership team", "every Monday morning"],
  },
  {
    text: "Can you provide bidirectional HubSpot sync? We want customer feedback scores automatically linked to contact profiles.",
    sentiment: "neutral" as const,
    sentimentScore: 0.3,
    primaryCategory: "Integrations & APIs",
    painPoint: null,
    featureRequest: "Bidirectional HubSpot CRM sync for customer contact profiles",
    isExplicitRequest: true,
    product: "Integrations Hub",
    segment: "Startup",
    source: "Intercom Chat",
    rating: 4,
    quotes: ["bidirectional HubSpot sync", "scores automatically linked to contact profiles"],
  },
  {
    text: "Feature request: Custom dashboard widgets so we can drag and drop metric cards to customize each team member's view.",
    sentiment: "positive" as const,
    sentimentScore: 0.6,
    primaryCategory: "Navigation & Customization",
    painPoint: null,
    featureRequest: "Drag-and-drop custom dashboard widgets and shareable team layouts",
    isExplicitRequest: true,
    product: "Core Platform",
    segment: "Enterprise",
    source: "Product Hunt",
    rating: 4,
    quotes: ["Custom dashboard widgets so we can drag and drop metric cards"],
  },

  // Positive Praise items
  {
    text: "The new cohort retention charts are phenomenal! Our product managers were able to uncover churn reasons in minutes. Outstanding UX.",
    sentiment: "positive" as const,
    sentimentScore: 0.95,
    primaryCategory: "Analytics & Insights",
    painPoint: null,
    featureRequest: null,
    isExplicitRequest: false,
    product: "Analytics Engine",
    segment: "Startup",
    source: "G2 Review",
    rating: 5,
    quotes: ["cohort retention charts are phenomenal", "uncover churn reasons in minutes"],
  },
  {
    text: "Great customer support! Alex from the technical team replied in 7 minutes and resolved our custom tracking script error immediately.",
    sentiment: "positive" as const,
    sentimentScore: 0.9,
    primaryCategory: "Customer Support",
    painPoint: null,
    featureRequest: null,
    isExplicitRequest: false,
    product: "Core Platform",
    segment: "Startup",
    source: "In-App CSAT",
    rating: 5,
    quotes: ["replied in 7 minutes", "resolved our custom tracking script error immediately"],
  },
  {
    text: "Extremely intuitive UI! Our junior analysts picked it up on day one without needing any specialized training courses.",
    sentiment: "positive" as const,
    sentimentScore: 0.85,
    primaryCategory: "Core UI & Usability",
    painPoint: null,
    featureRequest: null,
    isExplicitRequest: false,
    product: "Core Platform",
    segment: "Startup",
    source: "G2 Review",
    rating: 5,
    quotes: ["Extremely intuitive UI", "picked it up on day one without training"],
  },
  {
    text: "The real-time sentiment extraction is spot-on. It correctly categorized nuanced customer complaints that our previous tool missed.",
    sentiment: "positive" as const,
    sentimentScore: 0.88,
    primaryCategory: "AI Intelligence",
    painPoint: null,
    featureRequest: null,
    isExplicitRequest: false,
    product: "Analytics Engine",
    segment: "Mid-Market",
    source: "Intercom Chat",
    rating: 5,
    quotes: ["sentiment extraction is spot-on", "correctly categorized nuanced customer complaints"],
  },
  {
    text: "Clean, elegant design! The dark mode and glassmorphism elements make it a pleasure to use during morning standups.",
    sentiment: "positive" as const,
    sentimentScore: 0.92,
    primaryCategory: "Core UI & Usability",
    painPoint: null,
    featureRequest: null,
    isExplicitRequest: false,
    product: "Core Platform",
    segment: "Enterprise",
    source: "G2 Review",
    rating: 5,
    quotes: ["Clean, elegant design", "pleasure to use during morning standups"],
  },
];

// Helper to format Date into YYYY-MM-DD
function formatDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Generate 120 dynamic feedback records across the last 40 days
export function generateSyntheticFeedbackList(): FeedbackRecord[] {
  const records: FeedbackRecord[] = [];
  const baseDate = new Date("2026-10-29T12:00:00Z");

  // Daily distribution curve across the last 35 days (Oct 29 back to Sept 25)
  // Generating realistic volume variations (weekdays higher, weekends lower, peak on Oct 15)
  const daysBack = 35;
  let counter = 1;

  for (let d = daysBack; d >= 0; d--) {
    const curDate = new Date(baseDate.getTime() - d * 24 * 60 * 60 * 1000);
    const dayOfWeek = curDate.getUTCDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Volume multiplier: peak around Oct 15 (d ~ 14)
    let dailyVolume = isWeekend ? Math.floor(Math.random() * 2) + 1 : Math.floor(Math.random() * 4) + 3;
    if (d >= 12 && d <= 16) {
      dailyVolume += 5; // Surge during product launch / quarterly review week
    }

    const dateStr = formatDateStr(curDate);

    for (let v = 0; v < dailyVolume; v++) {
      const template = FEEDBACK_TEMPLATES[(counter - 1) % FEEDBACK_TEMPLATES.length];
      const hour = 8 + Math.floor(Math.random() * 12);
      const min = Math.floor(Math.random() * 60);
      const timeIso = `${dateStr}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00Z`;

      records.push({
        id: `fb-${String(counter).padStart(4, "0")}`,
        datasetId: SAMPLE_DATASET_ID,
        text: template.text,
        date: dateStr,
        segment: template.segment,
        product: template.product,
        source: template.source,
        rating: template.rating,
        createdAt: timeIso,
        analysis: {
          sentiment: template.sentiment,
          sentimentScore: template.sentimentScore,
          primaryCategory: template.primaryCategory,
          painPoint: template.painPoint,
          featureRequest: template.featureRequest,
          isExplicitRequest: template.isExplicitRequest,
          productArea: template.product,
          explanation: `Customer in ${template.segment} tier submitted feedback via ${template.source}.`,
          keyQuotes: template.quotes,
          modelUsed: "nvidia/nemotron-3.5-super-vl-120b-a12b",
          analyzedAt: timeIso,
        },
      });

      counter++;
    }
  }

  return records;
}

export const RAW_SAMPLE_FEEDBACK: FeedbackRecord[] = generateSyntheticFeedbackList();
