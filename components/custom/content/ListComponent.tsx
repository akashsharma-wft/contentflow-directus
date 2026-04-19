import { cn } from '@/lib/utils'
import type { ComponentListContent } from '@/types/cms'

interface Props {
  component: ComponentListContent
}

const STYLE_PREFIX: Record<string, (i: number) => React.ReactNode> = {
  bullet:    ()  => <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />,
  numbered:  (i) => <span className="shrink-0 text-xs font-bold text-indigo-400 w-5 text-right mt-0.5">{i + 1}.</span>,
  checklist: ()  => <span className="shrink-0 mt-0.5 w-4 h-4 rounded border border-indigo-400 flex items-center justify-center"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round"/></svg></span>,
  plain:     ()  => null,
  icon:      ()  => <span className="shrink-0 mt-0.5 w-4 h-4 rounded bg-indigo-500/15 flex items-center justify-center text-indigo-400 text-[10px]">◆</span>,
}

export function ListComponent({ component }: Props) {
  const { heading, style = 'bullet', columns = 1, items = [] } = component

  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  }[columns] ?? 'grid-cols-1'

  const prefix = STYLE_PREFIX[style] ?? STYLE_PREFIX.bullet

  return (
    <section className="w-full py-14 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {heading && <h2 className="text-2xl font-bold text-white">{heading}</h2>}

        <ul className={cn('grid gap-3', colClass)}>
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              {prefix(i)}
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/80">{item.text}</span>
                  {item.badge && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-white/35">{item.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
