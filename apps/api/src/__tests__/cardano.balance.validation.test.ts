import express from 'express';
import request from 'supertest';
import cardanoRouter from '../../src/routes/cardano';

describe('GET /cardano/address/:address/balance validation', () => {
  const app = express();
  app.use('/cardano', cardanoRouter);

  it('400 for invalid address format', async () => {
    const res = await request(app).get('/cardano/address/not-an-addr/balance');
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false });
  });
});
