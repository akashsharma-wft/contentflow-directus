import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ComponentGridContent } from '@/types/cms'

interface Props {
  component: ComponentGridContent
}

const COL_CLASS: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

const CARD_CLASS: Record<string, string> = {
  bordered: 'border border-white/10 rounded-2xl p-6',
  filled:   'bg-white/5 rounded-2xl p-6',
  plain:    'p-6',
  elevated: 'bg-[#13141c] border border-white/8 rounded-2xl p-6 shadow-lg shadow-black/20',
}

export function GridComponent({ component }: Props) {
  const {
    heading,
    subheading,
    columns = 3,
    cardStyle = 'bordered',
    items = [],
  } = component

  return (
    <section className="w-full py-14 px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        {(heading || subheading) && (
          <div className="text-center space-y-3">
            {heading    && <h2 className="text-3xl font-bold text-white">{heading}</h2>}
            {subheading && <p className="text-white/50 max-w-xl mx-auto">{subheading}</p>}
          </div>
        )}

        <div className={cn('grid gap-6', COL_CLASS[columns] ?? COL_CLASS[3])}>
          {items.map((item, i) => (
            <div key={i} className={cn('flex flex-col space-y-3', CARD_CLASS[cardStyle] ?? CARD_CLASS.bordered)}>
              {item.image?.asset && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image.url ?? ''} alt={item.heading} className="w-full h-40 object-cover rounded-lg" />
              )}
              {item.icon && (
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold">
                  {item.icon.slice(0, 2)}
                </div>
              )}
              <h3 className="font-semibold text-white">{item.heading}</h3>
              {item.body && <p className="text-sm text-white/50 leading-relaxed flex-1">{item.body}</p>}
              {item.linkLabel && item.linkHref && (
                <Link
                  href={item.linkHref}
                  className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors mt-auto inline-flex items-center gap-1"
                >
                  {item.linkLabel} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
