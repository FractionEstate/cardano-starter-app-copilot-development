import express from 'express';
import request from 'supertest';
import cardanoRouter from '../../src/routes/cardano';

jest.mock('../../src/services/tx', () => ({
  buildUnsignedSendAda: jest.fn(async () => 'a1b2c3deadbeef')
}));

describe('POST /cardano/txs/build/send-ada', () => {
  const app = express();
  app.use(express.json());
  app.use('/cardano', cardanoRouter);

  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
  });

  afterEach(() => jest.resetAllMocks());

  it('returns unsigned cbor for valid input when Kupmios reachable', async () => {
    const res = await request(app)
      .post('/cardano/txs/build/send-ada')
      .send({
        fromAddress: 'addr_test1qpfromaddressxxx',
        toAddress: 'addr_test1qptoaddressyyy',
        lovelace: '2000000'
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, unsignedCbor: expect.any(String) });
  });

  it('400 on invalid input', async () => {
    const res = await request(app).post('/cardano/txs/build/send-ada').send({});
    expect(res.status).toBe(400);
  });
});
