import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ComponentCardsContent } from '@/types/cms'

interface Props {
  component: ComponentCardsContent
}

export function CardsComponent({ component }: Props) {
  const { heading, layout = 'grid-3', items = [] } = component

  const containerClass = {
    'grid-2':     'grid grid-cols-1 sm:grid-cols-2 gap-6',
    'grid-3':     'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
    'featured':   'grid grid-cols-1 lg:grid-cols-2 gap-6',
    'horizontal': 'flex flex-col gap-4',
  }[layout] ?? 'grid grid-cols-1 sm:grid-cols-3 gap-6'

  return (
    <section className="w-full py-14 px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        {heading && <h2 className="text-3xl font-bold text-white">{heading}</h2>}

        <div className={containerClass}>
          {items.map((card, i) => (
            <article
              key={i}
              className={cn(
                'bg-[#13141c] border border-white/8 rounded-2xl overflow-hidden flex flex-col',
                layout === 'featured' && i === 0 && 'lg:row-span-2',
                layout === 'horizontal' && 'flex-row gap-4 p-4 items-start',
              )}
            >
              {card.image?.asset && layout !== 'horizontal' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.image.url ?? ''}
                  alt={card.heading}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className={cn('flex flex-col gap-2 p-5 flex-1', layout === 'horizontal' && 'p-0')}>
                {card.badge && (
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full w-fit">
                    {card.badge}
                  </span>
                )}
                <h3 className="font-semibold text-white">{card.heading}</h3>
                {card.body && <p className="text-sm text-white/50 leading-relaxed flex-1">{card.body}</p>}
                {card.tags && card.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {card.tags.map((tag, ti) => (
                      <span key={ti} className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
                {card.ctaLabel && card.ctaHref && (
                  <Link
                    href={card.ctaHref}
                    className="mt-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
                  >
                    {card.ctaLabel} →
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
