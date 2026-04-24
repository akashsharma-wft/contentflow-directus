import { pageAttr } from '@/lib/directus/section-binding'

interface TableSectionProps {
  section: {
    heading?: string
    headers?: string[]
    rows?: { _key?: string; cells?: string[] }[]
    striped?: boolean
    bordered?: boolean
  }
  translationId?: number
}

export function TableSection({ section, translationId }: TableSectionProps) {
  const { heading, headers = [], rows = [], striped = true, bordered = true } = section
  return (
    <section className="py-12 px-6 bg-[#0d0e14]" data-directus={pageAttr(translationId, 'sections')}>
      <div className="max-w-5xl mx-auto">
        {heading && <h2 className="text-2xl font-bold text-white mb-6">{heading}</h2>}
        <div className={`overflow-x-auto rounded-xl ${bordered ? 'border border-white/8' : ''}`}>
          <table className="w-full text-sm">
            {headers.length > 0 && (
              <thead>
                <tr className="border-b border-white/8">
                  {headers.map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-white/40 text-xs uppercase tracking-widest font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={row._key ?? ri}
                  className={`border-b border-white/5 last:border-0 ${striped && ri % 2 === 1 ? 'bg-white/2' : ''}`}
                >
                  {(row.cells ?? []).map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-white/65">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
