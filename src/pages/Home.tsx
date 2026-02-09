import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Layout } from '@/components/Layout'
import { TeamSelector } from '@/components/TeamSelector'
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Home</h1>
        <div className="mb-6">
          <TeamSelector
            teams={teams}
            selectedId={selectedTeamId}
            onSelect={(id) => setSelectedTeamId(id || null)}
          />
        </div>

        {itemsLoading ? (
          <p className="text-gray-500">Loading…</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card
              title="Items without update (14 days)"
              count={itemsWithoutRecentUpdate.length}
              to="/board"
              query={selectedTeamId ? `?team=${selectedTeamId}` : ''}
            />
            <Card
              title="Open blockers"
              count={openBlockers.length}
              to="/board"
              query={selectedTeamId ? `?team=${selectedTeamId}` : ''}
            />
            <Card
              title="Open help requests"
              count={openHelp.length}
              to="/board"
              query={selectedTeamId ? `?team=${selectedTeamId}` : ''}
            />
            <Card
              title="Target dates (next 30 days)"
              count={upcomingTargets.length}
              to="/board"
              query={selectedTeamId ? `?team=${selectedTeamId}` : ''}
            />
          </div>
        )}
      </div>
    </Layout>
  )
}

function Card({
  title,
  count,
  to,
  query,
}: {
  title: string
  count: number
  to: string
  query: string
}) {
  return (
    <Link
      to={`${to}${query}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300"
    >
      <h2 className="font-medium text-gray-900">{title}</h2>
      <p className="mt-1 text-2xl font-semibold text-gray-700">{count}</p>
    </Link>
  )
}
