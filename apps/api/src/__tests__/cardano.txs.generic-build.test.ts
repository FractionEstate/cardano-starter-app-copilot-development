import express from 'express';
import request from 'supertest';
import cardanoRouter from '../../src/routes/cardano';

// Mock Kupmios reachability via fetch used in getBlaze()
beforeEach(() => {
  // @ts-ignore
  global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
});

// Mock @blaze-cardano/sdk to observe builder calls
jest.mock('@blaze-cardano/sdk', () => {
  const calls: Array<{ method: string; args: any[] }> = [];
  type B = {
    payLovelace: (addr: any, amt: bigint) => B;
    addMetadata: (label: number, md: any) => B;
    validFrom: (s: bigint) => B;
    validTo: (s: bigint) => B;
    addRequiredSigner: (k: string) => B;
    complete: () => Promise<{ toCbor: () => string }>;
  };
  const builder: B = {
    payLovelace: jest.fn((addr: any, amt: bigint): B => { calls.push({ method: 'payLovelace', args: [addr, amt] }); return builder; }),
    addMetadata: jest.fn((label: number, md: any): B => { calls.push({ method: 'addMetadata', args: [label, md] }); return builder; }),
    validFrom: jest.fn((s: bigint): B => { calls.push({ method: 'validFrom', args: [s] }); return builder; }),
    validTo: jest.fn((s: bigint): B => { calls.push({ method: 'validTo', args: [s] }); return builder; }),
    addRequiredSigner: jest.fn((k: string): B => { calls.push({ method: 'addRequiredSigner', args: [k] }); return builder; }),
    complete: jest.fn(async () => ({ toCbor: () => 'deadbeef' })),
  };
  return {
    __esModule: true,
    Core: { addressFromBech32: (s: string) => ({ bech32: s }) },
    Kupmios: function(_: any) { return {}; },
    ColdWallet: function(address: any, _index: number, _provider: any) { return { address }; },
    Blaze: { from: async (_p: any, _w: any) => ({ newTransaction: () => builder }) },
  };
});

describe('POST /cardano/txs/build (generic DSL)', () => {
  const app = express();
  app.use(express.json());
  app.use('/cardano', cardanoRouter);

  it('builds an unsigned cbor from multiple actions', async () => {
    const res = await request(app)
      .post('/cardano/txs/build')
      .send({
        fromAddress: 'addr_test1qpfromxxx',
        actions: [
          { type: 'payLovelace', toAddress: 'addr_test1qpto', lovelace: '2000000' },
          { type: 'metadata', label: 674, metadata: { msg: 'hello' } },
          { type: 'validity', validFrom: '100', validTo: '200' },
          { type: 'requiredSigner', keyHash: 'abc123' }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, unsignedCbor: expect.any(String) });
  });

  it('rejects missing actions', async () => {
    const res = await request(app)
      .post('/cardano/txs/build')
      .send({ fromAddress: 'addr_test1qpfromxxx', actions: [] });
    expect(res.status).toBe(400);
  });
});
