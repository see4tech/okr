import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import { ui } from '@/lib/i18n'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
  selectedTeamId?: string | null
  onSelectTeam?: (teamId: string | null) => void
  showTeams?: boolean
}

export function Layout({ children, selectedTeamId, onSelectTeam, showTeams = false }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session: s } } = await supabase.auth.getSession()
      return s
    },
  })
  const userId = session?.user?.id ?? ''
  const userEmail = session?.user?.email ?? ''

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

  const navLinks = [
    { to: '/', label: ui.home, icon: null as React.ReactNode },
    { to: '/board', label: ui.teamBoard, icon: null as React.ReactNode },
    { to: '/director', label: ui.director, icon: null as React.ReactNode },
    ...(isAdmin ? [{ to: '/admin/teams', label: ui.adminTeams, icon: null as React.ReactNode }] : []),
  ]

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Thin header: logo + user */}
      <header className="bg-brand-900 text-white px-4 flex items-center justify-between h-14 shrink-0 shadow-md z-20">
        <div className="flex items-center gap-2">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-1.5 rounded hover:bg-brand-800"
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
          <Link to="/" className="font-bold text-lg tracking-tight">
            {ui.appName}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-brand-200 truncate max-w-[200px]">
            {userEmail}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm text-brand-200 hover:text-white px-2 py-1 rounded hover:bg-brand-800"
          >
            {ui.signOut}
          </button>
        </div>
      </header>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 space-y-1 z-10 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                isActive(link.to)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          navLinks={navLinks}
          selectedTeamId={selectedTeamId ?? null}
          onSelectTeam={onSelectTeam}
          showTeams={showTeams}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
