import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import type { Note, NoteWithPermission } from '@/types/database'

const PAGE_SIZE = 50

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: notebooks },
    { data: ownedNotes, count: ownedCount },
    { data: shareRows },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('notebooks')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('notes')
      .select('*', { count: 'exact' })
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })
      .range(0, PAGE_SIZE - 1),
    supabase
      .from('note_shares')
      .select('permission, notes(*)')
      .eq('shared_with_user_id', user.id),
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single(),
  ])

  const sharedNotes: NoteWithPermission[] = (shareRows ?? [])
    .filter((row): row is typeof row & { notes: Note } => row.notes !== null)
    .map(row => ({
      ...(row.notes as unknown as Note),
      sharedPermission: row.permission as 'read' | 'edit',
    }))

  const totalOwned = ownedCount ?? 0

  return (
    <AppShell
      user={{
        id: user.id,
        email: user.email!,
        displayName: profile?.display_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      }}
      notebooks={notebooks ?? []}
      initialOwnedNotes={ownedNotes ?? []}
      sharedNotes={sharedNotes}
      initialHasMore={totalOwned > PAGE_SIZE}
    />
  )
}
