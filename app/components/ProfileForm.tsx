'use client'

import { useState } from 'react'
import { updateProfile, updatePassword } from '@/app/actions/profile'

interface Props {
  displayName: string
  avatarUrl: string | null
  email: string
}

export default function ProfileForm({ displayName, avatarUrl, email }: Props) {
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg(null)
    const result = await updateProfile(new FormData(e.currentTarget))
    setSavingProfile(false)
    if (result?.error) {
      setProfileMsg({ type: 'error', text: result.error })
    } else {
      setProfileMsg({ type: 'success', text: 'Profile updated' })
    }
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingPassword(true)
    setPasswordMsg(null)
    const result = await updatePassword(new FormData(e.currentTarget))
    setSavingPassword(false)
    if (result?.error) {
      setPasswordMsg({ type: 'error', text: result.error })
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated' })
      ;(e.target as HTMLFormElement).reset()
    }
  }

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white'
  const labelClass = 'block text-xs font-medium text-gray-500 mb-1'

  return (
    <div className="space-y-8 max-w-md">

      {/* Profile section */}
      <section>
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Profile</h2>
        <form onSubmit={handleProfile} className="space-y-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={email}
              disabled
              className={`${inputClass} text-gray-400 cursor-not-allowed bg-gray-50`}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="display_name">Display name</label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              defaultValue={displayName}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="avatar_url">Avatar URL</label>
            <input
              id="avatar_url"
              name="avatar_url"
              type="url"
              defaultValue={avatarUrl ?? ''}
              placeholder="https://example.com/avatar.png"
              className={inputClass}
            />
          </div>

          {profileMsg && (
            <p className={`text-xs ${profileMsg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
              {profileMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {savingProfile ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      <div className="h-px bg-gray-100" />

      {/* Password section */}
      <section>
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Change password</h2>
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="password">New password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              placeholder="Repeat new password"
              className={inputClass}
            />
          </div>

          {passwordMsg && (
            <p className={`text-xs ${passwordMsg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
              {passwordMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={savingPassword}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {savingPassword ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  )
}
