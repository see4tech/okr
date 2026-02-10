import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { ui, formatDate, blockerSeverityLabel, blockerStatusLabel } from '@/lib/i18n'
import { BLOCKER_SEVERITIES, BLOCKER_STATUSES } from '@/types/enums'
import type { Blocker } from '@/types/db'

export function BlockersPanel({
  itemId,
  blockers,
  canEdit,
}: {
  itemId: string
  blockers: Blocker[]
  canEdit: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (payload: {
      title: string
      detail?: string
      severity: string
      status?: string
      eta?: string
    }) => {
      const { data, error } = await supabase
        .from('blockers')
        .insert({
          item_id: itemId,
          title: payload.title,
          detail: payload.detail || null,
          severity: payload.severity,
          status: payload.status ?? 'open',
          eta: payload.eta || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockers', itemId] })
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      setShowForm(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      title,
      detail,
      severity,
      eta,
    }: {
      id: string
      status?: string
      title?: string
      detail?: string
      severity?: string
      eta?: string
    }) => {
      const updates: Record<string, unknown> = {}
      if (status !== undefined) updates.status = status
      if (title !== undefined) updates.title = title
      if (detail !== undefined) updates.detail = detail
      if (severity !== undefined) updates.severity = severity
      if (eta !== undefined) updates.eta = eta || null
      const { data, error } = await supabase
        .from('blockers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockers', itemId] })
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blockers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockers', itemId] })
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{ui.blockers}</h3>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="text-sm font-medium text-brand-600 hover:text-brand-800"
          >
            {showForm ? ui.cancel : `+ ${ui.addBlocker}`}
          </button>
        )}
      </div>
      {showForm && canEdit && (
        <BlockerForm
          onSubmit={(v) => createMutation.mutateAsync(v)}
          onCancel={() => setShowForm(false)}
          isSubmitting={createMutation.isPending}
        />
      )}
      <ul className="space-y-2 mt-2">
        {blockers.map((b) => {
          const severityBorder: Record<string, string> = { critical: 'border-l-red-500', high: 'border-l-orange-400', medium: 'border-l-amber-400', low: 'border-l-gray-300' }
          return (
          <li
            key={b.id}
            className={`rounded-lg border border-gray-200 border-l-4 ${severityBorder[b.severity] ?? 'border-l-gray-300'} p-3 bg-white text-sm shadow-sm`}
          >
            <div className="flex justify-between items-start">
              <span className="font-medium text-gray-900">{b.title}</span>
              <div className="flex gap-1.5">
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                  {blockerSeverityLabel(b.severity)}
                </span>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                  {blockerStatusLabel(b.status)}
                </span>
              </div>
            </div>
            {b.detail && <p className="mt-1 text-gray-600">{b.detail}</p>}
            <p className="mt-1 text-gray-500">{ui.eta}: {formatDate(b.eta)}</p>
            {canEdit && (
              <div className="mt-2 flex gap-2 flex-wrap">
                <select
                  value={b.status}
                  onChange={(e) =>
                    updateMutation.mutate({ id: b.id, status: e.target.value })
                  }
                  className="text-xs rounded border border-gray-300 py-1"
                >
                  {BLOCKER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {blockerStatusLabel(s)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(b.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  {ui.delete}
                </button>
              </div>
            )}
          </li>
          )
        })}
      </ul>
      {blockers.length === 0 && !showForm && (
        <p className="text-sm text-gray-500">{ui.noBlockers}</p>
      )}
    </div>
  )
}

function BlockerForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (v: {
    title: string
    detail?: string
    severity: string
    eta?: string
  }) => Promise<unknown>
  onCancel: () => void
  isSubmitting: boolean
}) {
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [eta, setEta] = useState('')

  return (
    <form
      className="mb-4 p-3 rounded border border-gray-200 bg-white space-y-2"
      onSubmit={async (e) => {
        e.preventDefault()
        await onSubmit({ title, detail: detail || undefined, severity, eta: eta || undefined })
      }}
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={ui.title}
        required
        className="block w-full rounded border border-gray-300 py-1 px-2 text-sm"
      />
      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder={ui.detail}
        rows={2}
        className="block w-full rounded border border-gray-300 py-1 px-2 text-sm"
      />
      <select
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
        className="rounded border border-gray-300 py-1 px-2 text-sm"
      >
        {BLOCKER_SEVERITIES.map((s) => (
          <option key={s} value={s}>
            {blockerSeverityLabel(s)}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={eta}
        onChange={(e) => setEta(e.target.value)}
        className="rounded border border-gray-300 py-1 px-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 disabled:opacity-50 shadow-sm"
        >
          {ui.add}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-600 hover:underline">
          {ui.cancel}
        </button>
      </div>
    </form>
  )
}
