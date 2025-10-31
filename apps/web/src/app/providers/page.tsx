"use client";
import React from 'react';

export default function ProvidersPage(): JSX.Element {
  const [data, setData] = React.useState<any>(null);
  const [readiness, setReadiness] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [s, r] = await Promise.all([
        fetch(`${apiUrl}/cardano/status`, { cache: 'no-store' }),
        fetch(`${apiUrl}/cardano/readiness`, { cache: 'no-store' }),
      ]);
      const sj = await s.json().catch(() => ({}));
      const rj = await r.json().catch(() => ({}));
      setData(sj); setReadiness(rj);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  React.useEffect(() => { void load(); }, [load]);

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '16px' }}>
      <h1>Providers</h1>
      <p>Raw provider status and readiness from the backend.</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => void load()} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        {error && <span role="alert" style={{ color: '#ef4444' }}>{error}</span>}
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginTop: 12 }}>
        <section>
          <h2>Status</h2>
          <pre aria-label="status-json" style={{ whiteSpace: 'pre-wrap', background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8 }}>{JSON.stringify(data, null, 2)}</pre>
        </section>
        <section>
          <h2>Readiness</h2>
          <pre aria-label="readiness-json" style={{ whiteSpace: 'pre-wrap', background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8 }}>{JSON.stringify(readiness, null, 2)}</pre>
        </section>
      </div>
    </main>
  );
}
