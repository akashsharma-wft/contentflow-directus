import { cn } from '@/lib/utils'
import type { ComponentFlexContent } from '@/types/cms'

interface Props {
  component: ComponentFlexContent
}

const GAP: Record<string, string> = { none: 'gap-0', sm: 'gap-3', md: 'gap-6', lg: 'gap-10' }
const ALIGN: Record<string, string> = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' }
const JUSTIFY: Record<string, string> = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between', around: 'justify-around' }

export function FlexComponent({ component }: Props) {
  const {
    heading,
    direction = 'row',
    wrap = true,
    gap = 'md',
    align = 'stretch',
    justify = 'start',
    items = [],
  } = component

  return (
    <section className="w-full py-14 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {heading && <h2 className="text-2xl font-bold text-white">{heading}</h2>}

        <div
          className={cn(
            'flex',
            direction === 'column' ? 'flex-col' : 'flex-row',
            wrap && 'flex-wrap',
            GAP[gap]     ?? GAP.md,
            ALIGN[align] ?? ALIGN.stretch,
            JUSTIFY[justify] ?? JUSTIFY.start,
          )}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className={cn('min-w-0', item.width ?? '')}
            >
              {item.image?.asset && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image.url ?? ''}
                  alt={item.heading ?? ''}
                  className="w-full rounded-xl object-cover mb-3"
                />
              )}
              {item.heading && (
                <h3 className="font-semibold text-white text-sm mb-1">{item.heading}</h3>
              )}
              {item.body && (
                <p className="text-sm text-white/50 leading-relaxed">{item.body}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
