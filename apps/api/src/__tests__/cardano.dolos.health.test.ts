import express from 'express';
import request from 'supertest';
import cardanoRouter from '../../src/routes/cardano';

describe('GET /cardano/dolos/health', () => {
  const app = express();
  app.use('/cardano', cardanoRouter);

  beforeEach(() => {
    // Mock the chained calls: first to getBlaze() internals (ping), then to the Dolos REST /health
    // Our route only uses fetch for the health call; getBlaze uses fetch too but we don't enforce it here).
    // Provide a default mock that returns ok JSON
    // @ts-ignore
    global.fetch = jest.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => ({ is_healthy: true }),
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('proxies Dolos health and returns data', async () => {
    const res = await request(app).get('/cardano/dolos/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ is_healthy: true });
  });
});
