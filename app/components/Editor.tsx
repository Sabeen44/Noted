'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'
import { useEffect, useRef, useState } from 'react'
import { updateNoteTitle } from '@/app/actions/notes'
import { useCollaboration } from '@/lib/collaboration'
import { createClient } from '@/lib/supabase/client'
import type { Note } from '@/types/database'
import ShareModal from './ShareModal'
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, Highlighter,
  Heading1, Heading2,
  List, ListOrdered,
  Code, Code2, Quote,
  Link2, Image as ImageIcon, Minus,
  ChevronLeft, Share2, Lock, Download,
} from 'lucide-react'

const lowlight = createLowlight(common)

const Sep = () => <span className="w-px h-4 bg-gray-200 flex-shrink-0 mx-0.5" />

interface Props {
  note: Note
  sharedPermission?: 'read' | 'edit'
  onBack?: () => void
}

export default function Editor({ note, sharedPermission, onBack }: Props) {
  const [title, setTitle] = useState(note.title)
  const [saving, setSaving] = useState(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showShare, setShowShare] = useState(false)

  // Inline input bars
  const [showLinkBar, setShowLinkBar] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [showImageBar, setShowImageBar] = useState(false)
  const [imageInput, setImageInput] = useState('')
  const linkInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const isReadOnly = sharedPermission === 'read'
  const isOwned = sharedPermission === undefined

  const { ydoc, status } = useCollaboration(note.id)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,  // replaced by CodeBlockLowlight below
        undoRedo: false,   // replaced by Collaboration's Y.UndoManager
      }),
      Collaboration.configure({ document: ydoc }),
      CodeBlockLowlight.configure({ lowlight }),
      Highlight,
      Image.configure({ allowBase64: true }),
    ],
    content: (note.content && Object.keys(note.content as object).length > 0)
      ? note.content as object
      : undefined,
    editable: !isReadOnly,
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
    editor?.setEditable(!isReadOnly)
  }, [isReadOnly, editor])

  useEffect(() => {
    if (showLinkBar) linkInputRef.current?.focus()
  }, [showLinkBar])

  useEffect(() => {
    if (showImageBar) imageInputRef.current?.focus()
  }, [showImageBar])

  function handleLinkClick() {
    if (!editor) return
    const currentHref = editor.getAttributes('link').href ?? ''
    setLinkInput(currentHref)
    setShowLinkBar(v => !v)
    setShowImageBar(false)
  }

  function applyLink() {
    if (!editor) return
    const trimmed = linkInput.trim()
    if (trimmed) {
      const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
      editor.chain().focus().setLink({ href }).run()
    } else {
      editor.chain().focus().unsetLink().run()
    }
    setShowLinkBar(false)
    setLinkInput('')
  }

  function handleImageClick() {
    setShowImageBar(v => !v)
    setShowLinkBar(false)
    setImageInput('')
  }

  function applyImage() {
    if (!editor || !imageInput.trim()) return
    editor.chain().focus().setImage({ src: imageInput.trim() }).run()
    setShowImageBar(false)
    setImageInput('')
  }

  function handleExport() {
    const html = editor?.getHTML() ?? ''
    const doc = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 2rem auto; line-height: 1.7; color: #111; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    code { background: #f4f4f4; padding: 0.15em 0.3em; border-radius: 3px; font-size: 0.9em; }
    blockquote { border-left: 3px solid #d1d5db; margin: 0; padding-left: 1rem; color: #6b7280; }
    img { max-width: 100%; border-radius: 6px; }
    mark { background: #fef08a; }
  </style>
</head><body>
  <h1>${title}</h1>
  ${html}
</body></html>`
    const blob = new Blob([doc], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'note'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function autoSave(content: object) {
    if (isReadOnly) return
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setSaving(true)
      const supabase = createClient()
      await supabase.from('notes').update({ content }).eq('id', note.id)
      setSaving(false)
    }, 1000)
  }

  async function handleTitleBlur() {
    if (isReadOnly) return
    setSaving(true)
    await updateNoteTitle(note.id, title)
    setSaving(false)
  }

  const btn = (active: boolean) =>
    `flex-shrink-0 p-1.5 rounded transition-colors ${active ? 'bg-violet-100 text-violet-700' : 'text-gray-400 hover:text-gray-600'}`

  const connected = status === 'connected'

  const wordCount = editor?.getText().trim().split(/\s+/).filter(Boolean).length ?? 0
  const readingTime = Math.ceil(wordCount / 200)

  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="border-b border-gray-100">
        <div className="flex items-center gap-2 px-3 md:px-6 py-2">
          <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 scrollbar-none">

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="md:hidden flex-shrink-0 mr-1 p-1.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                aria-label="Back"
              >
                <ChevronLeft size={16} />
              </button>
            )}

            {isReadOnly ? (
              <span className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400">
                <Lock size={11} />
                Read only
              </span>
            ) : (
              <>
                {/* Inline formatting */}
                <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleBold().run() }} className={btn(!!editor?.isActive('bold'))} aria-label="Bold"><Bold size={14} /></button>
                <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleItalic().run() }} className={btn(!!editor?.isActive('italic'))} aria-label="Italic"><Italic size={14} /></button>
                <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleStrike().run() }} className={btn(!!editor?.isActive('strike'))} aria-label="Strikethrough"><Strikethrough size={14} /></button>
                <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleUnderline().run() }} className={btn(!!editor?.isActive('underline'))} aria-label="Underline"><UnderlineIcon size={14} /></button>
                <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleHighlight().run() }} className={btn(!!editor?.isActive('highlight'))} aria-label="Highlight"><Highlighter size={14} /></button>

                <Sep />

                {/* Headings */}
                <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 1 }).run() }} className={btn(!!editor?.isActive('heading', { level: 1 }))} aria-label="Heading 1"><Heading1 size={14} /></button>
                <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 2 }).run() }} className={btn(!!editor?.isActive('heading', { level: 2 }))} aria-label="Heading 2"><Heading2 size={14} /></button>

                <Sep />

                {/* Lists */}
                <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run() }} className={btn(!!editor?.isActive('bulletList'))} aria-label="Bullet list"><List size={14} /></button>
                <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run() }} className={btn(!!editor?.isActive('orderedList'))} aria-label="Ordered list"><ListOrdered size={14} /></button>

                <Sep />

                {/* Code & blocks */}
                <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleCode().run() }} className={btn(!!editor?.isActive('code'))} aria-label="Inline code"><Code size={14} /></button>
                <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleCodeBlock().run() }} className={btn(!!editor?.isActive('codeBlock'))} aria-label="Code block"><Code2 size={14} /></button>
                <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleBlockquote().run() }} className={btn(!!editor?.isActive('blockquote'))} aria-label="Quote"><Quote size={14} /></button>

                <Sep />

                {/* Insert */}
                <button type="button" onClick={handleLinkClick} className={btn(!!editor?.isActive('link') || showLinkBar)} aria-label="Link"><Link2 size={14} /></button>
                <button type="button" onClick={handleImageClick} className={btn(showImageBar)} aria-label="Insert image"><ImageIcon size={14} /></button>
                <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().setHorizontalRule().run() }} className={btn(false)} aria-label="Horizontal rule"><Minus size={14} /></button>

                <Sep />

                {/* Actions */}
                {isOwned && (
                  <button
                    type="button"
                    onClick={() => setShowShare(true)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                  >
                    <Share2 size={12} />
                    Share
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex-shrink-0 p-1.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Export as HTML"
                >
                  <Download size={14} />
                </button>
              </>
            )}
          </div>

          {/* Status */}
          <div className="flex-shrink-0 flex items-center gap-2 pl-1">
            {!isReadOnly && wordCount > 0 && (
              <span className="text-xs text-gray-300 hidden md:inline">
                {wordCount}w · {readingTime} min read
              </span>
            )}
            <span className={`text-xs ${connected ? 'text-green-400' : 'text-gray-300'}`}>
              {connected ? '● Live' : '○ Offline'}
            </span>
            {!isReadOnly && (
              <span className="text-xs text-gray-300">
                {saving ? 'Saving...' : 'Saved'}
              </span>
            )}
          </div>
        </div>

        {/* Link input bar */}
        {showLinkBar && !isReadOnly && (
          <div className="flex items-center gap-2 px-3 md:px-6 py-1.5 border-t border-gray-100 bg-gray-50">
            <Link2 size={13} className="text-gray-400 flex-shrink-0" />
            <input
              ref={linkInputRef}
              type="url"
              value={linkInput}
              onChange={e => setLinkInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink() }
                if (e.key === 'Escape') { setShowLinkBar(false); setLinkInput('') }
              }}
              placeholder="https://example.com"
              className="flex-1 text-xs bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400"
            />
            {editor?.isActive('link') && (
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkBar(false) }}
                className="text-xs text-red-500 hover:text-red-700 flex-shrink-0 transition-colors"
              >
                Remove
              </button>
            )}
            <button type="button" onClick={applyLink} className="text-xs text-violet-600 hover:text-violet-700 font-medium flex-shrink-0 transition-colors">Apply</button>
            <button type="button" onClick={() => { setShowLinkBar(false); setLinkInput('') }} className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors">✕</button>
          </div>
        )}

        {/* Image input bar */}
        {showImageBar && !isReadOnly && (
          <div className="flex items-center gap-2 px-3 md:px-6 py-1.5 border-t border-gray-100 bg-gray-50">
            <ImageIcon size={13} className="text-gray-400 flex-shrink-0" />
            <input
              ref={imageInputRef}
              type="url"
              value={imageInput}
              onChange={e => setImageInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); applyImage() }
                if (e.key === 'Escape') { setShowImageBar(false); setImageInput('') }
              }}
              placeholder="https://example.com/image.png — or paste an image"
              className="flex-1 text-xs bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400"
            />
            <button type="button" onClick={applyImage} className="text-xs text-violet-600 hover:text-violet-700 font-medium flex-shrink-0 transition-colors">Insert</button>
            <button type="button" onClick={() => { setShowImageBar(false); setImageInput('') }} className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors">✕</button>
          </div>
        )}
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6">
        <input
          value={title}
          onChange={e => !isReadOnly && setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          readOnly={isReadOnly}
          className={`w-full text-xl md:text-2xl font-semibold text-gray-900 border-none outline-none mb-4 bg-transparent ${isReadOnly ? 'cursor-default select-text' : ''}`}
          placeholder="Untitled"
        />
        <EditorContent editor={editor} />
      </div>

      {showShare && (
        <ShareModal
          noteId={note.id}
          onClose={() => setShowShare(false)}
        />
      )}

    </div>
  )
}
