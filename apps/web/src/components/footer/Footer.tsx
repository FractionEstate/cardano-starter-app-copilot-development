import React from 'react';

export const Footer: React.FC = (): JSX.Element => {
  const year = new Date().getFullYear();
  const network = process.env.NEXT_PUBLIC_NETWORK || 'Preprod';
  return (
    <footer aria-label="Site footer" style={styles.footer}>
      <div style={styles.inner}>
        <span style={{ opacity: 0.85 }}>© {year} Cardano Starter</span>
        <span style={styles.badge} aria-label={`Network ${network}`}>{network}</span>
      </div>
    </footer>
  );
};

const styles: Record<string, React.CSSProperties> = {
  footer: { borderTop: '1px solid rgba(0,0,0,0.08)', marginTop: 24, padding: '16px 0', background: '#0b1220', color: '#c3d0e6' },
  inner: { maxWidth: 1100, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  badge: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)', padding: '4px 8px', borderRadius: 999, fontSize: 12 }
};
