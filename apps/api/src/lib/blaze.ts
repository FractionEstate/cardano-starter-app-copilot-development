// Minimal, env-driven Kupmios setup via Ogmios + Kupo endpoints.
// We keep this lightweight: no wallet yet, just readiness + endpoints.

export interface BlazeContext {
  readonly ready: boolean;
  readonly ogmiosUrl?: string;
  readonly kupoUrl?: string;
}

function getEnv(name: string): string | undefined {
  return typeof process !== "undefined" ? process.env[name] : undefined;
}

function withDefault(url: string | undefined, fallback: string): string {
  return url && url.length > 0 ? url : fallback;
}

async function ping(url: string, timeoutMs = 1500): Promise<boolean> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    clearTimeout(t);
    return res.ok || res.status < 500; // treat any non-5xx as reachable
  } catch {
    return false;
  }
}

/**
 * Returns basic readiness info and the configured endpoints.
 * If env vars are not provided, defaults to localhost ports used by docker-compose.
 *
 * Env:
 * - OGMIOS_URL: http(s)://host:port (default http://localhost:1337)
 * - KUPO_URL:   http(s)://host:port (default http://localhost:1442)
 */
export async function getBlaze(): Promise<BlazeContext> {
  const ogmiosUrl = withDefault(getEnv("OGMIOS_URL"), "http://localhost:1337");
  const kupoUrl = withDefault(getEnv("KUPO_URL"), "http://localhost:1442");

  // Quick reachability checks (non-fatal)
  const [ogOk, kpOk] = await Promise.all([
    ping(ogmiosUrl),
    ping(kupoUrl)
  ]);

  return {
    ready: ogOk && kpOk,
    ogmiosUrl,
    kupoUrl
  };
}
