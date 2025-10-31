import express from 'express';
import request from 'supertest';
import cardanoRouter from '../../src/routes/cardano';

jest.mock('../../src/services/balance', () => ({
  getAddressBalance: jest.fn(async () => 5_500_000n)
}));

describe('GET /cardano/address/:address/balance', () => {
  const app = express();
  app.use(express.json());
  app.use('/cardano', cardanoRouter);

  beforeEach(() => {
    // Make Kupmios reachable
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
  });

  afterEach(() => jest.resetAllMocks());

  it('returns lovelace string for valid address when Kupmios reachable', async () => {
    const res = await request(app)
      .get('/cardano/address/addr_test1qpxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/balance');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, lovelace: '5500000' });
  });

  it('400 on invalid address', async () => {
    const res = await request(app).get('/cardano/address/not-an-addr/balance');
    expect(res.status).toBe(400);
  });
});
