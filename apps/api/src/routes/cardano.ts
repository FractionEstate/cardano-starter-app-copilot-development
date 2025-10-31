import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { getBlaze } from "../lib/blaze";
import { buildUnsignedFromDsl, buildUnsignedSendAda, getAddressBalance, getAddressUtxos } from '../services';

const router = Router();

// Basic Bech32-ish address validation (accepts addr... and addr_test...)
const addressSchema = z.string().min(10).regex(/^addr[a-z0-9_]*[a-z0-9]+$/i, 'Invalid address format');

const sendAdaSchema = z.object({
  fromAddress: addressSchema,
  toAddress: addressSchema,
  lovelace: z.preprocess((v: unknown) => (
    typeof v === 'string' ? BigInt(v) : typeof v === 'number' ? BigInt(v) : v
  ), z.bigint().refine((v: bigint) => v > 0n, 'Amount must be > 0'))
});

// Helpers
const bigintFromJSON = z.preprocess((v: unknown) => (
  typeof v === 'string' ? BigInt(v) : typeof v === 'number' ? BigInt(v) : v
), z.bigint());
const positiveBigint = bigintFromJSON.refine((v: bigint) => v > 0n, 'Amount must be > 0');
const assetsRecord = z.record(z.string(), z.union([z.string(), z.number(), z.bigint()]));
// Stricter schemas for mint/burn and signer hashes
const policyIdSchema = z.string().regex(/^[0-9a-fA-F]{56}$/u, 'Invalid policyId (expected 56-hex)');
const assetIdKey = z.string().regex(/^[0-9a-fA-F]{56}\.[0-9a-fA-F]+$/u, 'Invalid asset id key (<policy>.<assetHex>)');
const strictAssetsRecord = z.record(assetIdKey, z.union([z.string(), z.number(), z.bigint()]));

// Action schemas (loose but safe)
const action_payLovelace = z.object({
  type: z.literal('payLovelace'),
  toAddress: addressSchema,
  lovelace: positiveBigint,
});
const action_payAssets = z.object({
  type: z.literal('payAssets'),
  toAddress: addressSchema,
  assets: assetsRecord,
});
const action_payMany = z.object({
  type: z.literal('payMany'),
  outputs: z.array(z.object({
    toAddress: addressSchema,
    lovelace: bigintFromJSON.optional(),
    assets: assetsRecord.optional(),
  })).min(1)
});
const action_metadata = z.object({
  type: z.literal('metadata'),
  label: z.number().int().nonnegative(),
  metadata: z.unknown(),
});
const action_validity = z.object({
  type: z.literal('validity'),
  validFrom: bigintFromJSON.optional(),
  validTo: bigintFromJSON.optional(),
});
const action_requiredSigner = z.object({
  type: z.literal('requiredSigner'),
  keyHash: z.string().regex(/^[0-9a-fA-F]{56}$/u, 'Invalid keyHash (expected 56-hex)'),
});
const action_changeAddress = z.object({
  type: z.literal('changeAddress'),
  changeAddress: addressSchema,
});
const action_collateral = z.object({
  type: z.literal('collateral'),
  // keep loose: allow either explicit fields or a provider-native shape
  txHash: z.string().optional(),
  index: z.number().int().nonnegative().optional(),
  utxos: z.any().optional(),
}).refine((v) => v.txHash !== undefined || v.utxos !== undefined, { message: 'collateral requires txHash/index or utxos' });
const action_referenceInput = z.object({
  type: z.literal('referenceInput'),
  txHash: z.string().optional(),
  index: z.number().int().nonnegative().optional(),
  utxo: z.any().optional(),
}).refine((v) => (v.txHash !== undefined && v.index !== undefined) || v.utxo !== undefined, { message: 'referenceInput requires txHash/index or utxo' });
const action_spendUtxo = z.object({
  type: z.literal('spendUtxo'),
  txHash: z.string().optional(),
  index: z.number().int().nonnegative().optional(),
  utxo: z.any().optional(),
  redeemer: z.unknown().optional(),
}).refine((v) => (v.txHash !== undefined && v.index !== undefined) || v.utxo !== undefined, { message: 'spendUtxo requires txHash/index or utxo' });
const action_mint = z.object({
  type: z.literal('mint'),
  policyId: policyIdSchema,
  assets: strictAssetsRecord,
  redeemer: z.unknown().optional(),
});
const action_burn = z.object({
  type: z.literal('burn'),
  policyId: policyIdSchema,
  assets: strictAssetsRecord,
  redeemer: z.unknown().optional(),
});
const action_attachScript = z.object({
  type: z.literal('attachScript'),
  scriptCbor: z.string().min(4),
}).passthrough();
const action_stakeRegister = z.object({
  type: z.literal('stakeRegister'),
  stakeAddress: z.string().min(10),
});
const action_stakeDeregister = z.object({
  type: z.literal('stakeDeregister'),
  stakeAddress: z.string().min(10),
});
const action_withdrawRewards = z.object({
  type: z.literal('withdrawRewards'),
  stakeAddress: z.string().min(10),
  amount: positiveBigint.optional(),
});
const action_feePolicy = z.object({
  type: z.literal('feePolicy'),
  strategy: z.string().optional(),
  multiplier: z.number().positive().optional(),
}).passthrough();

const actionUnion = z.union([
  action_payLovelace,
  action_payAssets,
  action_payMany,
  action_metadata,
  action_validity,
  action_requiredSigner,
  action_changeAddress,
  action_collateral,
  action_referenceInput,
  action_spendUtxo,
  action_mint,
  action_burn,
  action_attachScript,
  action_stakeRegister,
  action_stakeDeregister,
  action_withdrawRewards,
  action_feePolicy,
]);

const dslSchema = z.object({
  fromAddress: addressSchema,
  actions: z.array(actionUnion).min(1)
});

// Simple readiness + endpoints info
router.get("/status", async (_req: Request, res: Response) => {
  try {
    const ctx = await getBlaze();
    res.json({ success: true, ...ctx });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Strict readiness suitable for probes: 200 when ready, 503 otherwise
router.get("/readiness", async (_req: Request, res: Response) => {
  try {
    const ctx = await getBlaze();
    const status = ctx.ready ? 200 : 503;
    res.status(status).json({ success: ctx.ready, ...ctx });
  } catch (error) {
    res.status(503).json({ success: false, error: (error as Error).message });
  }
});

// Placeholder endpoint for Blaze integration
router.get("/protocol-params", async (_req: Request, res: Response) => {
  try {
    // TODO: fetch via Blaze provider once configured
    res.status(501).json({ message: "Not implemented yet" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Surface Dolos-only readiness (useful when not using Kupmios)
router.get("/dolos-status", async (_req: Request, res: Response) => {
  try {
    const ctx = await getBlaze();
    res.json({
      success: true,
      ready: ctx.dolosRestHealthy,
      dolosGrpcUrl: ctx.dolosGrpcUrl,
      dolosRestUrl: ctx.dolosRestUrl,
      dolosGrpcReachable: ctx.dolosGrpcReachable,
      dolosRestReachable: ctx.dolosRestReachable,
      dolosRestHealthy: ctx.dolosRestHealthy,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Proxy Dolos REST health (Blockfrost-like)
router.get("/dolos/health", async (_req: Request, res: Response) => {
  try {
    const ctx = await getBlaze();
    const base = ctx.dolosRestUrl ?? "http://localhost:4000";
    const url = `${base.replace(/\/$/, "")}/health`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ success: false, status: response.status });
    }
    const json = await response.json().catch(() => ({}));
    return res.json({ success: true, url, data: json });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Proxy Dolos REST version/info (root of minibf)
router.get("/dolos/version", async (_req: Request, res: Response) => {
  try {
    const ctx = await getBlaze();
    const base = ctx.dolosRestUrl ?? "http://localhost:4000";
    const url = `${base.replace(/\/$/, "")}/`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ success: false, status: response.status });
    }
    const json = await response.json().catch(() => ({}));
    return res.json({ success: true, url, data: json });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Build unsigned transaction to send ADA (WASM-free frontend pattern)
router.post('/txs/build/send-ada', async (req: Request, res: Response) => {
  try {
    const parsed = sendAdaSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid payload', issues: parsed.error.flatten() });
    }
    const { fromAddress, toAddress, lovelace: amount } = parsed.data;

    // Prefer Kupmios (Ogmios + Kupo). For now required for tx building.
    const info = await getBlaze();
    if (!(info.ogmiosReachable && info.kupoReachable)) {
      return res.status(503).json({ success: false, error: 'Kupmios (Ogmios + Kupo) not reachable' });
    }

    const unsignedCbor = await buildUnsignedSendAda(fromAddress, toAddress, amount);
    return res.json({ success: true, unsignedCbor });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to build transaction' });
  }
});

// Address balance (lovelace) lookup
router.get('/address/:address/balance', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const parsed = addressSchema.safeParse(address);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid address' });
    }

    const lovelace = await getAddressBalance(address);
    return res.json({ success: true, lovelace: lovelace.toString() });
  } catch (error) {
    const msg = (error as Error)?.message || 'Failed to fetch balance';
    const status = msg.includes('No reachable provider') ? 503 : 500;
    return res.status(status).json({ success: false, error: msg });
  }
});

// Address UTxOs (generic shape; best-effort normalization)
router.get('/address/:address/utxos', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const parsed = addressSchema.safeParse(address);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid address' });
    }

    const utxos = await getAddressUtxos(address);
    return res.json({ success: true, utxos });
  } catch (error) {
    const msg = (error as Error)?.message || 'Failed to fetch utxos';
    const status = msg.includes('No reachable provider') ? 503 : 500;
    return res.status(status).json({ success: false, error: msg });
  }
});

export default router;

// Generic transaction builder using Blaze; accepts a JSON DSL of actions
router.post('/txs/build', async (req: Request, res: Response) => {
  try {
    const parsedTop = dslSchema.safeParse(req.body ?? {});
    if (!parsedTop.success) {
      return res.status(400).json({ success: false, error: 'Invalid payload', issues: parsedTop.error.flatten() });
    }
    const { fromAddress, actions } = parsedTop.data;

    // For building transactions, Kupmios (Ogmios+Kupo) must be reachable
    const info = await getBlaze();
    if (!(info.ogmiosReachable && info.kupoReachable)) {
      return res.status(503).json({ success: false, error: 'Kupmios (Ogmios + Kupo) not reachable' });
    }

    const unsignedCbor = await buildUnsignedFromDsl(fromAddress, actions);
    return res.json({ success: true, unsignedCbor });
  } catch (error) {
    const message = (error as Error)?.message || 'Failed to build transaction';
    return res.status(400).json({ success: false, error: message });
  }
});
