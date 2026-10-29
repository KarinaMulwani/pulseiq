import { NextRequest, NextResponse } from "next/server";
import { AVAILABLE_NVIDIA_MODELS, NvidiaClient } from "@/lib/ai/nvidia-client";

export async function GET() {
  const serverKeyConfigured = Boolean(
    process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.length > 5
  );

  return NextResponse.json({
    models: AVAILABLE_NVIDIA_MODELS,
    serverKeyConfigured,
    defaultPrimary: "nvidia/nemotron-3.5-super-vl-120b-a12b",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey } = body;

    const client = new NvidiaClient(apiKey || process.env.NVIDIA_API_KEY);
    const result = await client.verifyConnection();

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, message: error.message || "Failed to verify NVIDIA NIM connection" },
      { status: 500 }
    );
  }
}
