import express from 'express';
import request from 'supertest';
import { getCardanoRateLimiter } from '../../src/middleware/rateLimit';
import cardanoRouter from '../../src/routes/cardano';

describe('rate limiting for /cardano routes', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    // Enable limiter with tight window
    process.env.RATE_LIMIT_ENABLED = 'true';
    process.env.RATE_LIMIT_WINDOW_MS = '1000';
    process.env.RATE_LIMIT_MAX = '2';
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.resetAllMocks();
  });

  it('returns 429 after exceeding limit', async () => {
    const app = express();
    app.use(express.json());
    const limiter = getCardanoRateLimiter();
    if (limiter) app.use('/cardano', limiter);
    app.use('/cardano', cardanoRouter);

    // First two requests should pass
    const r1 = await request(app).get('/cardano/status');
    expect(r1.status).toBe(200);
    const r2 = await request(app).get('/cardano/status');
    expect(r2.status).toBe(200);

    // Third should be rate-limited
    const r3 = await request(app).get('/cardano/status');
    expect(r3.status).toBe(429);
    expect(r3.body).toMatchObject({ success: false, error: 'Too many requests' });
  });
});
