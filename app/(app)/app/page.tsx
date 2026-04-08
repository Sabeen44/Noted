import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/actions/auth'

import NewNotebookButton from '@/app/components/NewNotebookButton'
import NewNoteButton from '@/app/components/NewNoteButton'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: notebooks } = await supabase
    .from('notebooks')
    .select('*')
    .order('created_at', { ascending: true })

  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })

    console.log('notebooks:', notebooks)
  return (
    <div className="flex w-full h-full">

      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-100 bg-gray-50 flex flex-col">

        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <h1 className="font-semibold text-gray-900 text-lg">Noted</h1>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
        </div>

        <div className="p-3">
  <div className="flex items-center justify-between mb-2">
    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2">
      Notebooks
    </p>
    <NewNotebookButton />
  </div>

  {notebooks?.length === 0 || !notebooks ? (
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
      {/* Notes list */}
<div className="flex-1 overflow-y-auto p-3">
  <div className="flex items-center justify-between mb-2">
    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2">
      Notes
    </p>
    <NewNoteButton notebookId={notebooks?.[0]?.id ?? null} />
  </div>

  {notes?.length === 0 || !notes ? (
    <p className="text-xs text-gray-400 px-2 py-1">No notes yet</p>
  ) : (
    notes.map(note => (
      <div
        key={note.id}
        className="px-2 py-2 rounded-lg hover:bg-white cursor-pointer border border-transparent hover:border-gray-100"
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

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center text-gray-300">
          <div className="text-center">
            <p className="text-lg">Select a note or create a new one</p>
            <p className="text-sm mt-1">Your notes will appear here</p>
          </div>
        </div>
      </main>

    </div>
  )
}