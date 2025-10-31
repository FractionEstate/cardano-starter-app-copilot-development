import { Router, type Request, type Response } from "express";
import { getBlaze } from "../lib/blaze";

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

export default router;
