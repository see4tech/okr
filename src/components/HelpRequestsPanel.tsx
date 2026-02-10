import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { ui, helpRequestTypeLabel, helpRequestStatusLabel } from '@/lib/i18n'
import { HELP_REQUEST_TYPES, HELP_REQUEST_STATUSES } from '@/types/enums'
import type { HelpRequest } from '@/types/db'

export function HelpRequestsPanel({
  itemId,
  helpRequests,
  canEdit,
  userId,
}: {
  itemId: string
  helpRequests: HelpRequest[]
  canEdit: boolean
  userId: string
}) {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (payload: {
      type: string
      detail?: string
      status?: string
    }) => {
      const { data, error } = await supabase
        .from('help_requests')
        .insert({
          item_id: itemId,
          requested_by: userId,
          type: payload.type,
          detail: payload.detail || null,
          status: payload.status ?? 'open',
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help_requests', itemId] })
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      setShowForm(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: string
    }) => {
      const { data, error } = await supabase
        .from('help_requests')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help_requests', itemId] })
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('help_requests').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help_requests', itemId] })
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{ui.helpRequests}</h3>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="text-sm font-medium text-brand-600 hover:text-brand-800"
          >
            {showForm ? ui.cancel : `+ ${ui.addRequest}`}
          </button>
        )}
      </div>
      {showForm && canEdit && (
        <HelpRequestForm
          onSubmit={(v) => createMutation.mutateAsync(v)}
          onCancel={() => setShowForm(false)}
          isSubmitting={createMutation.isPending}
        />
      )}
      <ul className="space-y-2 mt-2">
        {helpRequests.map((hr) => (
          <li
            key={hr.id}
            className="rounded-lg border border-gray-200 border-l-4 border-l-brand-400 p-3 bg-white text-sm shadow-sm"
          >
            <div className="flex justify-between items-start">
              <span className="font-medium text-gray-900">{helpRequestTypeLabel(hr.type)}</span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">{helpRequestStatusLabel(hr.status)}</span>
            </div>
            {hr.detail && <p className="mt-1 text-gray-600">{hr.detail}</p>}
            {canEdit && (
              <div className="mt-2 flex gap-2 flex-wrap">
                <select
                  value={hr.status}
                  onChange={(e) =>
                    updateMutation.mutate({ id: hr.id, status: e.target.value })
                  }
                  className="text-xs rounded border border-gray-300 py-1"
                >
                  {HELP_REQUEST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {helpRequestStatusLabel(s)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(hr.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  {ui.delete}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {helpRequests.length === 0 && !showForm && (
        <p className="text-sm text-gray-500">{ui.noHelpRequests}</p>
      )}
    </div>
  )
}

function HelpRequestForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (v: { type: string; detail?: string }) => Promise<unknown>
  onCancel: () => void
  isSubmitting: boolean
}) {
  const [type, setType] = useState('other')
  const [detail, setDetail] = useState('')

  return (
    <form
      className="mb-4 p-3 rounded border border-gray-200 bg-white space-y-2"
      onSubmit={async (e) => {
        e.preventDefault()
        await onSubmit({ type, detail: detail || undefined })
      }}
    >
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="block w-full rounded border border-gray-300 py-1 px-2 text-sm"
      >
        {HELP_REQUEST_TYPES.map((t) => (
          <option key={t} value={t}>
            {helpRequestTypeLabel(t)}
          </option>
        ))}
      </select>
      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder={ui.detail}
        rows={2}
        className="block w-full rounded border border-gray-300 py-1 px-2 text-sm"
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
