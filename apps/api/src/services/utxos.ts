import { Kupmios } from '@blaze-cardano/sdk';
import { getBlaze } from '../lib/blaze';

function env(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing env: ${name}`);
}

/**
 * Returns UTxOs for a bech32 address.
 * Prefers Kupmios (Ogmios + Kupo) via Blaze provider; falls back to Dolos REST.
 * The returned shape is provider-native (best-effort normalization is left to callers).
 */
export async function getAddressUtxos(address: string): Promise<readonly any[]> {
  const ctx = await getBlaze();

  // Prefer Kupmios when reachable
  if (ctx.ogmiosReachable && ctx.kupoReachable) {
    const ogmiosUrl = env('OGMIOS_URL', 'http://localhost:1337');
    const kupoUrl = env('KUPO_URL', 'http://localhost:1442');
    const provider = new (Kupmios as unknown as any)({ ogmiosUrl, kupoUrl });

    if (typeof (provider as any).utxosByAddress === 'function') {
      return await (provider as any).utxosByAddress(address);
    }
    if (typeof (provider as any).utxosAt === 'function') {
      return await (provider as any).utxosAt(address);
    }
    if (typeof (provider as any).getUtxos === 'function') {
      return await (provider as any).getUtxos(address);
    }
    return await (provider as any).utxos(address);
  }

  // Fallback to Dolos REST (Blockfrost-like)
  if (ctx.dolosRestHealthy && ctx.dolosRestUrl) {
    const base = ctx.dolosRestUrl.replace(/\/$/, '');
    const url = `${base}/api/v0/addresses/${address}/utxos`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Dolos REST error: ${res.status}`);
    const utxos = await res.json().catch(() => []);
    return Array.isArray(utxos) ? utxos : [];
  }

  throw new Error('No reachable provider for utxos (Kupmios/Dolos)');
}
