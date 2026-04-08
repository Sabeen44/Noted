'use client'

import { createNote } from '@/app/actions/notes'

interface Props {
  notebookId: string | null
}

export default function NewNoteButton({ notebookId }: Props) {
  async function handleCreate() {
    console.log('NewNoteButton clicked, notebookId:', notebookId)
    if (!notebookId) {
      alert('Create a notebook first')
      return
    }
    const result = await createNote(notebookId)
    console.log('createNote result:', result)
  }

  return (
    <button
      type="button"
      onClick={handleCreate}
      className="text-xs text-violet-600 hover:text-violet-700 px-2"
    >
      + New
    </button>
  )
}