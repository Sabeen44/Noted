'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import NewNotebookButton from './NewNotebookButton'
import { MoreHorizontal, Users, Search, X, Pin, User } from 'lucide-react'
import type { Notebook, NoteWithPermission } from '@/types/database'

interface Props {
  user: { id: string; email: string; displayName: string | null; avatarUrl: string | null }
  notebooks: Notebook[]
  notes: NoteWithPermission[]
  sharedNotes: NoteWithPermission[]
  pinnedIds: Set<string>
  selectedNotebookId: string | null
  onNotebookSelect: (id: string | null) => void
  onNoteSelect: (note: NoteWithPermission) => void
  selectedNoteId: string | null
  onNewNote: (title: string) => void
  onDeleteNote: (id: string) => void
  onDeleteNotebook: (id: string) => void
  onPinToggle: (id: string) => void
  onReorderNotes: (draggedId: string, targetId: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  searchInputRef: { current: HTMLInputElement | null }
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}

function extractPreview(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const node = content as { text?: string; content?: unknown[] }
  if (typeof node.text === 'string') return node.text
  if (Array.isArray(node.content)) {
    return node.content.map(extractPreview).join(' ').replace(/\s+/g, ' ').trim()
  }
  return ''
}

export default function Sidebar({
  user, notebooks, notes, sharedNotes,
  pinnedIds,
  selectedNotebookId, onNotebookSelect,
  onNoteSelect, selectedNoteId, onNewNote,
  onDeleteNote, onDeleteNotebook,
  onPinToggle, onReorderNotes,
  searchQuery, onSearchChange, searchInputRef,
  hasMore, loadingMore, onLoadMore,
}: Props) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [addingNote, setAddingNote] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const displayName = user.displayName || user.email.split('@')[0]
  const initial = displayName[0].toUpperCase()
  const activeNotebook = notebooks.find(nb => nb.id === selectedNotebookId)

  const notesLabel = searchQuery.trim()
    ? `"${searchQuery}"`
    : activeNotebook ? activeNotebook.name : 'All Notes'

  function toggleMenu(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setOpenMenuId(prev => prev === id ? null : id)
  }

  return (
    <aside className="w-full h-full border-r border-gray-100 bg-gray-50 flex flex-col">

      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}

      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h1 className="font-semibold text-gray-900 text-lg">Noted</h1>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white border border-gray-200 focus-within:border-violet-300 focus-within:ring-1 focus-within:ring-violet-100 transition-all">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') { onSearchChange(''); e.currentTarget.blur() }
            }}
            placeholder="Search notes…  ⌘K"
            className="flex-1 text-xs bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400 min-w-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { onSearchChange(''); searchInputRef.current?.focus() }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Notebooks — hidden while searching */}
      {!searchQuery && (
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2">
              Notebooks
            </p>
            <NewNotebookButton />
          </div>

          {!notebooks?.length ? (
            <div className="flex flex-col items-center gap-2 py-5 px-2 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              <p className="text-xs text-gray-400 leading-relaxed">No notebooks yet.<br />Create one to get started.</p>
            </div>
          ) : (
            notebooks.map(nb => (
              <div key={nb.id} className="relative group">
                <button
                  type="button"
                  onClick={() => onNotebookSelect(nb.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 pr-7 rounded-lg text-sm transition-colors ${
                    selectedNotebookId === nb.id
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-600 hover:bg-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: nb.color }} />
                  <span className="truncate text-left">{nb.name}</span>
                </button>

                <button
                  type="button"
                  onClick={e => toggleMenu(e, nb.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <MoreHorizontal size={13} />
                </button>

                {openMenuId === nb.id && (
                  <div className="absolute right-0 top-full mt-0.5 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[110px]">
                    <button
                      type="button"
                      onClick={() => { onDeleteNotebook(nb.id); setOpenMenuId(null) }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {!searchQuery && <div className="h-px bg-gray-100 mx-3" />}

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 px-2 min-w-0">
            {!searchQuery && activeNotebook && (
              <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: activeNotebook.color }} />
            )}
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide truncate">
              {notesLabel}
            </p>
          </div>
          {!addingNote && !searchQuery && (
            <button
              type="button"
              onClick={() => setAddingNote(true)}
              className="text-xs text-violet-600 hover:text-violet-700 px-2 flex-shrink-0"
            >
              + New
            </button>
          )}
        </div>

        {addingNote && (
          <div className="flex gap-1 mb-2">
            <input
              autoFocus
              value={newNoteTitle}
              onChange={e => setNewNoteTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { onNewNote(newNoteTitle); setNewNoteTitle(''); setAddingNote(false) }
                else if (e.key === 'Escape') { setNewNoteTitle(''); setAddingNote(false) }
              }}
              placeholder="Note title"
              className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
            <button
              type="button"
              onClick={() => { onNewNote(newNoteTitle); setNewNoteTitle(''); setAddingNote(false) }}
              className="text-xs bg-violet-600 text-white px-2 py-1 rounded"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setNewNoteTitle(''); setAddingNote(false) }}
              className="text-xs text-gray-400 px-1"
            >
              ✕
            </button>
          </div>
        )}

        {!notes?.length ? (
          searchQuery ? (
            <div className="flex flex-col items-center gap-2 py-8 px-2 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
              <p className="text-xs text-gray-400">No notes match<br />&ldquo;{searchQuery}&rdquo;</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 px-2 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              <p className="text-xs text-gray-400 leading-relaxed">No notes yet.<br />Hit <span className="font-medium text-gray-500">+ New</span> to create one.</p>
            </div>
          )
        ) : (
          notes.map(note => {
            const isPinned = pinnedIds.has(note.id)
            const isOwned = !note.sharedPermission
            const isDragOver = dragOverId === note.id && dragId !== note.id
            const preview = extractPreview(note.content).slice(0, 60)

            return (
              <div key={note.id} className="relative group">
                {/* Drop target indicator */}
                {isDragOver && (
                  <div className="absolute -top-px left-2 right-2 h-0.5 bg-violet-400 rounded-full pointer-events-none z-10" />
                )}

                <div
                  draggable={isOwned}
                  onDragStart={e => {
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', note.id)
                    setDragId(note.id)
                  }}
                  onDragOver={e => {
                    if (!dragId || dragId === note.id) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setDragOverId(note.id)
                  }}
                  onDragLeave={e => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverId(null)
                    }
                  }}
                  onDrop={e => {
                    e.preventDefault()
                    if (dragId && dragId !== note.id) onReorderNotes(dragId, note.id)
                    setDragId(null)
                    setDragOverId(null)
                  }}
                  onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                  onClick={() => onNoteSelect(note)}
                  className={`px-2 py-2 pr-7 rounded-lg cursor-pointer border transition-colors select-none ${
                    selectedNoteId === note.id
                      ? 'bg-white border-violet-200 shadow-sm'
                      : 'border-transparent hover:bg-white hover:border-gray-100'
                  } ${dragId === note.id ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    {isPinned && <Pin size={9} className="flex-shrink-0 text-violet-400" />}
                    <p className="text-sm font-medium text-gray-900 truncate">{note.title}</p>
                    {note.sharedPermission === 'read' && (
                      <span className="flex-shrink-0 text-[9px] font-medium text-gray-400 border border-gray-200 rounded px-1 leading-4">
                        read
                      </span>
                    )}
                  </div>
                  {preview && <p className="text-xs text-gray-400 truncate mt-0.5">{preview}</p>}
                  <p className="text-xs text-gray-300 mt-0.5">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Context menu — owned notes only */}
                {isOwned && (
                  <>
                    <button
                      type="button"
                      onClick={e => toggleMenu(e, note.id)}
                      className="absolute right-1 top-2 p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <MoreHorizontal size={13} />
                    </button>

                    {openMenuId === note.id && (
                      <div className="absolute right-0 top-full mt-0.5 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
                        <button
                          type="button"
                          onClick={() => { onPinToggle(note.id); setOpenMenuId(null) }}
                          className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {isPinned ? 'Unpin' : 'Pin to top'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { onDeleteNote(note.id); setOpenMenuId(null) }}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })
        )}

        {/* Load more */}
        {hasMore && !searchQuery && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="w-full mt-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        )}

        {/* Shared with me */}
        {sharedNotes.length > 0 && (
          <>
            <div className="flex items-center gap-1.5 px-2 mt-4 mb-2">
              <Users size={11} className="text-violet-400" />
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Shared with me
              </p>
            </div>
            {sharedNotes.map(note => {
              const preview = extractPreview(note.content).slice(0, 60)
              return (
                <div
                  key={note.id}
                  onClick={() => onNoteSelect(note)}
                  className={`px-2 py-2 rounded-lg cursor-pointer border transition-colors ${
                    selectedNoteId === note.id
                      ? 'bg-white border-violet-200 shadow-sm'
                      : 'border-transparent hover:bg-white hover:border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{note.title}</p>
                    {note.sharedPermission === 'read' && (
                      <span className="flex-shrink-0 text-[9px] font-medium text-gray-400 border border-gray-200 rounded px-1 leading-4">
                        read
                      </span>
                    )}
                  </div>
                  {preview && <p className="text-xs text-gray-400 truncate mt-0.5">{preview}</p>}
                  <p className="text-xs text-gray-300 mt-0.5">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 relative">
        <button
          type="button"
          onClick={() => setShowUserMenu(v => !v)}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-white transition-colors"
        >
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
          ) : (
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
              {initial}
            </span>
          )}
          <span className="text-xs text-gray-500 truncate flex-1 text-left">{displayName}</span>
        </button>

        {showUserMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-10">
            <Link
              href="/profile"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-2 w-full text-left text-sm text-gray-600 hover:text-gray-900 px-3 py-2 hover:bg-gray-50 transition-colors"
            >
              <User size={13} />
              Profile
            </Link>
            <div className="h-px bg-gray-100 mx-2 my-1" />
            <form action={logout}>
              <button
                type="submit"
                className="w-full text-left text-sm text-gray-600 hover:text-gray-900 px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>

    </aside>
  )
}
