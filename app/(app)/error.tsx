'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AppError({ error, reset }: Props) {
  useEffect(() => {
    // Log to console so the digest is easy to find when debugging
    console.error('[AppError]', error.digest ?? '(no digest)', error)
  }, [error])

  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm mx-auto px-6 text-center space-y-5">

        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        {/* Message */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-800">Something went wrong</p>
          <p className="text-xs text-gray-400">
            An unexpected error occurred while loading this page.
          </p>
        </div>

        {/* Digest — useful for matching against Vercel / server logs */}
        {error.digest && (
          <p className="inline-block text-[10px] font-mono text-gray-400 bg-gray-100 border border-gray-200 rounded px-2 py-1 select-all">
            {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={reset}
            className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Try again
          </button>
          <Link
            href="/app"
            className="w-full py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition-colors"
          >
            Back to notes
          </Link>
        </div>

      </div>
    </div>
  )
}
