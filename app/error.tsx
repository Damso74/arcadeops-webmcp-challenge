"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-page">
      <h1>ArcadeOps Relay could not load</h1>
      <p>The judge workspace remains isolated. Retry without changing any external system.</p>
      <button className="button button-primary" onClick={reset} type="button">
        Retry
      </button>
    </main>
  );
}
