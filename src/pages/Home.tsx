import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Layout } from '@/components/Layout'
import { ui } from '@/lib/i18n'
import type { Team } from '@/types/db'
import type { ItemWithCounts } from '@/types/db'

const fourteenDaysAgo = () => {
  const d = new Date()
  d.setDate(d.getDate() - 14)
  return d.toISOString()
}

const inDays = (n: number) => {
  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + n)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export function Home() {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('*').order('name')
      if (error) throw error
      return data as Team[]
    },
  })

  const teamIds = useMemo(() => (selectedTeamId ? [selectedTeamId] : []), [selectedTeamId])

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items', 'home', selectedTeamId],
    queryFn: async () => {
      let q = supabase.from('items').select('*')
      if (selectedTeamId) q = q.eq('team_id', selectedTeamId)
      const { data, error } = await q.order('last_update_at', { ascending: true, nullsFirst: true })
      if (error) throw error
      return data as ItemWithCounts[]
    },
    enabled: true,
  })

  const { data: blockers = [] } = useQuery({
    queryKey: ['blockers', 'open', selectedTeamId],
    queryFn: async () => {
      const { data: items } = await supabase
        .from('items')
        .select('id')
        .in('team_id', teamIds.length ? teamIds : (teams.map((t) => t.id) as string[]))
      const ids = (items ?? []).map((i) => i.id)
      if (ids.length === 0) return []
      const { data, error } = await supabase
        .from('blockers')
        .select('*, items!inner(team_id)')
        .in('item_id', ids)
        .in('status', ['open', 'in_progress'])
      if (error) throw error
      return data ?? []
    },
    enabled: teams.length > 0,
  })

  const { data: helpRequests = [] } = useQuery({
    queryKey: ['help_requests', 'open', selectedTeamId],
    queryFn: async () => {
      const { data: items } = await supabase
        .from('items')
        .select('id')
        .in('team_id', teamIds.length ? teamIds : (teams.map((t) => t.id) as string[]))
      const ids = (items ?? []).map((i) => i.id)
      if (ids.length === 0) return []
      const { data, error } = await supabase
        .from('help_requests')
        .select('*')
        .in('item_id', ids)
        .in('status', ['open', 'in_progress'])
      if (error) throw error
      return data ?? []
    },
    enabled: teams.length > 0,
  })

  const cutoff = fourteenDaysAgo()
  const itemsWithoutRecentUpdate = items.filter(
    (i) => !i.last_update_at || i.last_update_at < cutoff
  )
  const openBlockers = blockers
  const openHelp = helpRequests
  const { start: rangeStart, end: rangeEnd } = inDays(30)
  const upcomingTargets = items.filter(
    (i) => i.target_date && i.target_date >= rangeStart && i.target_date <= rangeEnd
  )

  const selectedTeamName = selectedTeamId
    ? teams.find((t) => t.id === selectedTeamId)?.name
    : null

  return (
    <Layout
      selectedTeamId={selectedTeamId}
      onSelectTeam={setSelectedTeamId}
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedTeamName ?? ui.home}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {selectedTeamId ? ui.teamBoard : 'Resumen de todos los equipos'}
          </p>
        </div>

        {itemsLoading ? (
          <p className="text-gray-500">{ui.loading}</p>
        ) : (
          <>
            {/* Stats row - Convey style */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center divide-x divide-gray-200">
                <StatItem value={items.length} label="Items activos" />
                <StatItem value={itemsWithoutRecentUpdate.length} label={ui.itemsWithoutUpdate14} highlight />
                <StatItem value={openBlockers.length} label={ui.openBlockers} highlight={openBlockers.length > 0} />
                <StatItem value={upcomingTargets.length} label={ui.targetDatesNext30} />
              </div>
            </div>

            {/* Quick cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title={ui.itemsWithoutUpdate14}
                count={itemsWithoutRecentUpdate.length}
                to="/board"
                query={selectedTeamId ? `?team=${selectedTeamId}` : ''}
                color="amber"
              />
              <StatCard
                title={ui.openBlockers}
                count={openBlockers.length}
                to="/board"
                query={selectedTeamId ? `?team=${selectedTeamId}` : ''}
                color="red"
              />
              <StatCard
                title={ui.openHelp}
                count={openHelp.length}
                to="/board"
                query={selectedTeamId ? `?team=${selectedTeamId}` : ''}
                color="brand"
              />
              <StatCard
                title={ui.targetDatesNext30}
                count={upcomingTargets.length}
                to="/board"
                query={selectedTeamId ? `?team=${selectedTeamId}` : ''}
                color="emerald"
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

function StatItem({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div className="flex-1 px-6 first:pl-0 last:pr-0 text-center">
      <p className={`text-3xl font-bold ${highlight ? 'text-amber-600' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{label}</p>
    </div>
  )
}

const colorMap: Record<string, string> = {
  amber: 'border-l-amber-400 bg-amber-50',
  red: 'border-l-red-400 bg-red-50',
  brand: 'border-l-brand-400 bg-brand-50',
  emerald: 'border-l-emerald-400 bg-emerald-50',
}
const countColorMap: Record<string, string> = {
  amber: 'text-amber-700',
  red: 'text-red-700',
  brand: 'text-brand-700',
  emerald: 'text-emerald-700',
}

function StatCard({
  title,
  count,
  to,
  query,
  color,
}: {
  title: string
  count: number
  to: string
  query: string
  color: string
}) {
  return (
    <Link
      to={`${to}${query}`}
      className={`block rounded-lg border border-gray-200 border-l-4 p-4 shadow-sm hover:shadow-md transition-shadow ${colorMap[color] ?? ''}`}
    >
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${countColorMap[color] ?? 'text-gray-900'}`}>{count}</p>
    </Link>
  )
}
