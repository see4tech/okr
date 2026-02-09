import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import { ui } from '@/lib/i18n'

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session: s } } = await supabase.auth.getSession()
      return s
    },
  })
  const userId = session?.user?.id ?? ''

  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
      if (error) throw error
      return data as { role: string } | null
    },
    enabled: !!userId,
  })
  const isAdmin = profile?.role === 'admin'

  async function handleSignOut() {
    await signOut()
    navigate('/login')
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <nav className="flex items-center gap-6">
          <Link to="/" className="font-semibold text-gray-900">
            {ui.appName}
          </Link>
          <Link to="/" className="text-gray-600 hover:text-gray-900 text-sm">
            {ui.home}
          </Link>
          <Link to="/board" className="text-gray-600 hover:text-gray-900 text-sm">
            {ui.teamBoard}
          </Link>
          <Link to="/director" className="text-gray-600 hover:text-gray-900 text-sm">
            {ui.director}
          </Link>
          {isAdmin && (
            <Link to="/admin/teams" className="text-gray-600 hover:text-gray-900 text-sm">
              {ui.adminTeams}
            </Link>
          )}
        </nav>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {ui.signOut}
        </button>
      </header>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  )
}
