"use client";
import React from 'react';
import { useCardano } from '../../hooks/useCardano';

export interface ConnectWalletButtonProps {
  onClick: () => void;
}

export const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({ onClick }): JSX.Element => {
  const { isConnecting, installedWallets } = useCardano();

  const icons = (installedWallets || []).slice(0, 3);

  return (
    <button style={styles.primaryBtn} onClick={onClick} aria-busy={isConnecting} aria-label="Connect Wallet">
      <span style={styles.iconRow} aria-hidden>
        {icons.map((w) => (
          <span key={w.key} title={w.name || w.key} style={styles.iconWrap}>
            {w.icon ? (
              <img src={w.icon} alt={w.name || w.key} style={styles.iconImg} />
            ) : (
              <span style={styles.fallbackIcon} />
            )}
          </span>
        ))}
      </span>
      <span>Connect Wallet</span>
      {isConnecting && <span style={styles.spinner} aria-hidden />}
    </button>
  );
};

const styles: Record<string, React.CSSProperties> = {
  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'linear-gradient(90deg, #22d3ee, #a78bfa)', color: '#0f172a',
    border: 0, padding: '8px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer'
  },
  iconRow: { display: 'inline-flex', gap: 6, marginRight: 6 },
  iconWrap: { width: 18, height: 18, borderRadius: 9999, overflow: 'hidden', background: 'rgba(0,0,0,0.1)' },
  iconImg: { width: '100%', height: '100%', objectFit: 'cover' },
  fallbackIcon: { display: 'inline-block', width: '100%', height: '100%', background: 'linear-gradient(90deg, #22d3ee, #a78bfa)' },
  spinner: {
    width: 14, height: 14, border: '2px solid rgba(0,0,0,0.25)', borderTopColor: '#0f172a', borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};
