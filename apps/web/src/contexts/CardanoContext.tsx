"use client";
import { buildSendAdaApi, getAddressBalanceApi } from '@shared/types';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface Cip30Api {
  getUsedAddresses: () => Promise<string[]>;
  getChangeAddress: () => Promise<string>;
  getRewardAddresses?: () => Promise<string[]>;
  getNetworkId?: () => Promise<number>; // 1 mainnet, 0 testnet
  signData?: (addr: string, payload: string) => Promise<{ signature: string; key: string }>;
  signTx: (tx: string, partialSign: boolean) => Promise<string>;
  submitTx: (signedTx: string) => Promise<string>;
  getUnusedAddresses?: () => Promise<string[]>;
}

interface InjectedWallet {
  enable: () => Promise<Cip30Api>;
}

export interface CardanoContextValue {
  // Kept for backwards compatibility; always null in no-WASM mode
  readonly lucid: null;
  readonly address: string;
  readonly connected: boolean;
  readonly isConnecting: boolean;
  readonly balance: bigint;
  readonly loadingBalance: boolean;
  readonly stakeAddress: string | null;
  readonly usedAddresses: readonly string[];
  readonly unusedAddresses: readonly string[];
  readonly installedWallets: readonly Readonly<{ key: string; name?: string; icon?: string }>[];
  connect: (walletKey: string) => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  refreshAddresses: () => Promise<void>;
  sendAda: (toAddress: string, lovelace: bigint) => Promise<string>;
  signMessage?: (message: string) => Promise<{ signature: string; key: string }>;
}

const CardanoContext = createContext<CardanoContextValue | null>(null);

export const CardanoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // No Lucid in no-WASM mode
  const [address, setAddress] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [balance, setBalance] = useState<bigint>(0n);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [walletApi, setWalletApi] = useState<Cip30Api | null>(null);
  const [stakeAddress, setStakeAddress] = useState<string | null>(null);
  const [usedAddresses, setUsedAddresses] = useState<string[]>([]);
  const [unusedAddresses, setUnusedAddresses] = useState<string[]>([]);
  const [installedWallets, setInstalledWallets] = useState<Readonly<{ key: string; name?: string; icon?: string }>[]>([]);

  const fetchBalance = useCallback(async (addr: string): Promise<bigint> => {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
    const res = await getAddressBalanceApi(apiUrl, addr);
    if (!res.success || !res.lovelace) throw new Error('Failed to fetch balance');
    return BigInt(res.lovelace);
  }, []);

  const connect = useCallback(async (walletKey: string): Promise<void> => {
    setIsConnecting(true);
    if (typeof window === 'undefined') return;
    const injected = (window as any)?.cardano?.[walletKey.toLowerCase()] as InjectedWallet | undefined;
    if (!injected || typeof injected.enable !== 'function') {
      setIsConnecting(false);
      throw new Error(`Wallet ${walletKey} not available`);
    }
    const api = await injected.enable();
    // Enforce expected network if possible
    try {
      const netId = typeof (api as any).getNetworkId === 'function' ? await (api as any).getNetworkId() : undefined;
      const expected = (process.env.NEXT_PUBLIC_NETWORK || 'Preprod').toLowerCase();
      const expectMainnet = expected === 'mainnet';
      if (typeof netId === 'number') {
        const onMainnet = netId === 1;
        if (expectMainnet !== onMainnet) {
          throw new Error(`Wrong network. Please switch wallet to ${expectMainnet ? 'Mainnet' : 'Testnet'}.`);
        }
      }
    } catch (e) {
      setIsConnecting(false);
      throw e;
    }
    const used = await api.getUsedAddresses().catch(() => [] as string[]);
    const addr = used[0] ?? await api.getChangeAddress();
    setConnected(true);
    setAddress(addr);
    setWalletApi(api);
    // Fetch stake and other addresses if supported
    try {
      const rewards = typeof api.getRewardAddresses === 'function' ? await api.getRewardAddresses() : [];
      setStakeAddress(rewards[0] ?? null);
    } catch { setStakeAddress(null); }
    try {
      setUsedAddresses(used);
    } catch { setUsedAddresses([]); }
    try {
      const unused = typeof api.getUnusedAddresses === 'function' ? await api.getUnusedAddresses() : [];
      setUnusedAddresses(unused);
    } catch { setUnusedAddresses([]); }
    // Persist for auto-reconnect
    try {
      window.localStorage.setItem('cf-wallet-connected', 'true');
      window.localStorage.setItem('cf-last-connected-wallet', walletKey.toLowerCase());
      window.dispatchEvent(new Event('storage'));
    } catch {}
    // Load balance via API
    setLoadingBalance(true);
    try {
      const lovelace = await fetchBalance(addr);
      setBalance(lovelace);
    } finally {
      setLoadingBalance(false);
      setIsConnecting(false);
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
    setStakeAddress(null);
    setUsedAddresses([]);
    setUnusedAddresses([]);
    try {
      window.localStorage.removeItem('cf-wallet-connected');
      window.localStorage.removeItem('cf-last-connected-wallet');
      window.dispatchEvent(new Event('storage'));
    } catch {}
  }, []);

  const sendAda = useCallback(async (toAddress: string, lovelace: bigint): Promise<string> => {
    if (!walletApi) throw new Error('Wallet not connected');
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
    const built = await buildSendAdaApi(apiUrl, { fromAddress: address, toAddress, lovelace });
    if (!built.success || !built.unsignedCbor) throw new Error('Failed to build tx');
    const signed = await walletApi.signTx(built.unsignedCbor, false);
    const txHash = await walletApi.submitTx(signed);
    return txHash;
  }, [walletApi, address]);

  const signMessage = useCallback(async (message: string) => {
    if (!walletApi) throw new Error('Wallet not connected');
    if (typeof walletApi.signData !== 'function') throw new Error('Wallet does not support signData');
    // Use change address for ownership proof
    const addr = address || (await walletApi.getChangeAddress());
    // Convert to hex payload (UTF-8)
    const encoder = new TextEncoder();
    const bytes = encoder.encode(message);
    const payloadHex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return walletApi.signData(addr, payloadHex);
  }, [walletApi, address]);

  const refreshAddresses = useCallback(async (): Promise<void> => {
    if (!walletApi) return;
    try {
      const used = await walletApi.getUsedAddresses().catch(() => [] as string[]);
      setUsedAddresses(used);
      const unused = typeof walletApi.getUnusedAddresses === 'function' ? await walletApi.getUnusedAddresses() : [];
      setUnusedAddresses(unused);
      const rewards = typeof walletApi.getRewardAddresses === 'function' ? await walletApi.getRewardAddresses() : [];
      setStakeAddress(rewards[0] ?? null);
    } catch {
      // Keep previous values on failure
    }
  }, [walletApi]);

  // Auto reconnect on mount if localStorage indicates so
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const connectedFlag = window.localStorage.getItem('cf-wallet-connected') === 'true';
      const last = window.localStorage.getItem('cf-last-connected-wallet');
      if (connectedFlag && last && !connected) {
        connect(last).catch(() => {/* ignore */});
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh on tab focus
  React.useEffect(() => {
    const onFocus = () => { if (connected) void refreshBalance(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [connected, refreshBalance]);

  // Detect installed/injected wallets (lightweight polling during first 2s)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    let attempts = 0;
  const maxAttempts = 5;
    const interval = setInterval(() => {
      attempts += 1;
      const list: Readonly<{ key: string; name?: string; icon?: string }>[] = (() => {
        const c: any = (window as any).cardano;
        if (!c || typeof c !== 'object') return [];
        return Object.keys(c)
          .filter((k) => !!c[k] && typeof c[k].enable === 'function')
          .map((k) => ({ key: k, name: c[k]?.name, icon: c[k]?.icon })) as Readonly<{ key: string; name?: string; icon?: string }>[];
      })();
      setInstalledWallets(list);
      if (attempts >= maxAttempts) clearInterval(interval);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const value = useMemo<CardanoContextValue>(() => ({
    lucid: null,
    address,
    connected,
    isConnecting,
    balance,
    loadingBalance,
    stakeAddress,
    usedAddresses,
    unusedAddresses,
    installedWallets,
    connect,
    disconnect,
    refreshBalance,
    refreshAddresses,
    sendAda,
    signMessage,
  }), [address, connected, isConnecting, balance, loadingBalance, stakeAddress, usedAddresses, unusedAddresses, installedWallets, connect, disconnect, refreshBalance, refreshAddresses, sendAda, signMessage]);

  return <CardanoContext.Provider value={value}>{children}</CardanoContext.Provider>;
};

export function useCardano(): CardanoContextValue {
  const ctx = useContext(CardanoContext);
  if (!ctx) {
    throw new Error('useCardano must be used within a CardanoProvider');
  }
  return ctx;
}
