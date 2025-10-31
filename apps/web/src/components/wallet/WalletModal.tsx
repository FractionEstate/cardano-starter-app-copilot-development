"use client";
import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { useCardano } from '../../hooks/useCardano';

interface WalletModalProps {
  open: boolean;
}

interface WalletOption {
  key: string;
  label: string;
}

const CLOSE_EVENT = 'wallet:modal:close';

export const WalletModal: React.FC<WalletModalProps> = ({ open }): JSX.Element | null => {
  const { connect } = useCardano();
  const [mode, setMode] = useState<'list' | 'qr' | 'peer'>('list');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [walletsVersion, setWalletsVersion] = useState<number>(0);
  // Close on Escape for accessibility
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') window.dispatchEvent(new CustomEvent(CLOSE_EVENT));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  // Lock body scroll while modal open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const wallets = useMemo<WalletOption[]>(() => {
    if (typeof window === 'undefined') return [];
    const cardano: any = (window as any).cardano || {};
    const keys = Object.keys(cardano).filter(k => typeof (cardano as any)[k]?.enable === 'function');
    const labels: Record<string, string> = {
      nami: 'Nami',
      eternl: 'Eternl',
      lace: 'Lace',
      yoroi: 'Yoroi',
      flint: 'Flint',
      vespr: 'Vespr',
      typhon: 'Typhon',
      gerowallet: 'GeroWallet',
      nufi: 'NuFi'
    };
    return keys.map(k => ({ key: k, label: labels[k] ?? k })).sort((a,b) => a.label.localeCompare(b.label));
  }, [walletsVersion]);

  // Poll for injected wallets with exponential backoff while modal open
  useEffect(() => {
    if (!open) return;
    let timeout: any = null;
    let interval = 30;
    let last = JSON.stringify(Object.keys(((window as any)?.cardano) || {}).sort());
    const tick = () => {
      const now = JSON.stringify(Object.keys(((window as any)?.cardano) || {}).sort());
      if (now !== last) {
        last = now;
        setWalletsVersion(v => v + 1);
      }
      interval = Math.min(10000, Math.floor(interval * 1.5));
      timeout = setTimeout(tick, interval);
    };
    timeout = setTimeout(tick, interval);
    return () => clearTimeout(timeout);
  }, [open]);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (!open) return null;

  return (
    <div role="dialog" aria-label="Connect Wallet" aria-modal="true" style={styles.backdrop} onClick={() => window.dispatchEvent(new CustomEvent(CLOSE_EVENT))}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.headerRow}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Connect Wallet</h2>
          <button aria-label="Close" onClick={() => window.dispatchEvent(new CustomEvent(CLOSE_EVENT))} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.tabs}>
          <button onClick={() => setMode('list')} style={{ ...styles.tabBtn, ...(mode === 'list' ? styles.tabActive : {}) }}>Browser Wallets</button>
          <button onClick={() => setMode('qr')} style={{ ...styles.tabBtn, ...(mode === 'qr' ? styles.tabActive : {}) }}>Connect via QR</button>
          <button onClick={() => setMode('peer')} style={{ ...styles.tabBtn, ...(mode === 'peer' ? styles.tabActive : {}) }}>Peer Connect</button>
        </div>

        {mode === 'list' ? (
          <div>
            {wallets.length === 0 ? (
              <div style={styles.emptyBox}>
                <p style={{ margin: 0 }}>No compatible wallets detected.</p>
                <p style={{ margin: '6px 0 0 0', opacity: 0.8, fontSize: 13 }}>
                  Install a CIP-30 wallet like Nami, Eternl, Lace, or Flint.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  <a href="https://namiwallet.io/" target="_blank" rel="noreferrer" style={styles.link}>Get Nami</a>
                  <a href="https://eternl.io/" target="_blank" rel="noreferrer" style={styles.link}>Get Eternl</a>
                  <a href="https://www.lace.io/" target="_blank" rel="noreferrer" style={styles.link}>Get Lace</a>
                  <a href="https://flint-wallet.com/" target="_blank" rel="noreferrer" style={styles.link}>Get Flint</a>
                </div>
              </div>
            ) : (
              <ul style={styles.walletList}>
                {wallets.map(w => (
                  <li key={w.key}>
                    <button
                      style={{ ...styles.walletBtn, ...(isConnecting ? styles.btnDisabled : {}) }}
                      disabled={isConnecting}
                      onClick={async () => {
                        setError("");
                        setIsConnecting(true);
                        try {
                          await connect(w.key);
                          window.dispatchEvent(new CustomEvent(CLOSE_EVENT));
                        } catch (e) {
                          const msg = e instanceof Error ? e.message : 'Failed to connect';
                          setError(msg);
                        } finally {
                          setIsConnecting(false);
                        }
                      }}
                    >
                      {isConnecting ? 'Connecting…' : w.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {error && (
              <div role="alert" aria-live="polite" style={styles.errorBox}>{error}</div>
            )}
          </div>
        ) : mode === 'qr' ? (
          <div style={styles.qrWrap}>
            <QRCode value={currentUrl} size={180} data-testid="qr-code" />
            <p style={styles.helpText}>
              Scan with your mobile wallet browser to open this page and connect.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                aria-label="Copy link"
                style={styles.secondaryBtn}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(currentUrl);
                    setError('Link copied to clipboard');
                  } catch {
                    setError('Unable to copy link');
                  }
                }}
              >Copy link</button>
            </div>
            {error && (
              <div role="status" aria-live="polite" style={{ ...styles.helpText, marginTop: 6 }}>{error}</div>
            )}
          </div>
        ) : (
          <div style={styles.peerWrap}>
            <p style={styles.helpText}><strong>Peer Connect</strong> (coming soon)</p>
            <p style={styles.helpText}>
              Direct device-to-device pairing (CIP-45 style). This will enable connecting a mobile wallet by scanning a secure one-time code.
            </p>
            <p style={styles.helpText}>
              For now, use "Connect via QR" to open this app in your mobile wallet browser, then connect normally.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
  },
  modal: {
    width: '100%', maxWidth: 460, borderRadius: 12,
    background: '#0b1220', color: '#dce3f0',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
    padding: 16
  },
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  closeBtn: { background: 'transparent', border: 0, color: '#9fb0c6', cursor: 'pointer', fontSize: 16 },
  tabs: { display: 'flex', gap: 8, marginBottom: 12 },
  tabBtn: {
    flex: 1,
    background: 'transparent', color: '#cfe3ff', border: '1px solid rgba(255,255,255,0.18)',
    padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 600
  },
  tabActive: { background: 'linear-gradient(90deg, rgba(34,211,238,0.12), rgba(167,139,250,0.12))', border: '1px solid rgba(255,255,255,0.28)' },
  emptyBox: { border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 10, padding: 12, textAlign: 'center' },
  walletList: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 },
  walletBtn: {
    width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.06)', color: '#e6eefc', border: '1px solid rgba(255,255,255,0.16)',
    padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600
  },
  btnDisabled: { opacity: 0.7, cursor: 'not-allowed' },
  qrWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 4 },
  helpText: { margin: 0, opacity: 0.85, fontSize: 13, textAlign: 'center' },
  secondaryBtn: { background: 'transparent', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' },
  errorBox: { marginTop: 10, color: '#fecaca', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', padding: 8, borderRadius: 8 }
};
