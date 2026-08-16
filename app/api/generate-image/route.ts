import { NextRequest, NextResponse } from "next/server";
import { hfInfer } from "@/lib/hf";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let payload: { prompt?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = payload.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "`prompt` is required" }, { status: 400 });
  }

  const model = process.env.HF_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";

  const upstream = await hfInfer(model, { inputs: prompt });

  if (!upstream.ok) {
    const detail = await safeText(upstream);
    return NextResponse.json(
      { error: "Image generation failed", detail },
      { status: upstream.status || 500 }
    );
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    // HF sometimes returns JSON (e.g. an error object) with a 200 status.
    const detail = await safeText(upstream);
    return NextResponse.json({ error: "Unexpected response from model", detail }, { status: 502 });
  }

  const buffer = await upstream.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  return NextResponse.json({ image: `data:${contentType};base64,${base64}` });
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
