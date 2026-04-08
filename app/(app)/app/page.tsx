import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/app/components/AppShell'

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

  return (
    <AppShell
      user={{ email: user.email! }}
      notebooks={notebooks ?? []}
      notes={notes ?? []}
    />
  )
}