import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
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
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900">Help requests</h3>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showForm ? 'Cancel' : 'Add request'}
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
            className="rounded border border-gray-200 p-3 bg-gray-50 text-sm"
          >
            <div className="flex justify-between items-start">
              <span className="font-medium text-gray-900">{hr.type}</span>
              <span className="text-gray-500 text-xs">{hr.status}</span>
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
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(hr.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {helpRequests.length === 0 && !showForm && (
        <p className="text-sm text-gray-500">No help requests.</p>
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
            {t}
          </option>
        ))}
      </select>
      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="Detail"
        rows={2}
        className="block w-full rounded border border-gray-300 py-1 px-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          Add
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-600 hover:underline">
          Cancel
        </button>
      </div>
    </form>
  )
}
