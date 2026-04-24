// GridSection.tsx
'use client'
import Link from 'next/link'
import Image from 'next/image'
import { pageAttr } from '@/lib/directus/section-binding'

type ImgSrc = string | { asset?: { _ref?: string } } | null | undefined
function resolveImg(src: ImgSrc): string { return typeof src === 'string' ? src : '' }

interface GridItem {
  _key?: string
  heading: string
  body?: string
  image?: ImgSrc
  icon?: string
  linkLabel?: string
  linkHref?: string
}

interface GridSectionProps {
  section: {
    heading?: string
    subheading?: string
    columns?: 2 | 3 | 4
    items?: GridItem[]
    cardStyle?: 'bordered' | 'filled' | 'plain'
  }
  translationId?: number
}

const colClass: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

const cardClass: Record<string, string> = {
  bordered: 'border border-white/8 rounded-2xl p-6 bg-transparent',
  filled: 'bg-white/5 rounded-2xl p-6',
  plain: 'p-4',
}

export function GridSection({ section, translationId }: GridSectionProps) {
  const { heading, subheading, columns = 3, items = [], cardStyle = 'bordered' } = section
  return (
    <section className="py-16 px-6 bg-[#0d0e14]" data-directus={pageAttr(translationId, 'sections')}>
      <div className="max-w-7xl mx-auto">
        {(heading || subheading) && (
          <div className="mb-12 text-center">
            {heading && <h2 className="text-3xl font-bold text-white mb-3">{heading}</h2>}
            {subheading && <p className="text-white/50 max-w-xl mx-auto">{subheading}</p>}
          </div>
        )}
        <div className={`grid gap-6 ${colClass[columns]}`}>
          {items.map((item, i) => {
            const imgUrl = resolveImg(item.image)
            return (
              <div key={item._key ?? i} className={cardClass[cardStyle]}>
                {imgUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden aspect-video relative">
                    <Image
                      src={imgUrl}
                      alt={item.heading}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                {item.icon && (
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/15 flex items-center justify-center mb-4">
                    <span className="text-indigo-400 text-sm font-mono">{item.icon}</span>
                  </div>
                )}
                <h3 className="text-white font-semibold text-lg mb-2">{item.heading}</h3>
                {item.body && <p className="text-white/50 text-sm leading-relaxed mb-4">{item.body}</p>}
                {item.linkHref && item.linkLabel && (
                  <Link href={item.linkHref} className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
                    {item.linkLabel} →
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
