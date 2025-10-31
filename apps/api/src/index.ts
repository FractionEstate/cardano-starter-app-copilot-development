import express from "express";
import { getCardanoRateLimiter } from './middleware/rateLimit.js';
import cardanoRouter from "./routes/cardano.js";
import healthRouter from "./routes/health.js";

const app = express();
app.use(express.json());

app.use("/health", healthRouter);

// Optional rate limiting for Cardano endpoints
const limiter = getCardanoRateLimiter();
if (limiter) {
  if (process.env.RATE_LIMIT_TRUST_PROXY === 'true') app.set('trust proxy', 1);
  app.use('/cardano', limiter);
}

app.use("/cardano", cardanoRouter);

const port = Number(process.env.API_PORT || 3001);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
