import express from 'express';
import request from 'supertest';
import cardanoRouter from '../../src/routes/cardano';

beforeEach(() => {
  // @ts-ignore
  global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
});

describe('POST /cardano/txs/build validation', () => {
  const app = express();
  app.use(express.json());
  app.use('/cardano', cardanoRouter);

  it('400 when payLovelace has negative amount', async () => {
    const res = await request(app)
      .post('/cardano/txs/build')
      .send({
        fromAddress: 'addr_test1qpfromxxx',
        actions: [
          { type: 'payLovelace', toAddress: 'addr_test1qpto', lovelace: '-100' }
        ]
      });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false });
  });

  it('400 when payLovelace is missing toAddress', async () => {
    const res = await request(app)
      .post('/cardano/txs/build')
      .send({
        fromAddress: 'addr_test1qpfromxxx',
        actions: [
          { type: 'payLovelace', lovelace: '100' }
        ]
      });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false });
  });
});
