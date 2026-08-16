import { fetchWithKeyRotation } from "./keys";

/**
 * Calls a Hugging Face Inference API model, rotating across configured
 * HF_API_KEY_* keys and transparently retrying once if the model is still
 * "warming up" (HF returns 503 with an estimated_time while it loads the
 * model onto a worker).
 */
export async function hfInfer(
  model: string,
  body: Record<string, unknown>
): Promise<Response> {
  const request = (key: string) =>
    fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "X-Wait-For-Model": "true",
      },
      body: JSON.stringify(body),
    });

  let res = await fetchWithKeyRotation("hf", request);

  if (res.status === 503) {
    try {
      const info = await res.clone().json();
      const waitMs = Math.min(Math.max((info?.estimated_time ?? 4) * 1000, 1500), 15000);
      await new Promise((r) => setTimeout(r, waitMs));
      res = await fetchWithKeyRotation("hf", request);
    } catch {
      // If we can't parse the 503 body, fall through and return it as-is.
    }
  }

  return res;
}
