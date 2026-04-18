'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createNotebook(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('notebooks')
    .insert({
      owner_id: user.id,
      name: formData.get('name') as string || 'Untitled Notebook',
      color: formData.get('color') as string || '#7F77DD',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/app')
  return { data }
}

export async function createNote(notebookId: string, title = 'Untitled') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('notes')
    .insert({
      notebook_id: notebookId,
      owner_id: user.id,
      title: title.trim() || 'Untitled',
      content: {},
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/app')
  return { data }
}

export async function updateNoteTitle(id: string, title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Check ownership or edit permission
  const { data: note } = await supabase
    .from('notes')
    .select('owner_id')
    .eq('id', id)
    .single()

  if (!note) return { error: 'Note not found' }

  if (note.owner_id !== user.id) {
    const { data: share } = await supabase
      .from('note_shares')
      .select('permission')
      .eq('note_id', id)
      .eq('shared_with_user_id', user.id)
      .single()

    if (!share || share.permission !== 'edit') {
      return { error: 'Not authorized' }
    }
  }

  const { error } = await supabase
    .from('notes')
    .update({ title })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/app')
}

export async function deleteNote(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/app')
}

export async function deleteNotebook(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase
    .from('notebooks')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/app')
}

export async function shareNote(noteId: string, email: string, permission: 'read' | 'edit') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Find the user to share with by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (profileError || !profile) return { error: 'User not found' }

  // Prevent sharing with yourself
  if (profile.id === user.id) return { error: 'You cannot share a note with yourself' }

  // Check the current user owns this note
  const { data: note } = await supabase
    .from('notes')
    .select('owner_id')
    .eq('id', noteId)
    .single()

  if (!note || note.owner_id !== user.id) return { error: 'Not authorized' }

  const { error } = await supabase
    .from('note_shares')
    .upsert({
      note_id: noteId,
      shared_with_user_id: profile.id,
      permission,
    })

  if (error) return { error: error.message }

  revalidatePath('/app')
  return { success: true }
}

export async function loadMoreNotes(offset: number, notebookId?: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let query = supabase
    .from('notes')
    .select('*')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })
    .range(offset, offset + 49)

  if (notebookId) query = query.eq('notebook_id', notebookId)

  const { data, error } = await query

  if (error) return { error: error.message, notes: [] }
  return { notes: data ?? [] }
}

export async function removeShare(noteId: string, userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('note_shares')
    .delete()
    .eq('note_id', noteId)
    .eq('shared_with_user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/app')
}
