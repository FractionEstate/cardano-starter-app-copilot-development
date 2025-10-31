"use client";
import React, { useMemo, useState } from 'react';
import { useCardano } from '../../hooks/useCardano';
import { WalletModal } from '../wallet/WalletModal';

export const Header: React.FC = (): JSX.Element => {
  const { connected, address, balance, loadingBalance, disconnect } = useCardano();
  const [open, setOpen] = useState(false);

  // Listen for modal close event from WalletModal to avoid non-serializable function props
  React.useEffect(() => {
    const onClose = () => setOpen(false);
    window.addEventListener('wallet:modal:close', onClose as EventListener);
    return () => window.removeEventListener('wallet:modal:close', onClose as EventListener);
  }, []);

  const shortAddr = useMemo(() => {
    if (!address) return '';
    return `${address.slice(0, 8)}…${address.slice(-6)}`;
  }, [address]);

  const adaDisplay = useMemo(() => {
    if (!connected) return '';
    if (loadingBalance) return '… ADA';
    const ada = Number(balance) / 1_000_000;
    return `${ada.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })} ADA`;
  }, [connected, balance, loadingBalance]);

  return (
    <header aria-label="Site header" style={styles.header}>
      <div style={styles.inner}>
        <a href="/" style={styles.brand} aria-label="Home">
          <span style={styles.logoCircle} aria-hidden />
          <span>Cardano Starter</span>
        </a>
        <div style={styles.actions}>
          {connected ? (
            <div style={styles.connectedBox}>
              <span style={styles.addr} title={address}>{shortAddr}</span>
              <span style={styles.balance} title={`${balance} lovelace`}>{adaDisplay}</span>
              <button style={styles.secondaryBtn} onClick={disconnect}>Disconnect</button>
            </div>
          ) : (
            <button style={styles.primaryBtn} onClick={() => setOpen(true)}>Connect Wallet</button>
          )}
        </div>
      </div>
      <WalletModal open={open} />
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: 'sticky', top: 0, zIndex: 50,
    background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
    color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.08)'
  },
  inner: {
    maxWidth: 1100, margin: '0 auto', padding: '12px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
  },
  brand: { display: 'inline-flex', gap: 10, alignItems: 'center', color: 'inherit', textDecoration: 'none', fontWeight: 600 },
  logoCircle: { width: 10, height: 10, borderRadius: 9999, background: 'linear-gradient(90deg, #22d3ee, #a78bfa)' },
  actions: { display: 'flex', gap: 12, alignItems: 'center' },
  connectedBox: { display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.06)', padding: '6px 10px', borderRadius: 10 },
  addr: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', opacity: 0.95 },
  balance: { fontVariantNumeric: 'tabular-nums', opacity: 0.95 },
  primaryBtn: { background: 'linear-gradient(90deg, #22d3ee, #a78bfa)', color: '#0f172a', border: 0, padding: '8px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' },
  secondaryBtn: { background: 'transparent', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }
};
