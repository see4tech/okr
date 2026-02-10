import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { ui } from '@/lib/i18n'
import type { Team } from '@/types/db'

interface SidebarProps {
  selectedTeamId: string | null
  onSelectTeam: (teamId: string | null) => void
}

export function Sidebar({ selectedTeamId, onSelectTeam }: SidebarProps) {

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('*').order('name')
      if (error) throw error
      return data as Team[]
    },
  })

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 hidden md:flex flex-col">
      <div className="px-4 pt-5 pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {ui.team}s ({teams.length})
        </h2>
      </div>
      <nav className="flex-1 overflow-y-auto sidebar-scroll px-2 pb-4">
        <button
          type="button"
          onClick={() => onSelectTeam(null)}
          className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium mb-0.5 ${
            selectedTeamId === null
              ? 'bg-brand-50 text-brand-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 text-gray-600 text-xs">
            ★
          </span>
          {ui.all}
        </button>
        {teams.map((team) => (
          <button
            key={team.id}
            type="button"
            onClick={() => onSelectTeam(team.id)}
            className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm mb-0.5 ${
              selectedTeamId === team.id
                ? 'bg-brand-50 text-brand-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold text-white ${
              selectedTeamId === team.id ? 'bg-brand-600' : 'bg-gray-400'
            }`}>
              {team.name.charAt(0).toUpperCase()}
            </span>
            <span className="truncate">{team.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
