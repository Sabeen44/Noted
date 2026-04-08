'use client'

import { useState } from 'react'
import { logout } from '@/app/actions/auth'
import { createNote } from '@/app/actions/notes'
import NewNotebookButton from './NewNotebookButton'
import type { Notebook, Note } from '@/types/database'

interface Props {
  user: { email: string }
  notebooks: Notebook[]
  notes: Note[]
  onNoteSelect: (note: Note) => void
  selectedNoteId: string | null
}

export default function Sidebar({ user, notebooks, notes, onNoteSelect, selectedNoteId }: Props) {
  async function handleNewNote() {
    if (!notebooks?.length) {
      alert('Create a notebook first')
      return
    }
    await createNote(notebooks[0].id)
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-100 bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h1 className="font-semibold text-gray-900 text-lg">Noted</h1>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
      </div>

      {/* Notebooks */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2">
            Notebooks
          </p>
          <NewNotebookButton />
        </div>

        {!notebooks?.length ? (
          <p className="text-xs text-gray-400 px-2 py-1">No notebooks yet</p>
        ) : (
          notebooks.map(nb => (
            <div
              key={nb.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white cursor-pointer text-sm text-gray-700"
            >
              <span
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ background: nb.color }}
              />
              <span className="truncate">{nb.name}</span>
            </div>
          ))
        )}
      </div>

      <div className="h-px bg-gray-100 mx-3" />

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2">
            Notes
          </p>
          <button
            type="button"
            onClick={handleNewNote}
            className="text-xs text-violet-600 hover:text-violet-700 px-2"
          >
            + New
          </button>
        </div>

        {!notes?.length ? (
          <p className="text-xs text-gray-400 px-2 py-1">No notes yet</p>
        ) : (
          notes.map(note => (
            <div
              key={note.id}
              onClick={() => onNoteSelect(note)}
              className={`px-2 py-2 rounded-lg cursor-pointer border transition-colors ${
                selectedNoteId === note.id
                  ? 'bg-white border-violet-200 shadow-sm'
                  : 'border-transparent hover:bg-white hover:border-gray-100'
              }`}
            >
              <p className="text-sm font-medium text-gray-900 truncate">{note.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(note.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <form action={logout}>
          <button
            type="submit"
            className="w-full text-left text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-white transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>

    </aside>
  )
}