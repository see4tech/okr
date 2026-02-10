import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { ui } from '@/lib/i18n'
import type { Team } from '@/types/db'

interface NavLink {
  to: string
  label: string
  icon: React.ReactNode
}

interface SidebarProps {
  navLinks: NavLink[]
  selectedTeamId?: string | null
  onSelectTeam?: (teamId: string | null) => void
  userId: string
  isAdmin: boolean
}

const navIcons: Record<string, React.ReactNode> = {
  '/': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  '/board': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125M12 15.375c0-.621-.504-1.125-1.125-1.125" />
    </svg>
  ),
  '/director': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  '/admin/teams': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
}

export function Sidebar({ navLinks, selectedTeamId, onSelectTeam, userId, isAdmin }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  // Admins see all teams; regular users only see teams they belong to
  const { data: allTeams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('*').order('name')
      if (error) throw error
      return data as Team[]
    },
  })

  const { data: memberTeamIds = [] } = useQuery({
    queryKey: ['my_team_ids', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
      if (error) throw error
      return (data ?? []).map((r: { team_id: string }) => r.team_id)
    },
    enabled: !!userId && !isAdmin,
  })

  const teams = useMemo(() => {
    if (isAdmin) return allTeams
    const idSet = new Set(memberTeamIds)
    return allTeams.filter((t) => idSet.has(t.id))
  }, [isAdmin, allTeams, memberTeamIds])

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  function handleTeamClick(teamId: string | null) {
    if (onSelectTeam) {
      onSelectTeam(teamId)
    } else {
      navigate(teamId ? `/board?team=${teamId}` : '/board')
    }
  }

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 hidden md:flex flex-col">
      {/* Navigation links */}
      <nav className="px-3 pt-4 pb-2 space-y-0.5">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(link.to)
                ? 'bg-brand-50 text-brand-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className={isActive(link.to) ? 'text-brand-600' : 'text-gray-400'}>
              {navIcons[link.to] ?? link.icon}
            </span>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Teams section */}
      <div className="mx-3 my-2 border-t border-gray-200" />
      <div className="px-4 pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {ui.team}s ({teams.length})
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto sidebar-scroll px-2 pb-4">
        <button
          type="button"
          onClick={() => handleTeamClick(null)}
          className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium mb-0.5 ${
            selectedTeamId === null
              ? 'bg-brand-50 text-brand-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="w-6 h-6 shrink-0 flex items-center justify-center rounded bg-gray-200 text-gray-600 text-xs">
            ★
          </span>
          {ui.all}
        </button>
        {teams.map((team) => (
          <button
            key={team.id}
            type="button"
            onClick={() => handleTeamClick(team.id)}
            className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm mb-0.5 ${
              selectedTeamId === team.id
                ? 'bg-brand-50 text-brand-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {team.icon?.startsWith('data:') ? (
              <img src={team.icon} alt="" className="w-6 h-6 shrink-0 rounded object-cover" />
            ) : team.icon ? (
              <span className="w-6 h-6 shrink-0 flex items-center justify-center rounded text-sm">
                {team.icon}
              </span>
            ) : (
              <span className={`w-6 h-6 shrink-0 flex items-center justify-center rounded text-xs font-bold text-white ${
                selectedTeamId === team.id ? 'bg-brand-600' : 'bg-gray-400'
              }`}>
                {team.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate">{team.name}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
