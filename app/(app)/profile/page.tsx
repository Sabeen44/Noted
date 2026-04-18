import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileForm from '@/app/components/ProfileForm'
import { ChevronLeft } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-4"
        >
          <ChevronLeft size={14} />
          Back to notes
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Account settings</h1>
        <p className="text-sm text-gray-400 mt-1">{user.email}</p>
      </div>

      <ProfileForm
        displayName={profile?.display_name ?? user.email!.split('@')[0]}
        avatarUrl={profile?.avatar_url ?? null}
        email={user.email!}
      />
    </div>
  )
}
