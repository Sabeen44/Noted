'use client'

import { useState } from 'react'
import { shareNote } from '@/app/actions/notes'

interface Props {
  noteId: string
  onClose: () => void
}

export default function ShareModal({ noteId, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'read' | 'edit'>('edit')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleShare() {
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    const result = await shareNote(noteId, email.trim(), permission)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setEmail('')
      setTimeout(() => setSuccess(false), 2000)
    }
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-sm shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Share note</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleShare()}
              placeholder="collaborator@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Permission
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPermission('edit')}
                className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                  permission === 'edit'
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'border-gray-200 text-gray-600 hover:border-violet-300'
                }`}
              >
                Can edit
              </button>
              <button
                type="button"
                onClick={() => setPermission('read')}
                className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                  permission === 'read'
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'border-gray-200 text-gray-600 hover:border-violet-300'
                }`}
              >
                Can read
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Note shared successfully!
            </p>
          )}

          <button
            type="button"
            onClick={handleShare}
            disabled={loading || !email.trim()}
            className="w-full py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  )
}