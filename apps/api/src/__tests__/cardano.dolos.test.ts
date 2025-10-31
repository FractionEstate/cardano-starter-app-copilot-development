import express from 'express';
import request from 'supertest';
import cardanoRouter from '../../src/routes/cardano';

describe('GET /cardano/dolos-status', () => {
  const app = express();
  app.use('/cardano', cardanoRouter);

  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn(async (url: string) => ({ ok: true, status: 200 })) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns Dolos reachability info', async () => {
    const res = await request(app).get('/cardano/dolos-status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.ready).toBe(true);
    expect(res.body.dolosGrpcReachable).toBe(true);
    expect(res.body.dolosRestReachable).toBe(true);
  });
});
