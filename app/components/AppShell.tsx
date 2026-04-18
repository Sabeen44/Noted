'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import Sidebar from './Sidebar'
import Editor from './Editor'
import { createNote, deleteNote, deleteNotebook, loadMoreNotes } from '@/app/actions/notes'
import type { Notebook, NoteWithPermission } from '@/types/database'

// Shared with Sidebar for search-by-content
function extractText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const node = content as { text?: string; content?: unknown[] }
  if (typeof node.text === 'string') return node.text
  if (Array.isArray(node.content)) {
    return node.content.map(extractText).join(' ').replace(/\s+/g, ' ').trim()
  }
  return ''
}

interface Props {
  user: { id: string; email: string; displayName: string | null; avatarUrl: string | null }
  notebooks: Notebook[]
  initialOwnedNotes: NoteWithPermission[]
  sharedNotes: NoteWithPermission[]
  initialHasMore: boolean
}

export default function AppShell({ user, notebooks, initialOwnedNotes, sharedNotes, initialHasMore }: Props) {
  const [selectedNote, setSelectedNote] = useState<NoteWithPermission | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null)

  // ── Owned notes (paginated) ──────────────────────────────────────────────────
  const [ownedNotes, setOwnedNotes] = useState<NoteWithPermission[]>(initialOwnedNotes)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)

  // ── Search ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ── Pinning & ordering (persisted to localStorage) ──────────────────────────
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set())
  const [noteOrder, setNoteOrder] = useState<string[]>([])

  useEffect(() => {
    try {
      const p = localStorage.getItem(`noted-pins-${user.id}`)
      if (p) setPinnedIds(new Set(JSON.parse(p) as string[]))

      const o = localStorage.getItem(`noted-order-${user.id}`)
      if (o) setNoteOrder(JSON.parse(o) as string[])
    } catch { /* ignore parse errors */ }
  }, [user.id])

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      const target = e.target as HTMLElement
      const inEditor =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if (meta && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }

      if (meta && e.key === 'n' && !inEditor) {
        e.preventDefault()
        const targetNotebook = selectedNotebookId ?? notebooks[0]?.id
        if (targetNotebook) createNote(targetNotebook, '')
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [notebooks, selectedNotebookId])

  // ── Sorting ─────────────────────────────────────────────────────────────────
  function sorted(arr: NoteWithPermission[]): NoteWithPermission[] {
    const orderMap = new Map(noteOrder.map((id, i) => [id, i]))
    return [...arr].sort((a, b) => {
      const ap = pinnedIds.has(a.id), bp = pinnedIds.has(b.id)
      if (ap !== bp) return ap ? -1 : 1
      const ai = orderMap.has(a.id) ? orderMap.get(a.id)! : Infinity
      const bi = orderMap.has(b.id) ? orderMap.get(b.id)! : Infinity
      if (ai !== bi) return ai - bi
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }

  // ── Derived note lists ───────────────────────────────────────────────────────
  const q = searchQuery.toLowerCase().trim()

  function matchesSearch(n: NoteWithPermission) {
    return n.title.toLowerCase().includes(q) || extractText(n.content).toLowerCase().includes(q)
  }

  const baseOwned = q
    ? ownedNotes
    : selectedNotebookId
      ? ownedNotes.filter((n: NoteWithPermission) => n.notebook_id === selectedNotebookId)
      : ownedNotes

  const displayNotes = q ? sorted(baseOwned).filter(matchesSearch) : sorted(baseOwned)
  const displayShared = q ? sharedNotes.filter(matchesSearch) : sharedNotes

  // ── Load more ────────────────────────────────────────────────────────────────
  async function handleLoadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const result = await loadMoreNotes(ownedNotes.length, selectedNotebookId)
    if ('notes' in result && result.notes.length > 0) {
      setOwnedNotes(prev => [...prev, ...(result.notes as NoteWithPermission[])])
      setHasMore(result.notes.length === 50)
    } else {
      setHasMore(false)
    }
    setLoadingMore(false)
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handlePinToggle(noteId: string) {
    setPinnedIds(prev => {
      const next = new Set(prev)
      next.has(noteId) ? next.delete(noteId) : next.add(noteId)
      try { localStorage.setItem(`noted-pins-${user.id}`, JSON.stringify([...next])) } catch { /* noop */ }
      return next
    })
  }

  function handleReorderNotes(draggedId: string, targetId: string) {
    const allIds = ownedNotes.map((n: NoteWithPermission) => n.id)
    setNoteOrder(prev => {
      const current = [
        ...prev.filter((id: string) => allIds.includes(id)),
        ...allIds.filter((id: string) => !prev.includes(id)),
      ]
      const from = current.indexOf(draggedId)
      const to = current.indexOf(targetId)
      if (from === -1 || to === -1 || from === to) return prev
      const next = [...current]
      next.splice(from, 1)
      next.splice(to, 0, draggedId)
      try { localStorage.setItem(`noted-order-${user.id}`, JSON.stringify(next)) } catch { /* noop */ }
      return next
    })
  }

  function handleNoteSelect(note: NoteWithPermission) {
    setSelectedNote(note)
    setSidebarOpen(false)
  }

  function handleNotebookSelect(id: string | null) {
    setSelectedNotebookId(prev => prev === id ? null : id)
    setSearchQuery('')
  }

  async function handleDeleteNote(noteId: string) {
    const note = ownedNotes.find((n: NoteWithPermission) => n.id === noteId)
    if (!note || note.owner_id !== user.id) return
    await deleteNote(noteId)
    setOwnedNotes(prev => prev.filter((n: NoteWithPermission) => n.id !== noteId))
    if (selectedNote?.id === noteId) { setSelectedNote(null); setSidebarOpen(true) }
  }

  async function handleDeleteNotebook(notebookId: string) {
    await deleteNotebook(notebookId)
    if (selectedNotebookId === notebookId) setSelectedNotebookId(null)
    if (selectedNote?.notebook_id === notebookId) { setSelectedNote(null); setSidebarOpen(true) }
  }

  async function handleNewNote(title: string) {
    const targetId = selectedNotebookId ?? notebooks[0]?.id
    if (!targetId) { toast.error('Create a notebook first'); return }
    const result = await createNote(targetId, title)
    if (result?.data) {
      setOwnedNotes(prev => [result.data as NoteWithPermission, ...prev])
    }
  }

  const sidebarVisible = sidebarOpen || !selectedNote

  return (
    <div className="flex w-full h-full">
      <div className={`${sidebarVisible ? 'flex' : 'hidden'} md:flex w-full md:w-64 flex-shrink-0 flex-col`}>
        <Sidebar
          user={user}
          notebooks={notebooks}
          notes={displayNotes}
          sharedNotes={displayShared}
          pinnedIds={pinnedIds}
          selectedNotebookId={selectedNotebookId}
          onNotebookSelect={handleNotebookSelect}
          onNoteSelect={handleNoteSelect}
          selectedNoteId={selectedNote?.id ?? null}
          onNewNote={handleNewNote}
          onDeleteNote={handleDeleteNote}
          onDeleteNotebook={handleDeleteNotebook}
          onPinToggle={handlePinToggle}
          onReorderNotes={handleReorderNotes}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchInputRef={searchInputRef}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={handleLoadMore}
        />
      </div>

      <main className={`${!sidebarVisible ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-hidden`}>
        {selectedNote ? (
          <div key={selectedNote.id} className="flex flex-col h-full animate-fade-in">
            <Editor
              note={selectedNote}
              sharedPermission={selectedNote.sharedPermission}
              onBack={() => setSidebarOpen(true)}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-violet-400" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">No note open</p>
                <p className="text-xs text-gray-400 mt-1">Select a note or create a new one</p>
              </div>
              <button
                type="button"
                onClick={() => handleNewNote('')}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                + New note
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
