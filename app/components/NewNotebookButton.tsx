'use client'

import { useState } from 'react'
import { createNotebook } from '@/app/actions/notes'

export default function NewNotebookButton() {
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')

  async function handleCreate() {
    if (!name.trim()) return
    const formData = new FormData()
    formData.append('name', name)
    await createNotebook(formData)
    setName('')
    setShow(false)
  }

  if (show) return (
    <div className="px-2 mt-1 flex gap-1">
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleCreate()}
        placeholder="Notebook name"
        className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-violet-400"
      />
      <button
        onClick={handleCreate}
        className="text-xs bg-violet-600 text-white px-2 py-1 rounded"
      >
        Add
      </button>
      <button
        onClick={() => setShow(false)}
        className="text-xs text-gray-400 px-1"
      >
        ✕
      </button>
    </div>
  )

  return (
    <button
      onClick={() => setShow(true)}
      className="text-xs text-violet-600 hover:text-violet-700 px-2"
    >
      + New
    </button>
  )
}