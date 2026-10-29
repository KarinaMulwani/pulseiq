import {
  FeedbackAnalysisSchema,
  ValidatedFeedbackAnalysis,
} from "@/lib/zod-schemas";
import { NvidiaModel } from "@/types";

export const AVAILABLE_NVIDIA_MODELS: NvidiaModel[] = [
  {
    id: "nvidia/nemotron-3.5-super-vl-120b-a12b",
    name: "Nemotron 3.5 Super VL 120B (Primary Fast)",
    contextWindow: 131072,
    category: "fast",
    recommendedFor: "Ultra-fast sentiment extraction, category tagging, and feature mining",
  },
  {
    id: "nvidia/nemotron-3.5-lightning-30b-a3b",
    name: "Nemotron 3.5 Lightning 30B (Fast)",
    contextWindow: 131072,
    category: "fast",
    recommendedFor: "High-speed reasoning and synthesis",
  },
  {
    id: "meta/llama-3.2-11b-vision-instruct",
    name: "Llama 3.2 11B Vision Instruct",
    contextWindow: 131072,
    category: "general",
    recommendedFor: "Multimodal and text extraction",
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b",
    name: "Nemotron 3 Ultra 550B",
    contextWindow: 131072,
    category: "reasoning",
    recommendedFor: "Enterprise deep reasoning and clustering",
  },
];

export interface CompletionRequest {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}

export interface CompletionResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class NvidiaClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl: string = "https://integrate.api.nvidia.com/v1") {
    this.apiKey = apiKey || process.env.NVIDIA_API_KEY || "";
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  public hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  public async chatCompletion(
    req: CompletionRequest,
    fallbackModels: string[] = [],
    timeoutMs: number = 30000
  ): Promise<CompletionResponse> {
    const modelsToTry = [req.model, ...fallbackModels.filter((m) => m !== req.model)];
    let lastError: Error | null = null;

    for (const modelId of modelsToTry) {
      try {
        const response = await this.executeWithTimeout(
          { ...req, model: modelId },
          timeoutMs
        );
        return response;
      } catch (err: any) {
        lastError = err;
        // Do not retry on permanent authentication error
        if (err.status === 401 || err.status === 403) {
          throw new Error(
            `NVIDIA NIM Authentication Error: Invalid or missing API key. (HTTP ${err.status})`
          );
        }
        // If transient, rate limited (429), or 5xx, continue to next fallback
        console.warn(`Model ${modelId} failed: ${err.message}. Trying next fallback if available...`);
      }
    }

    throw lastError || new Error("All configured NVIDIA models failed to complete request.");
  }

  private async executeWithTimeout(
    req: CompletionRequest,
    timeoutMs: number
  ): Promise<CompletionResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: req.model,
          messages: req.messages,
          temperature: req.temperature ?? 0.2,
          max_tokens: req.max_tokens ?? 2048,
          response_format: req.response_format,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        const err: any = new Error(
          `NVIDIA API request failed [${res.status}]: ${errorText || res.statusText}`
        );
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      if (!choice || !choice.message) {
        throw new Error("Invalid response schema from NVIDIA NIM endpoint");
      }

      return {
        content: choice.message.content || choice.message.reasoning_content || "",
        model: data.model || req.model,
        usage: data.usage,
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        const timeoutErr: any = new Error(`Request timed out after ${timeoutMs}ms on model ${req.model}`);
        timeoutErr.status = 408;
        throw timeoutErr;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  public async verifyConnection(): Promise<{ valid: boolean; message: string; model?: string }> {
    if (!this.hasApiKey()) {
      return {
        valid: false,
        message: "No NVIDIA NIM API key configured. Running in local synthetic demo mode.",
      };
    }

    try {
      const res = await this.chatCompletion(
        {
          model: "nvidia/nemotron-3.5-super-vl-120b-a12b",
          messages: [
            { role: "system", content: "You are a health check assistant." },
            { role: "user", content: "Respond with the single word: OK" },
          ],
          max_tokens: 30,
          temperature: 0.1,
        },
        ["nvidia/nemotron-3.5-lightning-30b-a3b", "meta/llama-3.2-11b-vision-instruct"],
        15000
      );

      return {
        valid: true,
        message: "Connected successfully to NVIDIA NIM API.",
        model: res.model,
      };
    } catch (err: any) {
      return {
        valid: false,
        message: `Connection failed: ${err.message}`,
      };
    }
  }
}
