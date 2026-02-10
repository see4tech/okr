import type { Team } from '@/types/db'
import { ui } from '@/lib/i18n'

interface TeamSelectorProps {
  teams: Team[]
  selectedId: string | null
  onSelect: (teamId: string) => void
  label?: string
}

export function TeamSelector({ teams, selectedId, onSelect, label = ui.team }: TeamSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={selectedId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        <option value="">{ui.selectTeam}</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  )
}
