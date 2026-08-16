import { NextRequest, NextResponse } from "next/server";
import { hfInfer } from "@/lib/hf";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let payload: { prompt?: string; image?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = payload.prompt?.trim();
  const image = payload.image;
  if (!prompt || !image) {
    return NextResponse.json({ error: "`prompt` and `image` are both required" }, { status: 400 });
  }

  // Strip the data: URL prefix if present - the API wants raw base64.
  const base64Data = image.includes(",") ? image.split(",")[1] : image;

  const model = process.env.HF_EDIT_MODEL || "timbrooks/instruct-pix2pix";

  const upstream = await hfInfer(model, {
    inputs: base64Data,
    parameters: { prompt },
  });

  if (!upstream.ok) {
    const detail = await safeText(upstream);
    return NextResponse.json(
      { error: "Image edit failed", detail },
      { status: upstream.status || 500 }
    );
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
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
