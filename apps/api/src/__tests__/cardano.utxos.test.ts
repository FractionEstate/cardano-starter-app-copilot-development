import express from 'express';
import request from 'supertest';
import cardanoRouter from '../../src/routes/cardano';

jest.mock('../../src/services/utxos', () => ({
  getAddressUtxos: jest.fn(async () => ([
    { tx_hash: 'abc', output_index: 0, amount: [{ unit: 'lovelace', quantity: '1000000' }] },
    { tx_hash: 'def', output_index: 1, amount: [{ unit: 'lovelace', quantity: '2000000' }] },
  ]))
}));

describe('GET /cardano/address/:address/utxos', () => {
  const app = express();
  app.use(express.json());
  app.use('/cardano', cardanoRouter);

  beforeEach(() => {
    // Kupmios reachable for getBlaze ping (non-essential for mocked service)
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
  });

  afterEach(() => jest.resetAllMocks());

  it('returns utxos for valid address', async () => {
    const res = await request(app)
      .get('/cardano/address/addr_test1qputxosxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/utxos');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.utxos)).toBe(true);
    expect(res.body.utxos.length).toBe(2);
  });

  it('400 on invalid address', async () => {
    const res = await request(app).get('/cardano/address/not-an-addr/utxos');
    expect(res.status).toBe(400);
  });
});
