import { Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDate, itemStatusLabel, ui } from '@/lib/i18n'
import type { ItemWithCounts } from '@/types/db'

export type ActivityEntry =
  | { type: 'comment'; id: string; at: string; author: string; body: string }
  | { type: 'update'; id: string; at: string; author: string; snapshot: Record<string, unknown> }

export function ItemTable({
  items,
  openBlockersCount,
  openHelpCount,
  expandedItemId,
  onToggleExpand,
  expandedActivity,
  formatDateTime,
}: {
  items: ItemWithCounts[]
  openBlockersCount: Record<string, number>
  openHelpCount: Record<string, number>
  expandedItemId?: string | null
  onToggleExpand?: (itemId: string) => void
  expandedActivity?: ActivityEntry[]
  formatDateTime?: (s: string) => string
}) {
  const navigate = useNavigate()
  const formatDt = formatDateTime ?? ((s: string) => new Date(s).toLocaleString('es'))

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-9 px-1 py-2" aria-label={ui.expandDetails} />
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
          {items.map((item) => {
            const isExpanded = expandedItemId === item.id
            return (
              <Fragment key={item.id}>
                <tr
                  key={item.id}
                  onClick={() => navigate(`/item/${item.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-1 py-2 align-top" onClick={(e) => e.stopPropagation()}>
                    {onToggleExpand && (
                      <button
                        type="button"
                        onClick={() => onToggleExpand(item.id)}
                        className="p-1 rounded text-gray-500 hover:bg-gray-200"
                        title={isExpanded ? ui.collapseDetails : ui.expandDetails}
                        aria-expanded={isExpanded}
                      >
                        <span className="inline-block transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
                          ▶
                        </span>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
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
                {isExpanded && expandedActivity && (
                  <tr key={`${item.id}-detail`} className="bg-gray-50">
                    <td colSpan={9} className="px-4 py-3 border-t border-gray-200">
                      <div className="pl-6 border-l-2 border-gray-300">
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          {ui.status}: {itemStatusLabel(item.status)}
                          {item.last_update_at && ` · ${ui.lastUpdate}: ${formatDt(item.last_update_at)}`}
                        </p>
                        <p className="text-xs font-medium text-gray-600 mb-2">{ui.detailsAndComments}</p>
                        {expandedActivity.length === 0 ? (
                          <p className="text-sm text-gray-500">{ui.noComments}. {ui.noUpdatesYet}</p>
                        ) : (
                          <ul className="space-y-2 list-none pl-0 text-sm">
                            {expandedActivity.map((e) => (
                              <li key={`${e.type}-${e.id}`} className="pl-3 border-l-2 border-gray-200">
                                <span className="text-xs text-gray-500">
                                  {e.type === 'comment' ? ui.activityComment : ui.activityUpdate} · {e.author} · {formatDt(e.at)}
                                </span>
                                {e.type === 'comment' ? (
                                  <p className="mt-0.5 text-gray-800">{e.body}</p>
                                ) : (
                                  <ul className="mt-0.5 text-gray-700 list-disc list-inside">
                                    {(e.snapshot as Record<string, string | null | undefined>).status != null && (
                                      <li>{ui.status}: {itemStatusLabel(String((e.snapshot as Record<string, unknown>).status))}</li>
                                    )}
                                    {(e.snapshot as Record<string, string | null>).next_step != null && (e.snapshot as Record<string, string>).next_step !== '' && (
                                      <li>{ui.nextStep}: {(e.snapshot as Record<string, string>).next_step}</li>
                                    )}
                                    {(e.snapshot as Record<string, string | null>).status_reason != null && (e.snapshot as Record<string, string>).status_reason !== '' && (
                                      <li>{ui.statusReason}: {(e.snapshot as Record<string, string>).status_reason}</li>
                                    )}
                                  </ul>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        <Link to={`/item/${item.id}`} className="inline-block mt-2 text-sm text-blue-600 hover:underline">
                          {ui.openDetail} →
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
