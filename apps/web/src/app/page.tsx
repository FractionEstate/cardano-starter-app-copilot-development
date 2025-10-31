"use client";
import { buildTxFromDslApi } from '@shared/types';
import React from 'react';
import { useCardano } from '../hooks/useCardano';

function adaToLovelace(adaInput: string): bigint {
  const s = adaInput.trim();
  if (!s) throw new Error('Amount required');
  if (!/^\d+(?:\.\d{0,6})?$/.test(s)) throw new Error('Invalid ADA amount');
  const [i, f = ''] = s.split('.');
  const intPart = BigInt(i);
  const fracPadded = (f + '000000').slice(0, 6);
  const fracPart = BigInt(fracPadded);
  return intPart * 1_000_000n + fracPart;
}

export default function Page(): JSX.Element {
  const { connected, address, balance, loadingBalance, refreshBalance, sendAda, signMessage, submitUnsignedCbor } = useCardano();
  const [toAddress, setToAddress] = React.useState('');
  const [amountAda, setAmountAda] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [txHash, setTxHash] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState('Hello Cardano!');
  const [sig, setSig] = React.useState<string | null>(null);
  const [dslHash, setDslHash] = React.useState<string | null>(null);
  const [dslError, setDslError] = React.useState<string | null>(null);
  const [buildingDsl, setBuildingDsl] = React.useState(false);

  const network = (process.env.NEXT_PUBLIC_NETWORK || 'Preprod');

  const onSend = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null); setTxHash(null);
    try {
      if (!connected) throw new Error('Connect a wallet first');
      if (!toAddress || toAddress.length < 10) throw new Error('Enter a valid address');
      const lovelace = adaToLovelace(amountAda);
      setSending(true);
      const hash = await sendAda(toAddress, lovelace);
      setTxHash(hash);
      setToAddress(''); setAmountAda('');
      void refreshBalance();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const onSign = async (): Promise<void> => {
    setSig(null); setError(null);
    try {
      if (typeof signMessage !== 'function') throw new Error('Wallet does not support signMessage');
      const res = await signMessage(msg);
      setSig(`${res.signature.slice(0, 24)}…`);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onBuildViaDsl = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setDslError(null); setDslHash(null);
    try {
      if (!connected) throw new Error('Connect a wallet first');
      if (!toAddress || toAddress.length < 10) throw new Error('Enter a valid address');
      const lovelace = adaToLovelace(amountAda);
      setBuildingDsl(true);
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
      const built = await buildTxFromDslApi(apiUrl, address, [
        { type: 'payLovelace', toAddress, lovelace: String(lovelace) }
      ]);
      if (!built.success || !built.unsignedCbor) throw new Error('Failed to build via DSL');
      const hash = await submitUnsignedCbor(built.unsignedCbor);
      setDslHash(hash);
      setToAddress(''); setAmountAda('');
      void refreshBalance();
    } catch (e) {
      setDslError((e as Error).message);
    } finally {
      setBuildingDsl(false);
    }
  };

  const adaDisplay = loadingBalance ? '…' : (Number(balance) / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });

  return (
    <main style={styles.main}>
      <section style={styles.hero}>
        <div style={styles.container}>
          <h1 style={styles.title}>Build on Cardano — WASM-free frontend</h1>
          <p style={styles.subtitle}>Server builds transactions with Blaze. Browser wallets only sign & submit.</p>
          <div style={styles.metaRow}>
            <span>Network: <strong>{network}</strong></span>
            {connected && (
              <span title={address}>Balance: <strong>{adaDisplay} ADA</strong></span>
            )}
            {connected && (
              <button style={styles.secondaryBtn} onClick={() => void refreshBalance()} disabled={loadingBalance} aria-busy={loadingBalance}>
                {loadingBalance ? 'Refreshing…' : 'Refresh balance'}
              </button>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="quick-actions" style={styles.section}>
        <div style={styles.container}>
          <h2 id="quick-actions" style={styles.h2}>Quick actions</h2>
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.h3}>Send ADA</h3>
              <p style={styles.muted}>Build on server, sign & submit in wallet.</p>
              <form onSubmit={onSend} aria-label="Send ADA form" style={{ display: 'grid', gap: 8 }}>
                <label>
                  <span style={styles.label}>Recipient address</span>
                  <input
                    aria-label="Recipient address"
                    type="text" value={toAddress} onChange={(e) => setToAddress(e.target.value)}
                    placeholder="addr_test1..." style={styles.input}
                  />
                </label>
                <label>
                  <span style={styles.label}>Amount (ADA)</span>
                  <input
                    aria-label="Amount (ADA)"
                    type="text" value={amountAda} onChange={(e) => setAmountAda(e.target.value)}
                    placeholder="2.5" style={styles.input}
                  />
                </label>
                <button type="submit" style={styles.primaryBtn} disabled={!connected || sending} aria-busy={sending}>
                  {sending ? 'Sending…' : connected ? 'Send ADA' : 'Connect wallet to send'}
                </button>
              </form>
              {txHash && <p role="status" style={styles.success}>Submitted tx: <code>{txHash}</code></p>}
              {error && <p role="alert" style={styles.error}>{error}</p>}
            </div>
            <div style={styles.card}>
              <h3 style={styles.h3}>Build via DSL</h3>
              <p style={styles.muted}>Uses the generic builder (payLovelace) then signs & submits.</p>
              <form onSubmit={onBuildViaDsl} aria-label="Build via DSL form" style={{ display: 'grid', gap: 8 }}>
                <label>
                  <span style={styles.label}>Recipient address</span>
                  <input
                    aria-label="Recipient address (DSL)"
                    type="text" value={toAddress} onChange={(e) => setToAddress(e.target.value)}
                    placeholder="addr_test1..." style={styles.input}
                  />
                </label>
                <label>
                  <span style={styles.label}>Amount (ADA)</span>
                  <input
                    aria-label="Amount (ADA) (DSL)"
                    type="text" value={amountAda} onChange={(e) => setAmountAda(e.target.value)}
                    placeholder="1.0" style={styles.input}
                  />
                </label>
                <button type="submit" style={styles.primaryBtn} disabled={!connected || buildingDsl} aria-busy={buildingDsl}>
                  {buildingDsl ? 'Building…' : connected ? 'Build & Submit' : 'Connect wallet to build'}
                </button>
              </form>
              {dslHash && <p role="status" style={styles.success}>Submitted tx: <code>{dslHash}</code></p>}
              {dslError && <p role="alert" style={styles.error}>{dslError}</p>}
            </div>
            <div style={styles.card}>
              <h3 style={styles.h3}>Sign message</h3>
              <p style={styles.muted}>Demonstrates CIP-30 signData if supported.</p>
              <label>
                <span style={styles.label}>Message</span>
                <input aria-label="Message" type="text" value={msg} onChange={(e) => setMsg(e.target.value)} style={styles.input} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={styles.secondaryBtn} onClick={() => setMsg('Hello Cardano!')}>Reset</button>
                <button style={styles.primaryBtn} onClick={() => void onSign()} disabled={!connected}>Sign message</button>
              </div>
              {sig && <p role="status" style={styles.success}>Signature: <code title="signature">{sig}</code></p>}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="learn" style={styles.section}>
        <div style={styles.container}>
          <h2 id="learn" style={styles.h2}>Learn more</h2>
          <ul style={{ paddingLeft: 18, lineHeight: 1.9 }}>
            <li><a href="/" onClick={(e) => e.preventDefault()} aria-disabled>Blaze DSL examples — see README</a></li>
            <li><a href="https://cips.cardano.org/cips/cip30/" target="_blank" rel="noreferrer">CIP-30 Wallet API</a></li>
            <li><a href="https://github.com/BlazeCardano/blaze-sdk" target="_blank" rel="noreferrer">Blaze SDK</a></li>
          </ul>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
  hero: { background: 'linear-gradient(90deg, #0ea5e9, #8b5cf6)', color: '#0f172a', padding: '40px 0' },
  container: { maxWidth: 1100, margin: '0 auto', padding: '0 16px' },
  title: { fontSize: 28, fontWeight: 800, margin: 0 },
  subtitle: { margin: '8px 0 0 0', opacity: 0.9 },
  metaRow: { display: 'flex', gap: 16, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' },
  section: { padding: '28px 0' },
  h2: { fontSize: 20, margin: '0 0 12px 0' },
  h3: { fontSize: 16, margin: '0 0 6px 0' },
  grid: { display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' },
  card: { background: '#0f172a', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, boxShadow: '0 4px 18px rgba(0,0,0,0.2)' },
  label: { display: 'block', fontSize: 12, opacity: 0.8, marginBottom: 4 },
  input: { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#e2e8f0' },
  primaryBtn: { background: 'linear-gradient(90deg, #22d3ee, #a78bfa)', color: '#0f172a', border: 0, padding: '8px 12px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' },
  secondaryBtn: { background: 'transparent', color: '#0f172a', border: '1px solid rgba(15,23,42,0.5)', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' },
  success: { color: '#22d3ee', marginTop: 8, wordBreak: 'break-all' },
  error: { color: '#f87171', marginTop: 8 },
};

