import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { CardanoProvider, useCardano } from '../contexts/CardanoContext';

describe('sendAda WASM-free flow', () => {
  it('builds on server, signs and submits with wallet', async () => {
    // Mock fetch for build endpoint
    const unsigned = 'a1b2c3';
    // @ts-ignore
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, unsignedCbor: unsigned })
    })) as unknown as typeof fetch;

    // Mock CIP-30 wallet
    const signTx = jest.fn(async () => 'signedcbor');
    const submitTx = jest.fn(async () => 'txhash123');
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
      hash = await result.current.sendAda('addr_test1qptoaddr', 2000000n);
    });

    expect(global.fetch).toHaveBeenCalled();
    expect(signTx).toHaveBeenCalledWith(unsigned, false);
    expect(submitTx).toHaveBeenCalledWith('signedcbor');
    expect(hash).toBe('txhash123');
  });
});
