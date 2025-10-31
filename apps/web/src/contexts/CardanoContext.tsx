"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface Cip30Api {
  getUsedAddresses: () => Promise<string[]>;
  getChangeAddress: () => Promise<string>;
}

interface InjectedWallet {
  enable: () => Promise<Cip30Api>;
}

export interface CardanoContextValue {
  readonly lucid: unknown | null;
  readonly address: string;
  readonly connected: boolean;
  readonly balance: bigint;
  readonly loadingBalance: boolean;
  connect: (walletKey: string) => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const CardanoContext = createContext<CardanoContextValue | null>(null);

export const CardanoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lucid, setLucid] = useState<unknown | null>(null);
  const [address, setAddress] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const [balance, setBalance] = useState<bigint>(0n);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);

  const attachLucidAndLoad = useCallback(async (api: Cip30Api): Promise<void> => {
    try {
      const { initLucid } = await import('../lib/lucid');
      const instance = await initLucid();
  // Select wallet via CIP-30 API
  (instance as unknown as { selectWallet: { fromAPI: (api: Cip30Api) => void } }).selectWallet.fromAPI(api);
      setLucid(instance as unknown);

      // Prefer address from lucid now that wallet is selected
  const addr: string = await (instance as unknown as { wallet: { address: () => Promise<string> } }).wallet.address();
      setAddress(addr);

      setLoadingBalance(true);
      try {
  const utxos = await (instance as unknown as { wallet: { getUtxos: () => Promise<unknown[]> } }).wallet.getUtxos();
        const sum = utxos.reduce((acc: bigint, u: unknown) => {
          const assets = (u as { assets?: { lovelace?: bigint } }).assets;
          const lovelace = assets?.lovelace ?? 0n;
          return acc + lovelace;
        }, 0n);
        setBalance(sum);
      } finally {
        setLoadingBalance(false);
      }
    } catch (e) {
      // Lucid initialization is optional; fail silently but keep connection via CIP-30
      // eslint-disable-next-line no-console
      console.warn('Lucid init failed or unavailable; continuing with CIP-30 only');
    }
  }, []);

  const connect = useCallback(async (walletKey: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    const injected = (window as any)?.cardano?.[walletKey.toLowerCase()] as InjectedWallet | undefined;
    if (!injected || typeof injected.enable !== 'function') {
      throw new Error(`Wallet ${walletKey} not available`);
    }
    const api = await injected.enable();
    const used = await api.getUsedAddresses().catch(() => [] as string[]);
    const addr = used[0] ?? await api.getChangeAddress();
    setConnected(true);
    setAddress(addr);
    // Try to attach Lucid and load balance, non-fatal if it fails
    await attachLucidAndLoad(api);
  }, [attachLucidAndLoad]);

  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!lucid) return;
    try {
      setLoadingBalance(true);
  const utxos = await (lucid as unknown as { wallet: { getUtxos: () => Promise<unknown[]> } }).wallet.getUtxos();
      const sum = utxos.reduce((acc: bigint, u: unknown) => {
        const assets = (u as { assets?: { lovelace?: bigint } }).assets;
        const lovelace = assets?.lovelace ?? 0n;
        return acc + lovelace;
      }, 0n);
      setBalance(sum);
    } finally {
      setLoadingBalance(false);
    }
  }, [lucid]);

  const disconnect = useCallback((): void => {
    setLucid(null);
    setAddress("");
    setConnected(false);
    setBalance(0n);
    setLoadingBalance(false);
  }, []);

  const value = useMemo<CardanoContextValue>(() => ({
    lucid,
    address,
    connected,
    balance,
    loadingBalance,
    connect,
    disconnect,
    refreshBalance,
  }), [lucid, address, connected, balance, loadingBalance, connect, disconnect, refreshBalance]);

  return <CardanoContext.Provider value={value}>{children}</CardanoContext.Provider>;
};

export function useCardano(): CardanoContextValue {
  const ctx = useContext(CardanoContext);
  if (!ctx) {
    throw new Error('useCardano must be used within a CardanoProvider');
  }
  return ctx;
}
