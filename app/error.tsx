'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[GlobalError]', error.digest ?? '(no digest)', error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
        <div className="w-full max-w-sm mx-auto px-6 text-center space-y-5">

          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f87171' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <div className="space-y-1">
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>Something went wrong</p>
            <p style={{ fontSize: 12, color: '#9ca3af' }}>
              An unexpected error occurred. Please try again.
            </p>
          </div>

          {error.digest && (
            <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#9ca3af', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 4, padding: '2px 8px', display: 'inline-block', userSelect: 'all' }}>
              {error.digest}
            </p>
          )}

          <button
            type="button"
            onClick={reset}
            style={{ width: '100%', padding: '8px 0', background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 500, borderRadius: 12, border: 'none', cursor: 'pointer' }}
          >
            Try again
          </button>

        </div>
      </body>
    </html>
  )
}
