import { Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDate, itemStatusLabel, ui } from '@/lib/i18n'
import type { ItemWithCounts } from '@/types/db'

export type ActivityEntry =
  | { type: 'comment'; id: string; at: string; author: string; body: string }
  | { type: 'update'; id: string; at: string; author: string; snapshot: Record<string, unknown> }

const statusColors: Record<string, string> = {
  discovery: 'bg-blue-100 text-blue-800',
  design: 'bg-purple-100 text-purple-800',
  execution: 'bg-amber-100 text-amber-800',
  validation: 'bg-cyan-100 text-cyan-800',
  ready_to_deploy: 'bg-emerald-100 text-emerald-800',
  deploying: 'bg-lime-100 text-lime-800',
  in_production: 'bg-green-100 text-green-800',
  paused: 'bg-gray-100 text-gray-700',
  at_risk: 'bg-red-100 text-red-800',
}

function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${color}`}>
      {itemStatusLabel(status)}
    </span>
  )
}

export function ItemTable({
  items,
  openBlockersCount,
  openHelpCount,
  expandedItemId,
  onToggleExpand,
  expandedActivity,
  formatDateTime,
  canDeleteItems,
  onDeleteItem,
  isDeletingItemId,
}: {
  items: ItemWithCounts[]
  openBlockersCount: Record<string, number>
  openHelpCount: Record<string, number>
  expandedItemId?: string | null
  onToggleExpand?: (itemId: string) => void
  expandedActivity?: ActivityEntry[]
  formatDateTime?: (s: string) => string
  canDeleteItems?: boolean
  onDeleteItem?: (itemId: string) => void
  isDeletingItemId?: string | null
}) {
  const navigate = useNavigate()
  const formatDt = formatDateTime ?? ((s: string) => new Date(s).toLocaleString('es'))
  const columnCount = canDeleteItems ? 10 : 9

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-50/80">
            <th className="w-9 px-1 py-3" aria-label={ui.expandDetails} />
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{ui.title}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{ui.status}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{ui.owner}</th>
            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{ui.blockers}</th>
            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{ui.help}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{ui.nextStep}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{ui.targetDate}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{ui.lastUpdate}</th>
            {canDeleteItems && <th className="w-12 px-1 py-3" aria-label={ui.delete} />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => {
            const isExpanded = expandedItemId === item.id
            return (
              <Fragment key={item.id}>
                <tr
                  onClick={() => navigate(`/item/${item.id}`)}
                  className="hover:bg-brand-50/40 cursor-pointer transition-colors"
                >
                  <td className="px-1 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                    {onToggleExpand && (
                      <button
                        type="button"
                        onClick={() => onToggleExpand(item.id)}
                        className="p-1 rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                        title={isExpanded ? ui.collapseDetails : ui.expandDetails}
                        aria-expanded={isExpanded}
                      >
                        <svg
                          className="w-4 h-4 transition-transform"
                          style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Link to={`/item/${item.id}`} className="text-brand-700 hover:text-brand-900 hover:underline font-medium text-sm">
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.owner_email ?? '—'}</td>
                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <Link
                      to={`/item/${item.id}?tab=blockers`}
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        (openBlockersCount[item.id] ?? 0) > 0
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title={ui.blockers}
                    >
                      {openBlockersCount[item.id] ?? 0}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <Link
                      to={`/item/${item.id}?tab=help`}
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        (openHelpCount[item.id] ?? 0) > 0
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title={ui.helpRequests}
                    >
                      {openHelpCount[item.id] ?? 0}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={item.next_step ?? ''}>
                    {item.next_step ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(item.target_date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(item.last_update_at)}</td>
                  {canDeleteItems && (
                    <td className="px-1 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onDeleteItem?.(item.id)}
                        disabled={isDeletingItemId === item.id}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                        title={ui.delete}
                        aria-label={ui.delete}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
                {isExpanded && expandedActivity && (
                  <tr key={`${item.id}-detail`}>
                    <td colSpan={columnCount} className="px-4 py-4 bg-gray-50/50 border-t border-gray-100">
                      <div className="pl-6 border-l-2 border-brand-300">
                        <div className="flex items-center gap-2 mb-3">
                          <StatusBadge status={item.status} />
                          {item.last_update_at && (
                            <span className="text-xs text-gray-500">{ui.lastUpdate}: {formatDt(item.last_update_at)}</span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{ui.detailsAndComments}</p>
                        {expandedActivity.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">{ui.noComments}. {ui.noUpdatesYet}</p>
                        ) : (
                          <ul className="space-y-2 list-none pl-0 text-sm">
                            {expandedActivity.map((e) => (
                              <li key={`${e.type}-${e.id}`} className="pl-3 border-l-2 border-gray-200 py-1">
                                <span className={`text-xs font-medium ${e.type === 'comment' ? 'text-brand-600' : 'text-amber-600'}`}>
                                  {e.type === 'comment' ? ui.activityComment : ui.activityUpdate}
                                </span>
                                <span className="text-xs text-gray-400 ml-1">
                                  {e.author} · {formatDt(e.at)}
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
                        <Link to={`/item/${item.id}`} className="inline-block mt-3 text-sm font-medium text-brand-600 hover:text-brand-800 hover:underline">
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
