import express from 'express';
import request from 'supertest';
import cardanoRouter from '../../src/routes/cardano';

describe('GET /cardano/dolos/version', () => {
  const app = express();
  app.use('/cardano', cardanoRouter);

  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => ({ url: '[::]:3000', version: '1.0.0-beta.x', revision: 'abcdef' }),
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('proxies Dolos root and returns version info', async () => {
    const res = await request(app).get('/cardano/dolos/version');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ url: '[::]:3000', version: '1.0.0-beta.x', revision: 'abcdef' });
  });
});
