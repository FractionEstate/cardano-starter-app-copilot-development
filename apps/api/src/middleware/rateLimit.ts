import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Returns an express-rate-limit middleware for Cardano routes, or null if disabled.
 *
 * Env vars:
 * - RATE_LIMIT_ENABLED: 'true' to enable; in production enabled by default unless 'false'
 * - RATE_LIMIT_WINDOW_MS: window size in ms (default 60000)
 * - RATE_LIMIT_MAX: max requests per IP per window (default 60)
 * - RATE_LIMIT_TRUST_PROXY: 'true' to set app trust proxy (caller must set it)
 */
export function getCardanoRateLimiter(): RequestHandler | null {
  const shouldEnableRateLimit = (
    process.env.RATE_LIMIT_ENABLED === 'true' ||
    (process.env.NODE_ENV === 'production' && process.env.RATE_LIMIT_ENABLED !== 'false')
  );

  if (!shouldEnableRateLimit) return null;

  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const max = Number(process.env.RATE_LIMIT_MAX ?? 60);

  return rateLimit({
    windowMs,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests' },
  });
}
