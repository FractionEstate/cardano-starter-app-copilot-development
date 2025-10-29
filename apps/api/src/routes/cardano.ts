import { Router, type Request, type Response } from "express";
import { getBlaze } from "../lib/blaze.js";

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

export default router;
