import { NextRequest, NextResponse } from "next/server";
import { NvidiaClient } from "@/lib/ai/nvidia-client";
import { FeedbackAnalysisSchema } from "@/lib/zod-schemas";

const SYSTEM_ANALYSIS_PROMPT = `You are PulseIQ's AI Product Feedback & Feature Request Miner.
Analyze customer feedback entries objectively and extract structured insights.

CRITICAL ANALYTICAL RULES:
1. Ground truth only: Base all sentiment, categories, pain points, and requests strictly on the provided customer text. NEVER invent facts or customer details.
2. Sentiment: Classify as "positive", "neutral", or "negative". Provide sentimentScore between -1.0 (very negative) and 1.0 (very positive).
3. Primary Category: Choose a concise, normalized category (e.g., "Performance", "Navigation & UI", "Integrations", "Billing & Subscriptions", "Onboarding", "Mobile App", "Reporting & Export", "API & Developers", "Notifications").
4. Pain Point: Extract the specific customer friction point if present, else null.
5. Feature Request: Extract explicit or strongly implied requests. If none, set to null.
6. isExplicitRequest: Set to true ONLY if the customer explicitly asks for a feature (e.g. "please add", "we need", "feature request:", "would love to have"). Set to false if it's an inferred opportunity or pain point.
7. Product Area: Identifiable module (e.g., "Analytics Engine", "User Management", "Billing", "Mobile", "Core UI", "Integrations").
8. Explanation: 1-2 concise sentences explaining the classification.
9. keyQuotes: Extract 1-2 exact verbatim substrings from the customer's text supporting your findings.

You MUST respond strictly with valid JSON adhering to this schema:
{
  "analyses": [
    {
      "id": "item-id",
      "sentiment": "positive" | "neutral" | "negative",
      "sentimentScore": -0.8,
      "primaryCategory": "Performance",
      "painPoint": "Dashboard takes 15+ seconds to load with large datasets",
      "featureRequest": "Background report generation or caching",
      "isExplicitRequest": false,
      "productArea": "Analytics Engine",
      "explanation": "Customer expresses frustration with loading latency when dealing with large volumes of data.",
      "keyQuotes": ["takes over 15 seconds to load", "freezes during peak hours"]
    }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, model = "nvidia/nemotron-3.5-super-vl-120b-a12b", apiKey: clientApiKey } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Limit batch size to prevent serverless timeout
    if (items.length > 15) {
      return NextResponse.json(
        { error: "Batch size exceeds limit of 15 items per serverless request" },
        { status: 400 }
      );
    }

    const effectiveApiKey = clientApiKey || process.env.NVIDIA_API_KEY;
    const client = new NvidiaClient(effectiveApiKey);

    if (!client.hasApiKey()) {
      return NextResponse.json(
        {
          error: "NVIDIA NIM API key is not configured. Provide it in Settings or via NVIDIA_API_KEY environment variable.",
        },
        { status: 401 }
      );
    }

    const response = await client.chatCompletion(
      {
        model,
        messages: [
          { role: "system", content: SYSTEM_ANALYSIS_PROMPT },
          {
            role: "user",
            content: `Analyze these feedback entries:\n${JSON.stringify(items, null, 2)}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 1536,
      },
      ["nvidia/nemotron-3.5-lightning-30b-a3b", "meta/llama-3.2-11b-vision-instruct"],
      28000
    );

    const content = response.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    const rawList = parsed.analyses || parsed.items || (Array.isArray(parsed) ? parsed : []);

    const validatedResults = rawList.map((item: any) => {
      const v = FeedbackAnalysisSchema.safeParse(item);
      return {
        id: item.id,
        success: v.success,
        analysis: v.success ? v.data : null,
        error: v.success ? null : v.error.message,
      };
    });

    return NextResponse.json({
      modelUsed: response.model,
      analyses: validatedResults,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error("API /api/analyze error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze feedback batch" },
      { status: error.status || 500 }
    );
  }
}
