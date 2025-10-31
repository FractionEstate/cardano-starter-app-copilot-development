// Minimal, env-driven Kupmios setup via Ogmios + Kupo endpoints.
// We keep this lightweight: no wallet yet, just readiness + endpoints.

export interface BlazeContext {
  readonly ready: boolean;
  readonly ogmiosUrl?: string;
  readonly kupoUrl?: string;
  readonly ogmiosReachable: boolean;
  readonly kupoReachable: boolean;
  readonly dolosGrpcUrl?: string;
  readonly dolosRestUrl?: string;
  readonly dolosGrpcReachable: boolean; // best-effort only
  readonly dolosRestReachable: boolean; // base URL ping
  readonly dolosRestHealthy: boolean;   // /health
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

async function health(url: string, timeoutMs = 2000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) return false;
    // Accept either JSON with { is_healthy: true } or plain 200
    try {
      const data = await res.json();
      return Boolean((data as { is_healthy?: boolean }).is_healthy ?? true);
    } catch {
      return true;
    }
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
  const dolosGrpcUrl = withDefault(getEnv("DOLOS_GRPC_URL"), "http://localhost:50051");
  const dolosRestUrl = withDefault(getEnv("DOLOS_REST_URL"), "http://localhost:4000");
  // Dolos minibf exposes a Blockfrost-like health endpoint at /health
  const dolosRestHealthUrl = `${dolosRestUrl?.replace(/\/$/, "")}/health`;

  // Quick reachability checks (non-fatal)
  const [ogOk, kpOk, dgOk, drOk, drHealth] = await Promise.all([
    ping(ogmiosUrl),
    ping(kupoUrl),
    ping(dolosGrpcUrl),
    ping(dolosRestUrl),
    health(dolosRestHealthUrl),
  ]);

  return {
    ready: (ogOk && kpOk) || drHealth,
    ogmiosUrl,
    kupoUrl,
    ogmiosReachable: ogOk,
    kupoReachable: kpOk,
    dolosGrpcUrl,
    dolosRestUrl,
    dolosGrpcReachable: dgOk,
    dolosRestReachable: drOk,
    dolosRestHealthy: drHealth,
  };
}
