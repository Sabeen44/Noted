'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef, useState } from 'react'
import { updateNoteTitle } from '@/app/actions/notes'
import { subscribeToNote } from '@/lib/collaboration'
import { createClient } from '@/lib/supabase/client'
import type { Note } from '@/types/database'

interface Props {
  note: Note
}

export default function Editor({ note }: Props) {
  const [title, setTitle] = useState(note.title)
  const [saving, setSaving] = useState(false)
  const [connected, setConnected] = useState(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRemoteUpdate = useRef(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: (note.content && Object.keys(note.content as object).length > 0)
      ? note.content as object
      : '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px]',
      },
    },
    onUpdate: ({ editor }) => {
      if (isRemoteUpdate.current) return
      autoSave(editor.getJSON())
    },
  })

  // Subscribe to realtime changes from other users
  useEffect(() => {
    setConnected(true)

    const unsubscribe = subscribeToNote(note.id, (content) => {
      if (!editor) return
      isRemoteUpdate.current = true
      const { from, to } = editor.state.selection
      editor.commands.setContent(content)
      editor.commands.setTextSelection({ from, to })
      isRemoteUpdate.current = false
    })

    return () => {
      unsubscribe()
      setConnected(false)
    }
  }, [note.id, editor])

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(
        (note.content && Object.keys(note.content as object).length > 0)
          ? note.content as object
          : '<p></p>'
      )
      setTitle(note.title)
    }
  }, [note.id])

  async function autoSave(content: object) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setSaving(true)
      const supabase = createClient()
      await supabase
        .from('notes')
        .update({ content })
        .eq('id', note.id)
      setSaving(false)
    }, 1000)
  }

  async function handleTitleBlur() {
    setSaving(true)
    await updateNoteTitle(note.id, title)
    setSaving(false)
  }

  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-gray-100">
        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-sm font-bold transition-colors ${editor?.isActive('bold') ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
          B
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-sm italic transition-colors ${editor?.isActive('italic') ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
          I
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded text-xs transition-colors ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
          H1
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded text-xs transition-colors ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
          H2
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded text-xs transition-colors ${editor?.isActive('bulletList') ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
          • List
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded text-xs transition-colors ${editor?.isActive('orderedList') ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
          1. List
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          className={`px-2 py-1 rounded text-xs transition-colors ${editor?.isActive('codeBlock') ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
          {'</>'}
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={`px-2 py-1 rounded text-xs transition-colors ${editor?.isActive('blockquote') ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
          ❝
        </button>

        <div className="ml-auto flex items-center gap-3">
          <span className={`text-xs ${connected ? 'text-green-400' : 'text-gray-300'}`}>
            {connected ? '● Live' : '○ Offline'}
          </span>
          <span className="text-xs text-gray-300">
            {saving ? 'Saving...' : 'Saved'}
          </span>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="w-full text-2xl font-semibold text-gray-900 border-none outline-none mb-4 bg-transparent"
          placeholder="Untitled"
        />
        <EditorContent editor={editor} />
      </div>

    </div>
  )
}