import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Comment } from '@/types/db'

function formatDateTime(s: string) {
  return new Date(s).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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
      <h3 className="font-medium text-gray-900 mb-2">Comments</h3>
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
            placeholder="Add a comment…"
            rows={2}
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !body.trim()}
            className="mt-2 rounded-md bg-blue-600 py-1 px-3 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Post
          </button>
        </form>
      )}
      <ul className="space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="rounded border border-gray-200 p-3 bg-gray-50 text-sm">
            <p className="text-gray-700">{c.body}</p>
            <p className="mt-1 text-xs text-gray-500">
              {c.author_email ?? 'Unknown'} · {formatDateTime(c.created_at)}
            </p>
            {canEdit && (c.author_id === userId || canEdit) && (
              <button
                type="button"
                onClick={() => deleteMutation.mutate(c.id)}
                className="mt-1 text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
      {comments.length === 0 && !canEdit && <p className="text-sm text-gray-500">No comments.</p>}
    </div>
  )
}
