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

export async function createNote(notebookId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  console.log('Creating note in notebook:', notebookId, 'for user:', user?.id)

  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('notes')
    .insert({
      notebook_id: notebookId,
      owner_id: user.id,
      title: 'Untitled',
      content: {},
    })
    .select()
    .single()

  console.log('Note result:', data, error)

  if (error) return { error: error.message }

  revalidatePath('/app')
  return { data }
}

export async function updateNoteTitle(id: string, title: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notes')
    .update({ title })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/app')
}

export async function deleteNote(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)

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