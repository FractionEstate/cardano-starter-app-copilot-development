import express from 'express';
import request from 'supertest';
import cardanoRouter from '../../src/routes/cardano';

describe('GET /cardano/readiness', () => {
  const app = express();
  app.use('/cardano', cardanoRouter);

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns 503 when no providers reachable and Dolos health is bad', async () => {
    // Any fetch returns 503 -> ping/health false
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: false, status: 503 })) as unknown as typeof fetch;
    const res = await request(app).get('/cardano/readiness');
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.ready).toBe(false);
  });

  it('returns 200 when Dolos health is good even if Kupmios is down', async () => {
    // Simulate Dolos health OK (for /api/v0/health), others not ok
    // @ts-ignore
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as URL).toString();
      if (url.includes('/api/v0/health')) {
        return { ok: true, status: 200, json: async () => ({ is_healthy: true }) } as any;
      }
      return { ok: false, status: 503 } as any;
    }) as unknown as typeof fetch;
    const res = await request(app).get('/cardano/readiness');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.ready).toBe(true);
  });

  it('returns 200 when both Ogmios and Kupo are reachable', async () => {
    // All pings OK
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
    const res = await request(app).get('/cardano/readiness');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.ready).toBe(true);
  });
});
