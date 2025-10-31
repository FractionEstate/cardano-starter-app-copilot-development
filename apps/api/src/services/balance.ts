import { Kupmios } from '@blaze-cardano/sdk';
import { getBlaze } from '../lib/blaze';

function env(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing env: ${name}`);
}

/**
 * Returns total lovelace balance for a given bech32 address by summing UTxOs.
 * This uses Kupmios (Ogmios + Kupo) via Blaze provider. Loosely typed for SDK compatibility.
 */
export async function getAddressBalance(address: string): Promise<bigint> {
  const ctx = await getBlaze();
  // Try Kupmios first if reachable
  if (ctx.ogmiosReachable && ctx.kupoReachable) {
    const ogmiosUrl = env('OGMIOS_URL', 'http://localhost:1337');
    const kupoUrl = env('KUPO_URL', 'http://localhost:1442');
    const provider = new (Kupmios as unknown as any)({ ogmiosUrl, kupoUrl });

    let utxos: any[] = [];
    if (typeof (provider as any).utxosByAddress === 'function') {
      utxos = await (provider as any).utxosByAddress(address);
    } else if (typeof (provider as any).utxosAt === 'function') {
      utxos = await (provider as any).utxosAt(address);
    } else if (typeof (provider as any).getUtxos === 'function') {
      utxos = await (provider as any).getUtxos(address);
    } else {
      utxos = await (provider as any).utxos(address);
    }

    const total = utxos.reduce((acc: bigint, u: any) => {
      const fromAssets = (u?.assets?.lovelace) ?? 0n;
      const fromValueCoins = u?.value?.coins ? BigInt(u.value.coins) : 0n;
      const fromAmount = u?.amount ? BigInt(u.amount) : 0n;
      return acc + (typeof fromAssets === 'bigint' ? fromAssets : BigInt(fromAssets)) + fromValueCoins + fromAmount;
    }, 0n);
    return total;
  }

  // Fallback to Dolos REST (Blockfrost-like) if healthy
  if (ctx.dolosRestHealthy && ctx.dolosRestUrl) {
    const base = ctx.dolosRestUrl.replace(/\/$/, '');
    const url = `${base}/api/v0/addresses/${address}/utxos`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Dolos REST error: ${res.status}`);
    const utxos = await res.json().catch(() => [] as any[]);
    const total = (Array.isArray(utxos) ? utxos : []).reduce((acc: bigint, u: any) => {
      // Blockfrost-like: amount: [{ unit: 'lovelace', quantity: '123' }, ...]
      if (Array.isArray(u?.amount)) {
        const lovelace = u.amount.find((a: any) => a?.unit === 'lovelace');
        const qty = lovelace?.quantity ? BigInt(lovelace.quantity) : 0n;
        return acc + qty;
      }
      // Try other shapes
      const fromAssets = (u?.assets?.lovelace) ?? 0n;
      const fromValueCoins = u?.value?.coins ? BigInt(u.value.coins) : 0n;
      const fromAmount = u?.amount ? BigInt(u.amount) : 0n;
      return acc + (typeof fromAssets === 'bigint' ? fromAssets : BigInt(fromAssets)) + fromValueCoins + fromAmount;
    }, 0n);
    return total;
  }

  throw new Error('No reachable provider for balance (Kupmios/Dolos)');
}
