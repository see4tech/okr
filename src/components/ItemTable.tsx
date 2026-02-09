import { Link } from 'react-router-dom'
import type { ItemWithCounts } from '@/types/db'

function formatDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ItemTable({
  items,
  openBlockersCount,
  openHelpCount,
}: {
  items: ItemWithCounts[]
  openBlockersCount: Record<string, number>
  openHelpCount: Record<string, number>
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Blockers</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Help</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Next step</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target date</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last update</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">
                <Link to={`/item/${item.id}`} className="text-blue-600 hover:underline font-medium">
                  {item.title}
                </Link>
              </td>
              <td className="px-4 py-2 text-sm text-gray-700">{item.status}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{item.owner_email ?? '—'}</td>
              <td className="px-4 py-2 text-sm">{openBlockersCount[item.id] ?? 0}</td>
              <td className="px-4 py-2 text-sm">{openHelpCount[item.id] ?? 0}</td>
              <td className="px-4 py-2 text-sm text-gray-700 max-w-[200px] truncate" title={item.next_step ?? ''}>
                {item.next_step ?? '—'}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700">{formatDate(item.target_date)}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{formatDate(item.last_update_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
