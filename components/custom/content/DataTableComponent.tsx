'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { ComponentDataTableContent } from '@/types/cms'

interface Props {
  component: ComponentDataTableContent
}

export function DataTableComponent({ component }: Props) {
  const {
    heading,
    description,
    columns = [],
    rows = [],
    striped = true,
    bordered = false,
    pagination = false,
    pageSize = 10,
  } = component

  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows
    return [...rows].sort((a, b) => {
      const aVal = a.cells?.find(c => c.key === sortKey)?.value ?? ''
      const bVal = b.cells?.find(c => c.key === sortKey)?.value ?? ''
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
  }, [rows, sortKey, sortDir])

  const paged = pagination ? sortedRows.slice(page * pageSize, (page + 1) * pageSize) : sortedRows
  const totalPages = pagination ? Math.ceil(rows.length / pageSize) : 1

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <section className="w-full py-14 px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {(heading || description) && (
          <div className="space-y-1">
            {heading     && <h2 className="text-2xl font-bold text-white">{heading}</h2>}
            {description && <p className="text-white/50 text-sm">{description}</p>}
          </div>
        )}

        <div className={cn('overflow-x-auto rounded-xl', bordered ? 'border border-white/10' : '')}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {columns.map((col, ci) => (
                  <th
                    key={ci}
                    onClick={() => handleSort(col.key, col.sortable)}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40',
                      col.align === 'center' && 'text-center',
                      col.align === 'right'  && 'text-right',
                      col.sortable && 'cursor-pointer hover:text-white/70 select-none',
                    )}
                  >
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row, ri) => (
                <tr
                  key={ri}
                  className={cn(
                    'border-b border-white/5 last:border-0 transition-colors hover:bg-white/3',
                    striped && ri % 2 === 1 && 'bg-white/[0.02]',
                  )}
                >
                  {columns.map((col, ci) => {
                    const cell = row.cells?.find(c => c.key === col.key)
                    return (
                      <td
                        key={ci}
                        className={cn(
                          'px-4 py-3 text-white/70',
                          col.align === 'center' && 'text-center',
                          col.align === 'right'  && 'text-right',
                        )}
                      >
                        {cell?.value ?? '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-10 text-center text-white/30 text-sm">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-white/40">
            <span>Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
