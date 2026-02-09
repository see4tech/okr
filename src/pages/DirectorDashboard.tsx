import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { Layout } from '@/components/Layout'
import { TeamSelector } from '@/components/TeamSelector'
import { ui, itemStatusLabel, blockerSeverityLabel, helpRequestTypeLabel } from '@/lib/i18n'
import { ITEM_STATUSES } from '@/types/enums'
import type { Team } from '@/types/db'
import type { Item } from '@/types/db'
import type { Blocker } from '@/types/db'
import type { HelpRequest } from '@/types/db'

export function DirectorDashboard() {
  const [teamFilter, setTeamFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      return data as { role: string } | null
    },
  })

  const isAdmin = profile?.role === 'admin'

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('*').order('name')
      if (error) throw error
      return data as Team[]
    },
  })

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items', 'director', teamFilter, statusFilter],
    queryFn: async () => {
      let q = supabase.from('items').select('*, teams(name)')
      if (teamFilter) q = q.eq('team_id', teamFilter)
      if (statusFilter) q = q.eq('status', statusFilter)
      const { data, error } = await q.order('last_update_at', { ascending: true, nullsFirst: true })
      if (error) throw error
      return (data ?? []) as (Item & { teams?: { name: string } })[]
    },
    enabled: isAdmin,
  })

  const itemIds = useMemo(() => items.map((i) => i.id), [items])

  const { data: blockers = [] } = useQuery({
    queryKey: ['blockers', 'director', itemIds],
    queryFn: async () => {
      if (itemIds.length === 0) return []
      const { data, error } = await supabase
        .from('blockers')
        .select('*')
        .in('item_id', itemIds)
        .in('status', ['open', 'in_progress'])
      if (error) throw error
      return (data ?? []) as Blocker[]
    },
    enabled: isAdmin && itemIds.length > 0,
  })

  const { data: helpRequests = [] } = useQuery({
    queryKey: ['help_requests', 'director', itemIds],
    queryFn: async () => {
      if (itemIds.length === 0) return []
      const { data, error } = await supabase
        .from('help_requests')
        .select('*')
        .in('item_id', itemIds)
        .in('status', ['open', 'in_progress'])
      if (error) throw error
      return (data ?? []) as HelpRequest[]
    },
    enabled: isAdmin && itemIds.length > 0,
  })

  const itemToTeamName = useMemo(() => {
    const m = new Map<string, string>()
    for (const i of items) {
      const name = (i as Item & { teams?: { name: string } }).teams?.name ?? ui.unknown
      m.set(i.id, name)
    }
    return m
  }, [items])

  const pausedOrAtRisk = useMemo(
    () => items.filter((i) => i.status === 'paused' || i.status === 'at_risk'),
    [items]
  )

  const openBlockersBySeverity = useMemo(() => {
    const m: Record<string, number> = {}
    for (const b of blockers) {
      m[b.severity] = (m[b.severity] ?? 0) + 1
    }
    return m
  }, [blockers])

  const openBlockersByTeam = useMemo(() => {
    const m: Record<string, number> = {}
    for (const b of blockers) {
      const name = itemToTeamName.get(b.item_id) ?? ui.unknown
      m[name] = (m[name] ?? 0) + 1
    }
    return m
  }, [blockers, itemToTeamName])

  const openHelpByType = useMemo(() => {
    const m: Record<string, number> = {}
    for (const h of helpRequests) {
      m[h.type] = (m[h.type] ?? 0) + 1
    }
    return m
  }, [helpRequests])

  const openHelpByTeam = useMemo(() => {
    const m: Record<string, number> = {}
    for (const h of helpRequests) {
      const name = itemToTeamName.get(h.item_id) ?? ui.unknown
      m[name] = (m[name] ?? 0) + 1
    }
    return m
  }, [helpRequests, itemToTeamName])

  const today = new Date().toISOString().slice(0, 10)
  const in30 = new Date()
  in30.setDate(in30.getDate() + 30)
  const in60 = new Date()
  in60.setDate(in60.getDate() + 60)
  const in90 = new Date()
  in90.setDate(in90.getDate() + 90)
  const targets30 = items.filter(
    (i) => i.target_date && i.target_date >= today && i.target_date <= in30.toISOString().slice(0, 10)
  )
  const targets60 = items.filter(
    (i) =>
      i.target_date &&
      i.target_date > in30.toISOString().slice(0, 10) &&
      i.target_date <= in60.toISOString().slice(0, 10)
  )
  const targets90 = items.filter(
    (i) =>
      i.target_date &&
      i.target_date > in60.toISOString().slice(0, 10) &&
      i.target_date <= in90.toISOString().slice(0, 10)
  )

  if (profileLoading) {
    return (
      <Layout>
        <p className="text-gray-500">{ui.loading}</p>
      </Layout>
    )
  }

  if (!isAdmin) {
    return (
      <Layout>
        <p className="text-red-600">{ui.accessDeniedDirector}</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">{ui.directorDashboard}</h1>
        <div className="mb-6 flex flex-wrap gap-4 items-end">
          <TeamSelector
            teams={teams}
            selectedId={teamFilter}
            onSelect={(id) => setTeamFilter(id || null)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{ui.status}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 py-2 px-3 text-sm"
            >
              <option value="">{ui.all}</option>
              {ITEM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {itemStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {itemsLoading ? (
          <p className="text-gray-500">{ui.loading}</p>
        ) : (
          <div className="space-y-8">
            <Section title={ui.itemsPausedOrAtRisk}>
              {pausedOrAtRisk.length === 0 ? (
                <p className="text-sm text-gray-500">{ui.none}</p>
              ) : (
                <ul className="space-y-1">
                  {pausedOrAtRisk.map((i) => (
                    <li key={i.id}>
                      <Link to={`/item/${i.id}`} className="text-blue-600 hover:underline">
                        {(i as Item & { teams?: { name: string } }).teams?.name}: {i.title}
                      </Link>
                      <span className="text-gray-500 text-sm ml-2">({itemStatusLabel(i.status)})</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title={ui.openBlockersBySeverity}>
              <ul className="flex flex-wrap gap-4">
                {['critical', 'high', 'medium', 'low'].map((sev) => (
                  <li key={sev} className="rounded bg-gray-100 px-3 py-1 text-sm">
                    {blockerSeverityLabel(sev)}: {openBlockersBySeverity[sev] ?? 0}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title={ui.openBlockersByTeam}>
              <ul className="flex flex-wrap gap-4">
                {Object.entries(openBlockersByTeam).map(([name, count]) => (
                  <li key={name} className="rounded bg-gray-100 px-3 py-1 text-sm">
                    {name}: {count}
                  </li>
                ))}
                {Object.keys(openBlockersByTeam).length === 0 && (
                  <li className="text-sm text-gray-500">{ui.none}</li>
                )}
              </ul>
            </Section>

            <Section title={ui.openHelpByType}>
              <ul className="flex flex-wrap gap-4">
                {Object.entries(openHelpByType).map(([type, count]) => (
                  <li key={type} className="rounded bg-gray-100 px-3 py-1 text-sm">
                    {helpRequestTypeLabel(type)}: {count}
                  </li>
                ))}
                {Object.keys(openHelpByType).length === 0 && (
                  <li className="text-sm text-gray-500">{ui.none}</li>
                )}
              </ul>
            </Section>

            <Section title={ui.openHelpByTeam}>
              <ul className="flex flex-wrap gap-4">
                {Object.entries(openHelpByTeam).map(([name, count]) => (
                  <li key={name} className="rounded bg-gray-100 px-3 py-1 text-sm">
                    {name}: {count}
                  </li>
                ))}
                {Object.keys(openHelpByTeam).length === 0 && (
                  <li className="text-sm text-gray-500">{ui.none}</li>
                )}
              </ul>
            </Section>

            <Section title={ui.upcomingTargets}>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">{ui.next30Days}</h4>
                  <ul className="space-y-1 text-sm">
                    {targets30.map((i) => (
                      <li key={i.id}>
                        <Link to={`/item/${i.id}`} className="text-blue-600 hover:underline">
                          {i.title}
                        </Link>
                        <span className="text-gray-500 ml-1">{i.target_date}</span>
                      </li>
                    ))}
                    {targets30.length === 0 && <li className="text-gray-500">{ui.none}</li>}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">{ui.days31to60}</h4>
                  <ul className="space-y-1 text-sm">
                    {targets60.map((i) => (
                      <li key={i.id}>
                        <Link to={`/item/${i.id}`} className="text-blue-600 hover:underline">
                          {i.title}
                        </Link>
                        <span className="text-gray-500 ml-1">{i.target_date}</span>
                      </li>
                    ))}
                    {targets60.length === 0 && <li className="text-gray-500">{ui.none}</li>}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">{ui.days61to90}</h4>
                  <ul className="space-y-1 text-sm">
                    {targets90.map((i) => (
                      <li key={i.id}>
                        <Link to={`/item/${i.id}`} className="text-blue-600 hover:underline">
                          {i.title}
                        </Link>
                        <span className="text-gray-500 ml-1">{i.target_date}</span>
                      </li>
                    ))}
                    {targets90.length === 0 && <li className="text-gray-500">{ui.none}</li>}
                  </ul>
                </div>
              </div>
            </Section>
          </div>
        )}
      </div>
    </Layout>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-medium text-gray-900 mb-2">{title}</h2>
      {children}
    </section>
  )
}
