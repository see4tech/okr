import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { Layout } from '@/components/Layout'
import { TeamSelector } from '@/components/TeamSelector'
import { ItemTable } from '@/components/ItemTable'
import { ui, itemStatusLabel, formatDateTime } from '@/lib/i18n'
import { ITEM_STATUSES } from '@/types/enums'
import type { Team } from '@/types/db'
import type { ItemWithCounts } from '@/types/db'

function downloadCsv(items: ItemWithCounts[], openBlockers: Record<string, number>, openHelp: Record<string, number>) {
  const headers = [
    ui.csvHeaders.title,
    ui.csvHeaders.status,
    ui.csvHeaders.owner,
    ui.csvHeaders.openBlockers,
    ui.csvHeaders.openHelp,
    ui.csvHeaders.nextStep,
    ui.csvHeaders.targetDate,
    ui.csvHeaders.lastUpdate,
  ]
  const rows = items.map((i) => [
    i.title,
    i.status,
    i.owner_email ?? '',
    String(openBlockers[i.id] ?? 0),
    String(openHelp[i.id] ?? 0),
    i.next_step ?? '',
    i.target_date ?? '',
    i.last_update_at ?? '',
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `okr-ops-items-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function TeamBoard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const teamFromUrl = searchParams.get('team')
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teamFromUrl || null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [ownerFilter, _setOwnerFilter] = useState<string>('')
  const [targetFrom, setTargetFrom] = useState<string>('')
  const [targetTo, setTargetTo] = useState<string>('')
  const [objectiveFilter, setObjectiveFilter] = useState<string>('')
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('*').order('name')
      if (error) throw error
      return data as Team[]
    },
  })

  const { data: objectives = [] } = useQuery({
    queryKey: ['objectives', 'board', selectedTeamId],
    queryFn: async () => {
      let q = supabase.from('objectives').select('id, title, team_id')
      if (selectedTeamId) q = q.eq('team_id', selectedTeamId)
      const { data, error } = await q.order('title')
      if (error) throw error
      return (data ?? []) as { id: string; title: string; team_id: string }[]
    },
    enabled: true,
  })

  const { data: items = [], isLoading } = useQuery({
    queryKey: [
      'items',
      'board',
      selectedTeamId,
      statusFilter,
      ownerFilter,
      targetFrom,
      targetTo,
      objectiveFilter,
    ],
    queryFn: async () => {
      let q = supabase.from('items').select('*')
      if (selectedTeamId) q = q.eq('team_id', selectedTeamId)
      if (statusFilter) q = q.eq('status', statusFilter)
      if (ownerFilter) q = q.eq('owner_id', ownerFilter)
      if (targetFrom) q = q.gte('target_date', targetFrom)
      if (targetTo) q = q.lte('target_date', targetTo)
      if (objectiveFilter) q = q.eq('objective_id', objectiveFilter)
      const { data, error } = await q.order('last_update_at', { ascending: true, nullsFirst: true })
      if (error) throw error
      const list = (data ?? []) as ItemWithCounts[]
      const ownerIds = [...new Set(list.map((i) => i.owner_id).filter(Boolean))] as string[]
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', ownerIds)
        const emailMap = new Map((profiles ?? []).map((p: { id: string; email: string | null }) => [p.id, p.email]))
        list.forEach((i) => {
          if (i.owner_id) (i as ItemWithCounts).owner_email = emailMap.get(i.owner_id) ?? null
        })
      }
      return list
    },
    enabled: true,
  })

  const itemIds = useMemo(() => items.map((i) => i.id), [items])

  const { data: blockers = [] } = useQuery({
    queryKey: ['blockers', 'board', itemIds],
    queryFn: async () => {
      if (itemIds.length === 0) return []
      const { data, error } = await supabase
        .from('blockers')
        .select('item_id')
        .in('item_id', itemIds)
        .in('status', ['open', 'in_progress'])
      if (error) throw error
      return data ?? []
    },
    enabled: itemIds.length > 0,
  })

  const { data: helpRequests = [] } = useQuery({
    queryKey: ['help_requests', 'board', itemIds],
    queryFn: async () => {
      if (itemIds.length === 0) return []
      const { data, error } = await supabase
        .from('help_requests')
        .select('item_id')
        .in('item_id', itemIds)
        .in('status', ['open', 'in_progress'])
      if (error) throw error
      return data ?? []
    },
    enabled: itemIds.length > 0,
  })

  const openBlockersCount = useMemo(() => {
    const m: Record<string, number> = {}
    for (const b of blockers) {
      const id = (b as { item_id: string }).item_id
      m[id] = (m[id] ?? 0) + 1
    }
    return m
  }, [blockers])

  const openHelpCount = useMemo(() => {
    const m: Record<string, number> = {}
    for (const h of helpRequests) {
      const id = (h as { item_id: string }).item_id
      m[id] = (m[id] ?? 0) + 1
    }
    return m
  }, [helpRequests])

  const { data: expandedComments = [] } = useQuery({
    queryKey: ['comments', expandedItemId],
    queryFn: async () => {
      if (!expandedItemId) return []
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('item_id', expandedItemId)
        .order('created_at', { ascending: true })
      if (error) throw error
      const list = (data ?? []) as { id: string; author_id: string; body: string; created_at: string }[]
      const authorIds = [...new Set(list.map((c) => c.author_id))]
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', authorIds)
        const map = new Map((profiles ?? []).map((p: { id: string; email: string | null }) => [p.id, p.email]))
        list.forEach((c) => ((c as { author_email?: string }).author_email = map.get(c.author_id) ?? null))
      }
      return list
    },
    enabled: !!expandedItemId,
  })

  const { data: expandedUpdates = [] } = useQuery({
    queryKey: ['item_updates', expandedItemId],
    queryFn: async () => {
      if (!expandedItemId) return []
      const { data, error } = await supabase
        .from('item_updates')
        .select('*')
        .eq('item_id', expandedItemId)
        .order('created_at', { ascending: true })
      if (error) throw error
      const list = (data ?? []) as { id: string; updated_by: string; snapshot: unknown; created_at: string }[]
      const authorIds = [...new Set(list.map((u) => u.updated_by))]
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', authorIds)
        const map = new Map((profiles ?? []).map((p: { id: string; email: string | null }) => [p.id, p.email]))
        list.forEach((u) => ((u as { author_email?: string }).author_email = map.get(u.updated_by) ?? null))
      }
      return list
    },
    enabled: !!expandedItemId,
  })

  const expandedActivity = useMemo(() => {
    if (!expandedItemId) return []
    type Entry = { type: 'comment'; id: string; at: string; author: string; body: string } | { type: 'update'; id: string; at: string; author: string; snapshot: Record<string, unknown> }
    const entries: Entry[] = [
      ...expandedComments.map((c) => ({
        type: 'comment' as const,
        id: c.id,
        at: c.created_at,
        author: (c as { author_email?: string }).author_email ?? ui.unknown,
        body: c.body,
      })),
      ...expandedUpdates.map((u) => ({
        type: 'update' as const,
        id: u.id,
        at: u.created_at,
        author: (u as { author_email?: string }).author_email ?? ui.unknown,
        snapshot: (u.snapshot as Record<string, unknown>) ?? {},
      })),
    ]
    entries.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    return entries
  }, [expandedItemId, expandedComments, expandedUpdates])

  const handleExportCsv = () => {
    downloadCsv(items, openBlockersCount, openHelpCount)
  }

  const handleTeamSelect = (id: string) => {
    setSelectedTeamId(id || null)
    setSearchParams(id ? { team: id } : {})
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">{ui.teamBoard}</h1>
        <div className="mb-4 flex flex-wrap gap-4 items-end">
          <TeamSelector
            teams={teams}
            selectedId={selectedTeamId}
            onSelect={handleTeamSelect}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{ui.objective}</label>
            <select
              value={objectiveFilter}
              onChange={(e) => setObjectiveFilter(e.target.value)}
              className="rounded-md border border-gray-300 py-2 px-3 text-sm"
            >
              <option value="">{ui.all}</option>
              {objectives.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{ui.targetFrom}</label>
            <input
              type="date"
              value={targetFrom}
              onChange={(e) => setTargetFrom(e.target.value)}
              className="rounded-md border border-gray-300 py-2 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{ui.targetTo}</label>
            <input
              type="date"
              value={targetTo}
              onChange={(e) => setTargetTo(e.target.value)}
              className="rounded-md border border-gray-300 py-2 px-3 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 hover:bg-gray-50"
          >
            {ui.exportCsv}
          </button>
        </div>
        <div className="mb-2 flex justify-end">
          <a
            href={selectedTeamId ? `/item/new?team=${selectedTeamId}` : '/item/new'}
            className="rounded-md bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700"
          >
            {ui.createItem}
          </a>
        </div>
        {isLoading ? (
          <p className="text-gray-500">{ui.loading}</p>
        ) : (
          <ItemTable
            items={items}
            openBlockersCount={openBlockersCount}
            openHelpCount={openHelpCount}
            expandedItemId={expandedItemId}
            onToggleExpand={(id) => setExpandedItemId((prev) => (prev === id ? null : id))}
            expandedActivity={expandedActivity}
            formatDateTime={formatDateTime}
          />
        )}
      </div>
    </Layout>
  )
}
