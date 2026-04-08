'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Editor from './Editor'
import type { Notebook, Note } from '@/types/database'

interface Props {
  user: { email: string }
  notebooks: Notebook[]
  notes: Note[]
}

export default function AppShell({ user, notebooks, notes }: Props) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  return (
    <div className="flex w-full h-full">
      <Sidebar
        user={user}
        notebooks={notebooks}
        notes={notes}
        onNoteSelect={setSelectedNote}
        selectedNoteId={selectedNote?.id ?? null}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedNote ? (
          <Editor note={selectedNote} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-300">
            <div className="text-center">
              <p className="text-lg">Select a note or create a new one</p>
              <p className="text-sm mt-1">Your notes will appear here</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}