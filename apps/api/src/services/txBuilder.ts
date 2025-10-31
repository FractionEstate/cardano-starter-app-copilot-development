import { Blaze, ColdWallet, Core, Kupmios } from '@blaze-cardano/sdk';

function env(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing env: ${name}`);
}

export interface TxAction {
  // one of the supported types
  type: string;
  // flexible payloads depending on action type
  [key: string]: unknown;
}

/**
 * Try calling one of the candidate method names on the builder with args.
 * Returns the builder (for chaining). Throws if no method exists.
 */
function callAny(builder: any, candidates: string[], ...args: unknown[]): any {
  for (const name of candidates) {
    const fn = builder?.[name];
    if (typeof fn === 'function') {
      return fn.apply(builder, args);
    }
  }
  throw new Error(`Unsupported action: none of methods [${candidates.join(', ')}] found`);
}

/**
 * Builds an unsigned transaction CBOR using Blaze from a generic JSON DSL of actions.
 * This function uses loose typing and dynamic method names to remain resilient across SDK versions.
 */
export async function buildUnsignedFromDsl(fromAddress: string, actions: ReadonlyArray<TxAction>): Promise<string> {
  const ogmiosUrl = env('OGMIOS_URL', 'http://localhost:1337');
  const kupoUrl = env('KUPO_URL', 'http://localhost:1442');

  const provider = new (Kupmios as unknown as any)({ ogmiosUrl, kupoUrl });
  const from = (Core as any).addressFromBech32(fromAddress);
  const wallet = new (ColdWallet as unknown as any)(from, 0, provider);
  const blaze = await (Blaze as any).from(provider, wallet);
  let builder: any = blaze.newTransaction();

  for (const action of actions) {
    switch (action.type) {
      case 'payLovelace': {
        const toAddr = String(action.toAddress);
        const lovelace = BigInt(String(action.lovelace));
        const to = (Core as any).addressFromBech32(toAddr);
        builder = callAny(builder, ['payLovelace'], to, lovelace);
        break;
      }
      case 'payAssets': {
        const toAddr = String(action.toAddress);
        const to = (Core as any).addressFromBech32(toAddr);
        const assets = action.assets as any; // expect array of asset entries
        builder = callAny(builder, ['payAssets', 'payTokens'], to, assets);
        break;
      }
      case 'mint': {
        const mint = action.mint as any; // expect array of assets with policy and name
        const redeemer = (action as any).redeemer;
        builder = callAny(builder, ['mintAssets', 'mint'], mint, redeemer);
        break;
      }
      case 'burn': {
        const burn = action.burn as any;
        const redeemer = (action as any).redeemer;
        builder = callAny(builder, ['burnAssets', 'burn'], burn, redeemer);
        break;
      }
      case 'metadata': {
        const label = Number(action.label ?? 721);
        const metadata = action.metadata;
        builder = callAny(builder, ['addMetadata', 'metadata', 'attachMetadata'], label, metadata);
        break;
      }
      case 'validity': {
        if ((action as any).validFrom !== undefined) {
          const fromSlot = BigInt(String((action as any).validFrom));
          builder = callAny(builder, ['validFrom'], fromSlot);
        }
        if ((action as any).validTo !== undefined) {
          const toSlot = BigInt(String((action as any).validTo));
          builder = callAny(builder, ['validTo', 'ttl'], toSlot);
        }
        break;
      }
      case 'requiredSigner': {
        const signer = String((action as any).keyHash ?? (action as any).pubKeyHash ?? '');
        if (!signer) throw new Error('requiredSigner requires keyHash');
        builder = callAny(builder, ['addRequiredSigner', 'requiredSigner'], signer);
        break;
      }
      case 'changeAddress': {
        const addr = (Core as any).addressFromBech32(String((action as any).address));
        builder = callAny(builder, ['changeAddress', 'setChangeAddress'], addr);
        break;
      }
      case 'collateral': {
        const refs = (action as any).utxos;
        builder = callAny(builder, ['collateral', 'setCollateral'], refs);
        break;
      }
      case 'referenceInput': {
        const ref = (action as any).utxo;
        builder = callAny(builder, ['referenceInput', 'readFrom'], ref);
        break;
      }
      case 'spendUtxo': {
        const ref = (action as any).utxo;
        const redeemer = (action as any).redeemer;
        builder = callAny(builder, ['spendUtxo', 'collectFrom'], ref, redeemer);
        break;
      }
      case 'attachScript': {
        const script = (action as any).script;
        builder = callAny(builder, ['attachScript', 'attachSpendingValidator', 'attachMintingPolicy'], script);
        break;
      }
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  const tx = await builder.complete();
  return tx.toCbor();
}
