"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }): JSX.Element {
  return (
    <html>
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <h1>Something went wrong</h1>
        <p>{error.message}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => reset()}>Try again</button>
          <a href="/">Go home</a>
        </div>
      </body>
    </html>
  );
}
