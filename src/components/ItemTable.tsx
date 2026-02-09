import { Link } from 'react-router-dom'
import { formatDate, itemStatusLabel, ui } from '@/lib/i18n'
import type { ItemWithCounts } from '@/types/db'

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
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{ui.title}</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{ui.status}</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{ui.owner}</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{ui.blockers}</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{ui.help}</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{ui.nextStep}</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{ui.targetDate}</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{ui.lastUpdate}</th>
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
              <td className="px-4 py-2 text-sm text-gray-700">{itemStatusLabel(item.status)}</td>
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
