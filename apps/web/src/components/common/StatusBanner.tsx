"use client";
import React from 'react';

interface Readiness {
  readonly success?: boolean;
  readonly ready?: boolean;
  readonly ogmiosReachable?: boolean;
  readonly kupoReachable?: boolean;
  readonly dolosRestHealthy?: boolean;
}

export const StatusBanner: React.FC = (): JSX.Element | null => {
  const [state, setState] = React.useState<{
    loading: boolean;
    error: string | null;
    ready: boolean | null;
    detail: Readonly<Readiness> | null;
  }>({ loading: true, error: null, ready: null, detail: null });

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const load = React.useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch(`${apiUrl}/cardano/readiness`, { cache: 'no-store' });
      const json: Readiness = await res.json().catch(() => ({} as Readiness));
      // Prefer body flag regardless of status code
      const ready = Boolean((json as any).ready);
      setState({ loading: false, error: null, ready, detail: json });
    } catch (e) {
      setState({ loading: false, error: (e as Error).message, ready: null, detail: null });
    }
  }, [apiUrl]);

  React.useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 10_000);
    return () => clearInterval(id);
  }, [load]);

  if (state.loading || state.ready === true) return null;

  const og = state.detail?.ogmiosReachable === true;
  const kp = state.detail?.kupoReachable === true;
  const dolos = state.detail?.dolosRestHealthy === true;

  return (
    <div role="status" aria-live="polite" style={styles.wrapper}>
      <div style={styles.inner}>
        <span style={styles.badge}>Not Ready</span>
        <span>Cardano providers are not fully ready.</span>
        <span>
          Ogmios: <strong>{og ? 'up' : 'down'}</strong> · Kupo: <strong>{kp ? 'up' : 'down'}</strong> · Dolos: <strong>{dolos ? 'healthy' : 'down'}</strong>
        </span>
        <button onClick={() => void load()} style={styles.button} aria-busy={state.loading}>
          {state.loading ? 'Checking…' : 'Re-check'}
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: 'linear-gradient(90deg, #f97316, #ef4444)',
    color: '#0f172a',
    borderBottom: '1px solid rgba(0,0,0,0.08)'
  },
  inner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '10px 16px',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  badge: { fontWeight: 800 },
  button: { background: 'rgba(15,23,42,0.1)', border: '1px solid rgba(15,23,42,0.2)', color: '#0f172a', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }
};
