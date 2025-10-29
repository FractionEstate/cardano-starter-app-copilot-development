import { Router } from "express";

const router = Router();

// Placeholder endpoint for Blaze integration
router.get("/protocol-params", async (_req, res) => {
  try {
    // TODO: fetch via Blaze provider once configured
    res.json({ message: "Protocol params placeholder" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
