import { useState, useEffect, type ReactNode } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { Layout } from '@/components/Layout'
import { ItemForm, type ItemUpdateFormValues } from '@/components/ItemForm'
import { BlockersPanel } from '@/components/BlockersPanel'
import { HelpRequestsPanel } from '@/components/HelpRequestsPanel'
import { UpdatesTimeline } from '@/components/UpdatesTimeline'
import { CommentsPanel } from '@/components/CommentsPanel'
import { ui, itemStatusLabel, formatDateTime } from '@/lib/i18n'
import type { Item } from '@/types/db'
import type { Blocker } from '@/types/db'
import type { HelpRequest } from '@/types/db'
import type { Comment } from '@/types/db'
import type { ItemUpdateWithAuthor } from '@/types/db'

type TabId = 'form' | 'blockers' | 'help' | 'comments' | 'timeline' | 'activity'

const TAB_IDS: TabId[] = ['form', 'activity', 'blockers', 'help', 'comments', 'timeline']

export function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const tabFromUrl = searchParams.get('tab') as TabId | null
  const [tab, setTab] = useState<TabId>(TAB_IDS.includes(tabFromUrl ?? '') ? tabFromUrl! : 'form')

  useEffect(() => {
    if (tabFromUrl && TAB_IDS.includes(tabFromUrl)) setTab(tabFromUrl)
  }, [tabFromUrl])

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

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const { data, error: e } = await supabase.from('items').select('*').eq('id', id!).single()
      if (e) throw e
      return data as Item
    },
    enabled: id !== undefined && id !== 'new',
  })

  const { data: teamMember } = useQuery({
    queryKey: ['team_member', item?.team_id, userId],
    queryFn: async () => {
      if (!item?.team_id || !userId) return null
      const { data } = await supabase
        .from('team_members')
        .select('member_role')
        .eq('team_id', item.team_id)
        .eq('user_id', userId)
        .single()
      return data as { member_role: string } | null
    },
    enabled: !!item?.team_id && !!userId,
  })

  const isAdmin = profile?.role === 'admin'
  const isManager = teamMember?.member_role === 'manager'
  const isMember = teamMember?.member_role === 'member' || teamMember?.member_role === 'manager'
  const isOwner = item?.owner_id === userId
  const canEdit = isAdmin || isManager || (isMember && isOwner)

  const { data: blockers = [] } = useQuery({
    queryKey: ['blockers', id],
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('blockers')
        .select('*')
        .eq('item_id', id!)
        .order('created_at', { ascending: false })
      if (e) throw e
      return data as Blocker[]
    },
    enabled: !!id && id !== 'new',
  })

  const { data: helpRequests = [] } = useQuery({
    queryKey: ['help_requests', id],
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('help_requests')
        .select('*')
        .eq('item_id', id!)
        .order('created_at', { ascending: false })
      if (e) throw e
      return data as HelpRequest[]
    },
    enabled: !!id && id !== 'new',
  })

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('comments')
        .select('*')
        .eq('item_id', id!)
        .order('created_at', { ascending: true })
      if (e) throw e
      const list = data as (Comment & { author_email?: string | null })[]
      const authorIds = [...new Set(list.map((c) => c.author_id))]
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', authorIds)
        const map = new Map((profiles ?? []).map((p: { id: string; email: string | null }) => [p.id, p.email]))
        list.forEach((c) => { c.author_email = map.get(c.author_id) ?? null })
      }
      return list
    },
    enabled: !!id && id !== 'new',
  })

  const { data: updates = [] } = useQuery({
    queryKey: ['item_updates', id],
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('item_updates')
        .select('*')
        .eq('item_id', id!)
        .order('created_at', { ascending: true })
      if (e) throw e
      const list = (data ?? []) as ItemUpdateWithAuthor[]
      const authorIds = [...new Set(list.map((u) => u.updated_by))]
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', authorIds)
        const map = new Map((profiles ?? []).map((p: { id: string; email: string | null }) => [p.id, p.email]))
        list.forEach((u) => { (u as ItemUpdateWithAuthor).author_email = map.get(u.updated_by) ?? null })
      }
      return list
    },
    enabled: !!id && id !== 'new',
  })

  const saveUpdateMutation = useMutation({
    mutationFn: async (values: ItemUpdateFormValues) => {
      if (!id || id === 'new' || !item) throw new Error(ui.noItem)
      const snapshot = {
        status: values.status,
        status_reason: values.status_reason ?? null,
        blockers_summary: values.blockers_summary ?? null,
        help_needed_summary: values.help_needed_summary ?? null,
        next_step: values.next_step ?? null,
        target_date: values.target_date || null,
      }
      const { error: insertErr } = await supabase.from('item_updates').insert({
        item_id: id,
        updated_by: userId,
        snapshot,
      })
      if (insertErr) throw insertErr
      const { error: updateErr } = await supabase
        .from('items')
        .update({
          status: snapshot.status,
          status_reason: snapshot.status_reason,
          blockers_summary: snapshot.blockers_summary,
          help_needed_summary: snapshot.help_needed_summary,
          next_step: snapshot.next_step,
          target_date: snapshot.target_date,
        })
        .eq('id', id)
      if (updateErr) throw updateErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', id] })
      queryClient.invalidateQueries({ queryKey: ['item_updates', id] })
    },
  })

  if (id === 'new') {
    return (
      <Layout>
        <ItemNewPage />
      </Layout>
    )
  }

  if (error || !item) {
    return (
      <Layout>
        <p className="text-red-600">{error ? String(error) : ui.itemNotFound}</p>
        <button type="button" onClick={() => navigate('/board')} className="mt-2 text-blue-600 hover:underline">
          {ui.backToBoard}
        </button>
      </Layout>
    )
  }

  if (isLoading) {
    return (
      <Layout>
        <p className="text-gray-500">{ui.loading}</p>
      </Layout>
    )
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'form', label: ui.edit },
    { id: 'activity', label: ui.activity },
    { id: 'blockers', label: ui.blockers },
    { id: 'help', label: ui.helpRequests },
    { id: 'comments', label: ui.comments },
    { id: 'timeline', label: ui.updates },
  ]

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate('/board')}
            className="text-sm text-gray-600 hover:underline"
          >
            {ui.backToBoard}
          </button>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{item.title}</h1>
        <p className="text-sm text-gray-500 mb-4">
          {ui.status}: {itemStatusLabel(item.status)}
          {item.target_date && ` · ${ui.target}: ${new Date(item.target_date).toLocaleDateString('es')}`}
        </p>

        <div className="flex gap-2 border-b border-gray-200 mb-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'form' && (
          <ItemForm
            item={item}
            onSubmit={(values) => saveUpdateMutation.mutateAsync(values)}
            disabled={!canEdit}
          />
        )}
        {tab === 'activity' && (
          <ActivityList
            comments={comments}
            updates={updates}
            itemStatusLabel={itemStatusLabel}
          />
        )}
        {tab === 'blockers' && (
          <BlockersPanel itemId={item.id} blockers={blockers} canEdit={canEdit || isMember} />
        )}
        {tab === 'help' && (
          <HelpRequestsPanel
            itemId={item.id}
            helpRequests={helpRequests}
            canEdit={canEdit || isMember}
            userId={userId}
          />
        )}
        {tab === 'comments' && (
          <CommentsPanel
            itemId={item.id}
            comments={comments}
            canEdit={!!isMember || isAdmin}
            userId={userId}
          />
        )}
        {tab === 'timeline' && <UpdatesTimeline updates={updates} />}
      </div>
    </Layout>
  )
}

type CommentWithEmail = Comment & { author_email?: string | null }

function ActivityList({
  comments,
  updates,
  itemStatusLabel: statusLabel,
}: {
  comments: CommentWithEmail[]
  updates: ItemUpdateWithAuthor[]
  itemStatusLabel: (key: string) => string
}) {
  type ActivityEntry =
    | { type: 'comment'; id: string; at: string; author: string; body: string }
    | { type: 'update'; id: string; at: string; author: string; snapshot: Record<string, unknown> }
  const entries: ActivityEntry[] = [
    ...comments.map((c) => ({
      type: 'comment' as const,
      id: c.id,
      at: c.created_at,
      author: c.author_email ?? ui.unknown,
      body: c.body,
    })),
    ...updates.map((u) => ({
      type: 'update' as const,
      id: u.id,
      at: u.created_at,
      author: (u as ItemUpdateWithAuthor).author_email ?? ui.unknown,
      snapshot: (u.snapshot as Record<string, unknown>) ?? {},
    })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        {ui.noComments}
        <br />
        {ui.noUpdatesYet}
      </p>
    )
  }

  return (
    <ul className="space-y-3 list-none pl-0">
      {entries.map((e) => (
        <li key={`${e.type}-${e.id}`} className="border-l-2 border-gray-200 pl-4 py-2">
          <p className="text-xs text-gray-500">
            {e.type === 'comment' ? ui.activityComment : ui.activityUpdate} · {e.author} · {formatDateTime(e.at)}
          </p>
          {e.type === 'comment' ? (
            <p className="mt-1 text-sm text-gray-800">{e.body}</p>
          ) : (
            <ul className="mt-1 text-sm text-gray-700 space-y-0.5 list-disc list-inside">
              {(() => {
                const s = e.snapshot as Record<string, string | null | undefined>
                const items: ReactNode[] = []
                if (s.status != null && s.status !== '') items.push(<li key="status">{ui.status}: {statusLabel(s.status)}</li>)
                if (s.next_step != null && s.next_step !== '') items.push(<li key="next_step">{ui.nextStep}: {s.next_step}</li>)
                if (s.target_date != null && s.target_date !== '') items.push(<li key="target_date">{ui.targetDate}: {s.target_date}</li>)
                if (s.status_reason != null && s.status_reason !== '') items.push(<li key="status_reason">{ui.statusReason}: {s.status_reason}</li>)
                if (s.blockers_summary != null && s.blockers_summary !== '') items.push(<li key="blockers_summary">{ui.blockersSummary}: {s.blockers_summary}</li>)
                if (s.help_needed_summary != null && s.help_needed_summary !== '') items.push(<li key="help_needed_summary">{ui.helpNeededSummary}: {s.help_needed_summary}</li>)
                return items
              })()}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

function ItemNewPage() {
  const [searchParams] = useSearchParams()
  const teamParam = searchParams.get('team')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [teamId, setTeamId] = useState<string | null>(teamParam || null)
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session: s } } = await supabase.auth.getSession()
      return s
    },
  })
  const userId = session?.user?.id ?? null

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error: e } = await supabase.from('teams').select('*').order('name')
      if (e) throw e
      return data as { id: string; name: string }[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!teamId || !title.trim()) throw new Error(ui.teamAndTitleRequired)
      const { data, error: e } = await supabase
        .from('items')
        .insert({
          team_id: teamId,
          title: title.trim(),
          status: 'discovery',
          owner_id: userId,
        })
        .select('id')
        .single()
      if (e) {
        const isPermissionDenied =
          e.code === '42501' ||
          (e.message && /row-level security|policy|permission|403/i.test(e.message))
        throw new Error(isPermissionDenied ? ui.createItemPermissionDenied : e.message)
      }
      return data as { id: string }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      navigate(`/item/${data.id}`)
    },
    onError: (err) => setError(err instanceof Error ? err.message : ui.failed),
  })

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">{ui.createItem}</h1>
      <p className="text-sm text-gray-600 mb-4">{ui.createItemHint}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          createMutation.mutate()
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{ui.team}</label>
          <select
            value={teamId ?? ''}
            onChange={(e) => setTeamId(e.target.value || null)}
            required
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
          >
            <option value="">{ui.selectTeam}</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{ui.title}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded-md bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {createMutation.isPending ? ui.creating : ui.create}
        </button>
      </form>
    </div>
  )
}

