'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          backgroundColor: '#FAF8F4',
          color: '#0C0D0F',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            border: '1px solid #CFC9BC',
            borderRadius: '10px',
            padding: '28px',
            boxShadow: '0 2px 6px rgba(12, 13, 15, 0.07)',
          }}
        >
          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, 'JetBrains Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: '#565A64',
              marginBottom: '8px',
            }}
          >
            CITEWARD · RUNTIME FAULT RECOVERY
          </div>
          <h1
            style={{
              fontFamily: "Georgia, 'Instrument Serif', serif",
              fontSize: '30px',
              lineHeight: 1.1,
              fontWeight: 400,
              margin: '0 0 12px 0',
              color: '#0C0D0F',
            }}
          >
            Manuscript workspace encountered an unexpected exception
          </h1>
          <p
            style={{
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#363940',
              margin: '0 0 20px 0',
            }}
          >
            {error?.message ||
              'An unhandled client exception interrupted the active inspection view. Your local manuscript buffer has not been transmitted externally.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '10px 18px',
                borderRadius: '6px',
                backgroundColor: '#1939B7',
                color: '#FFFFFF',
                border: '1px solid transparent',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Retry Inspection View
            </button>
            <a
              href="/"
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                backgroundColor: '#FAF8F4',
                color: '#0C0D0F',
                border: '1px solid #CFC9BC',
                fontWeight: 500,
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              Return to Citeward Studio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

