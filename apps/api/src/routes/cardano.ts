import { Router, type Request, type Response } from "express";
import { getBlaze } from "../lib/blaze";
import { buildUnsignedFromDsl, buildUnsignedSendAda, getAddressBalance } from '../services';

const router = Router();

// Simple readiness + endpoints info
router.get("/status", async (_req: Request, res: Response) => {
  try {
    const ctx = await getBlaze();
    res.json({ success: true, ...ctx });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
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
    const url = `${base.replace(/\/$/, "")}/api/v0/health`;
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
    const { fromAddress, toAddress, lovelace } = req.body ?? {};

    if (typeof fromAddress !== 'string' || !fromAddress.startsWith('addr')) {
      return res.status(400).json({ success: false, error: 'Invalid fromAddress' });
    }
    if (typeof toAddress !== 'string' || !toAddress.startsWith('addr')) {
      return res.status(400).json({ success: false, error: 'Invalid toAddress' });
    }
    const amount = typeof lovelace === 'string' ? BigInt(lovelace) : typeof lovelace === 'number' ? BigInt(lovelace) : null;
    if (amount === null || amount <= 0n) {
      return res.status(400).json({ success: false, error: 'Invalid lovelace amount' });
    }

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
    if (typeof address !== 'string' || !address.startsWith('addr')) {
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

export default router;

// Generic transaction builder using Blaze; accepts a JSON DSL of actions
router.post('/txs/build', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const { fromAddress, actions } = body;
    if (typeof fromAddress !== 'string' || !fromAddress.startsWith('addr')) {
      return res.status(400).json({ success: false, error: 'Invalid fromAddress' });
    }
    if (!Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ success: false, error: 'No actions provided' });
    }

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
