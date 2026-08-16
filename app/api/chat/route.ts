import { NextRequest } from "next/server";
import { fetchWithKeyRotation } from "@/lib/keys";

export const runtime = "nodejs";

const SYSTEM_PROMPT =
  "You are AsianGPT, a helpful, warm, and precise AI assistant. Give clear, well-organized answers.";

export async function POST(req: NextRequest) {
  let payload: { messages?: { role: string; content: string }[]; model?: string };
  try {
    payload = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { messages, model } = payload;
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonError("`messages` must be a non-empty array", 400);
  }

  const chosenModel = model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const upstream = await fetchWithKeyRotation("groq", (key) =>
    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: chosenModel,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
        temperature: 0.7,
      }),
    })
  );

  if (!upstream.ok || !upstream.body) {
    const detail = await safeText(upstream);
    return jsonError("Chat request failed", upstream.status || 500, detail);
  }

  // Pass the upstream SSE stream straight through to the client.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function jsonError(error: string, status: number, detail?: string) {
  return new Response(JSON.stringify({ error, detail }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
