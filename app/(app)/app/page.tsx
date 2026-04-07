import { logout } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome to Noted</h1>
      <p className="text-gray-500 mt-1">{user.email}</p>
      <form action={logout} className="mt-6">
        <button type="submit" className="text-sm text-red-500 hover:underline">
          Sign out
        </button>
      </form>
    </div>
  )
}