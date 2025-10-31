"use client";
import React from 'react';
import { useCardano } from '../../hooks/useCardano';

export const WalletDetails: React.FC = (): JSX.Element => {
  const { address, stakeAddress, usedAddresses, unusedAddresses, installedWallets, refreshAddresses } = useCardano();
  const [status, setStatus] = React.useState<string>("");

  const copy = async (label: string, value?: string | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setStatus(`${label} copied`);
      setTimeout(() => setStatus(""), 1500);
    } catch {
      setStatus(`Unable to copy ${label.toLowerCase()}`);
      setTimeout(() => setStatus(""), 1500);
    }
  };

  return (
    <div style={styles.panel} aria-label="Wallet details">
      <div style={styles.row}>
        <span style={styles.key}>Payment address</span>
        <div style={styles.valueWrap}>
          <code style={styles.code}>{address || '—'}</code>
          <button style={styles.smallBtn} onClick={() => copy('Address', address)} disabled={!address}>Copy</button>
        </div>
      </div>
      <div style={styles.row}>
        <span style={styles.key}>Stake address</span>
        <div style={styles.valueWrap}>
          <code style={styles.code}>{stakeAddress ?? '—'}</code>
          <button style={styles.smallBtn} onClick={() => copy('Stake', stakeAddress)} disabled={!stakeAddress}>Copy</button>
        </div>
      </div>
      <div style={styles.row}><span style={styles.key}>Used addresses</span><span>{usedAddresses.length}</span></div>
      <div style={styles.row}><span style={styles.key}>Unused addresses</span><span>{unusedAddresses.length}</span></div>
      <div style={styles.row}>
        <span style={styles.key}>Installed wallets</span>
        <span>{installedWallets.map(w => w.name || w.key).join(', ') || '—'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, gap: 8 }}>
        <button style={styles.smallBtn} onClick={() => { void refreshAddresses(); setStatus('Refreshing…'); setTimeout(()=>setStatus(''), 800); }}>Refresh</button>
      </div>
      {status && <div role="status" aria-live="polite" style={styles.status}>{status}</div>}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: { marginTop: 8, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.04)' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '4px 0' },
  key: { opacity: 0.9 },
  valueWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  code: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 6 },
  smallBtn: { fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.16)', background: 'transparent', color: '#e2e8f0', cursor: 'pointer' },
  status: { marginTop: 6, fontSize: 12, opacity: 0.85, textAlign: 'right' }
};
