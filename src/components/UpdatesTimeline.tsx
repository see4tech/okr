import { ui, formatDateTime } from '@/lib/i18n'
import type { ItemUpdateWithAuthor } from '@/types/db'

export function UpdatesTimeline({ updates }: { updates: ItemUpdateWithAuthor[] }) {
  if (updates.length === 0) {
    return <p className="text-sm text-gray-500">{ui.noUpdatesYet}</p>
  }

  return (
    <ul className="space-y-4">
      {[...updates].reverse().map((u) => (
        <li key={u.id} className="border-l-2 border-gray-200 pl-4 py-1">
          <p className="text-xs text-gray-500">
            {formatDateTime(u.created_at)}
            {u.author_email && ` · ${u.author_email}`}
          </p>
          <pre className="mt-1 text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 p-2 rounded">
            {JSON.stringify(u.snapshot as Record<string, unknown>, null, 2)}
          </pre>
        </li>
      ))}
    </ul>
  )
}
