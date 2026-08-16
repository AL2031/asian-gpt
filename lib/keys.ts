/**
 * Multi-key rotation + failover.
 *
 * Configure up to 10 keys per provider in Vercel's Environment Variables
 * using numbered suffixes, e.g.:
 *
 *   GROQ_API_KEY_1=gsk_xxx
 *   GROQ_API_KEY_2=gsk_yyy
 *   HF_API_KEY_1=hf_xxx
 *   HF_API_KEY_2=hf_yyy
 *   HF_API_KEY_3=hf_zzz
 *
 * (A single unsuffixed GROQ_API_KEY / HF_API_KEY also works if you only
 * have one key for a provider.)
 *
 * Every request starts on the next key in the rotation (round robin, so
 * load is spread across all configured keys) and, if that key comes back
 * rate-limited (429) or errors server-side (5xx), automatically retries
 * the same request on the next key in the pool before giving up.
 *
 * Note: on serverless platforms each cold start gets a fresh rotation
 * counter, so "round robin" is best-effort across a warm instance rather
 * than a global guarantee - the failover behavior, however, is reliable
 * on every single request.
 */

export type Provider = "groq" | "hf";

function loadKeys(prefix: string): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const val = process.env[`${prefix}_${i}`];
    if (val && val.trim()) keys.push(val.trim());
  }
  if (keys.length === 0) {
    const single = process.env[prefix];
    if (single && single.trim()) keys.push(single.trim());
  }
  return keys;
}

const pools: Record<Provider, string[]> = {
  groq: loadKeys("GROQ_API_KEY"),
  hf: loadKeys("HF_API_KEY"),
};

const cursors: Record<Provider, number> = { groq: 0, hf: 0 };

export function keyCount(provider: Provider): number {
  return pools[provider].length;
}

/**
 * Runs `buildRequest` against each configured key for `provider`, starting
 * from the next key in the rotation, until one succeeds (2xx) or a
 * non-retryable error is returned. Retries only on 429 / 5xx.
 */
export async function fetchWithKeyRotation(
  provider: Provider,
  buildRequest: (apiKey: string) => Promise<Response>
): Promise<Response> {
  const keys = pools[provider];
  if (keys.length === 0) {
    return new Response(
      JSON.stringify({
        error: `No ${provider.toUpperCase()} API keys configured`,
        detail: `Set ${provider === "groq" ? "GROQ_API_KEY_1" : "HF_API_KEY_1"} (and _2, _3, ...) in your environment.`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const startIndex = cursors[provider];
  cursors[provider] = (cursors[provider] + 1) % keys.length;

  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[(startIndex + attempt) % keys.length];
    let res: Response;
    try {
      res = await buildRequest(key);
    } catch (err) {
      // Network-level failure - try the next key.
      lastResponse = new Response(
        JSON.stringify({ error: "Upstream request failed", detail: String(err) }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
      continue;
    }

    if (res.ok) return res;

    if (res.status === 429 || res.status >= 500) {
      lastResponse = res;
      continue; // try the next key
    }

    // Non-retryable (bad request, auth, etc.) - surface it immediately.
    return res;
  }

  return lastResponse as Response;
}
