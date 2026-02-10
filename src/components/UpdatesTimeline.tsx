import { ui, formatDateTime } from '@/lib/i18n'
import type { ItemUpdateWithAuthor } from '@/types/db'

export function UpdatesTimeline({ updates }: { updates: ItemUpdateWithAuthor[] }) {
  if (updates.length === 0) {
    return <p className="text-sm text-gray-500">{ui.noUpdatesYet}</p>
  }

  return (
    <ul className="space-y-3">
      {[...updates].reverse().map((u) => (
        <li key={u.id} className="border-l-2 border-brand-300 pl-4 py-2">
          <p className="text-xs text-gray-500 mb-1">
            <span className="font-medium text-brand-600">{u.author_email ?? ''}</span>
            {u.author_email && ' · '}
            {formatDateTime(u.created_at)}
          </p>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
            {JSON.stringify(u.snapshot as Record<string, unknown>, null, 2)}
          </pre>
        </li>
      ))}
    </ul>
  )
}
