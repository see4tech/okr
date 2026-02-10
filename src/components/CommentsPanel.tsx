import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { ui, formatDateTime } from '@/lib/i18n'
import type { Comment } from '@/types/db'

export function CommentsPanel({
  itemId,
  comments,
  canEdit,
  userId,
}: {
  itemId: string
  comments: (Comment & { author_email?: string | null })[]
  canEdit: boolean
  userId: string
}) {
  const [body, setBody] = useState('')
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (b: string) => {
      const { data, error } = await supabase
        .from('comments')
        .insert({ item_id: itemId, author_id: userId, body: b })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', itemId] })
      setBody('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', itemId] })
    },
  })

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">{ui.comments}</h3>
      {canEdit && (
        <form
          className="mb-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!body.trim()) return
            await createMutation.mutateAsync(body.trim())
          }}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={ui.addComment}
            rows={2}
            className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !body.trim()}
            className="mt-2 rounded-lg bg-brand-600 py-1.5 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 shadow-sm"
          >
            {ui.post}
          </button>
        </form>
      )}
      <ul className="space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="rounded-lg border border-gray-200 p-3 bg-white text-sm shadow-sm">
            <p className="text-gray-700">{c.body}</p>
            <p className="mt-1 text-xs text-gray-500">
              {c.author_email ?? ui.unknown} · {formatDateTime(c.created_at)}
            </p>
            {canEdit && (c.author_id === userId || canEdit) && (
              <button
                type="button"
                onClick={() => deleteMutation.mutate(c.id)}
                className="mt-1 text-xs text-red-600 hover:underline"
              >
                {ui.delete}
              </button>
            )}
          </li>
        ))}
      </ul>
      {comments.length === 0 && !canEdit && <p className="text-sm text-gray-500">{ui.noComments}</p>}
    </div>
  )
}
