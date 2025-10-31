import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { CardanoProvider, useCardano } from '../contexts/CardanoContext';

describe('DSL build + submit flow', () => {
  it('builds via DSL on server, signs and submits with wallet', async () => {
    const unsigned = 'aabbcc';
    // Mock fetch for DSL build
    // @ts-ignore
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as URL).toString();
      if (url.includes('/cardano/txs/build')) {
        return { ok: true, json: async () => ({ success: true, unsignedCbor: unsigned }) } as any;
      }
      if (url.includes('/address/') && url.includes('/balance')) {
        return { ok: true, json: async () => ({ success: true, lovelace: '1000000' }) } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    }) as unknown as typeof fetch;

    // Mock CIP-30 wallet
    const signTx = jest.fn(async () => 'signedcbor');
    const submitTx = jest.fn(async () => 'txhash456');
    (window as any).cardano = {
      nami: {
        enable: async () => ({
          getUsedAddresses: async () => ['addr_test1qpfakefrom'],
          getChangeAddress: async () => 'addr_test1qpfakechange',
          signTx,
          submitTx
        }) as any
      }
    };

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <CardanoProvider>{children}</CardanoProvider>
    );
    const { result } = renderHook(() => useCardano(), { wrapper });

    await act(async () => {
      await result.current.connect('nami');
    });

    let hash = '';
    await act(async () => {
      // Build via DSL (payLovelace) and submit using context method
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
      const res = await (await fetch(`${apiUrl}/cardano/txs/build`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAddress: 'addr_test1qpfakefrom', actions: [ { type: 'payLovelace', toAddress: 'addr_test1qpto', lovelace: '2000000' } ] })
      })).json();
      hash = await result.current.submitUnsignedCbor(res.unsignedCbor);
    });

    expect(global.fetch).toHaveBeenCalled();
    expect(signTx).toHaveBeenCalledWith(unsigned, false);
    expect(submitTx).toHaveBeenCalledWith('signedcbor');
    expect(hash).toBe('txhash456');
  });
});
