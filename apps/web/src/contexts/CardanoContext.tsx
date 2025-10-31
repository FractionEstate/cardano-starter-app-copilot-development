"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface Cip30Api {
  getUsedAddresses: () => Promise<string[]>;
  getChangeAddress: () => Promise<string>;
  signTx: (tx: string, partialSign: boolean) => Promise<string>;
  submitTx: (signedTx: string) => Promise<string>;
}

interface InjectedWallet {
  enable: () => Promise<Cip30Api>;
}

export interface CardanoContextValue {
  // Kept for backwards compatibility; always null in no-WASM mode
  readonly lucid: null;
  readonly address: string;
  readonly connected: boolean;
  readonly balance: bigint;
  readonly loadingBalance: boolean;
  connect: (walletKey: string) => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  sendAda: (toAddress: string, lovelace: bigint) => Promise<string>;
}

const CardanoContext = createContext<CardanoContextValue | null>(null);

export const CardanoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // No Lucid in no-WASM mode
  const [address, setAddress] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const [balance, setBalance] = useState<bigint>(0n);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [walletApi, setWalletApi] = useState<Cip30Api | null>(null);

  const fetchBalance = useCallback(async (addr: string): Promise<bigint> => {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
    const res = await fetch(`${apiUrl}/cardano/address/${addr}/balance`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as any).error || `Failed to fetch balance (${res.status})`);
    }
    const data = await res.json() as { lovelace: string };
    return BigInt(data.lovelace);
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
    setWalletApi(api);
    // Load balance via API
    setLoadingBalance(true);
    try {
      const lovelace = await fetchBalance(addr);
      setBalance(lovelace);
    } finally {
      setLoadingBalance(false);
    }
  }, [fetchBalance]);

  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!address) return;
    try {
      setLoadingBalance(true);
      const lovelace = await fetchBalance(address);
      setBalance(lovelace);
    } finally {
      setLoadingBalance(false);
    }
  }, [address, fetchBalance]);

  const disconnect = useCallback((): void => {
    setAddress("");
    setConnected(false);
    setBalance(0n);
    setLoadingBalance(false);
    setWalletApi(null);
  }, []);

  const sendAda = useCallback(async (toAddress: string, lovelace: bigint): Promise<string> => {
    if (!walletApi) throw new Error('Wallet not connected');
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
    const res = await fetch(`${apiUrl}/cardano/txs/build/send-ada`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromAddress: address, toAddress, lovelace: String(lovelace) })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to build tx (${res.status})`);
    }
    const data = await res.json() as { unsignedCbor: string };
    const signed = await walletApi.signTx(data.unsignedCbor, false);
    const txHash = await walletApi.submitTx(signed);
    return txHash;
  }, [walletApi, address]);

  const value = useMemo<CardanoContextValue>(() => ({
    lucid: null,
    address,
    connected,
    balance,
    loadingBalance,
    connect,
    disconnect,
    refreshBalance,
    sendAda,
  }), [address, connected, balance, loadingBalance, connect, disconnect, refreshBalance, sendAda]);

  return <CardanoContext.Provider value={value}>{children}</CardanoContext.Provider>;
};

export function useCardano(): CardanoContextValue {
  const ctx = useContext(CardanoContext);
  if (!ctx) {
    throw new Error('useCardano must be used within a CardanoProvider');
  }
  return ctx;
}
