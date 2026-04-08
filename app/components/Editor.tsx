'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState } from 'react'
import { updateNoteTitle } from '@/app/actions/notes'
import { createClient } from '@/lib/supabase/client'
import type { Note } from '@/types/database'

interface Props {
  note: Note
}

export default function Editor({ note }: Props) {
  const [title, setTitle] = useState(note.title)
  const [saving, setSaving] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: note.content as object || {},
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px]',
      },
    },
    onUpdate: ({ editor }) => {
      autoSave(editor.getJSON())
    },
  })

  useEffect(() => {
    if (editor && note.content) {
      editor.commands.setContent(note.content as object)
    }
    setTitle(note.title)
  }, [note.id])

  let saveTimeout: ReturnType<typeof setTimeout>

  async function autoSave(content: object) {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(async () => {
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
    await updateNoteTitle(note.id, title)
  }

  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-gray-100">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-sm font-bold transition-colors ${
            editor?.isActive('bold') ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          B
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-sm italic transition-colors ${
            editor?.isActive('italic') ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          I
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            editor?.isActive('heading', { level: 1 }) ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          H1
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            editor?.isActive('heading', { level: 2 }) ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          H2
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            editor?.isActive('bulletList') ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          • List
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            editor?.isActive('codeBlock') ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {'</>'}
        </button>

        <span className="ml-auto text-xs text-gray-300">
          {saving ? 'Saving...' : 'Saved'}
        </span>
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