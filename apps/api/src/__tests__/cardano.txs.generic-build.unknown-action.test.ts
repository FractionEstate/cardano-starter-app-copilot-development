import express from 'express';
import request from 'supertest';
import cardanoRouter from '../../src/routes/cardano';

beforeEach(() => {
  // @ts-ignore
  global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
});

describe('POST /cardano/txs/build unknown action', () => {
  const app = express();
  app.use(express.json());
  app.use('/cardano', cardanoRouter);

  it('400 on unknown action type', async () => {
    const res = await request(app)
      .post('/cardano/txs/build')
      .send({
        fromAddress: 'addr_test1qpfromxxx',
        actions: [ { type: 'notARealAction', foo: 'bar' } ]
      });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false });
  });
});
