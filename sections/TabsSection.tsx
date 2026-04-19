'use client'
import { useState } from 'react'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'

type ImgSrc = string | { asset?: { _ref?: string } } | null | undefined
function resolveImg(src: ImgSrc): string { return typeof src === 'string' ? src : '' }

interface Tab {
  _key?: string
  label: string
  icon?: string
  content?: unknown[]
  image?: ImgSrc
}

interface TabsSectionProps {
  section: {
    heading?: string
    tabs?: Tab[]
  }
}

export function TabsSection({ section }: TabsSectionProps) {
  const { heading, tabs = [] } = section
  const [active, setActive] = useState(0)
  const current = tabs[active]

  return (
    <section className="py-16 px-6 bg-[#0d0e14]">
      <div className="max-w-5xl mx-auto">
        {heading && <h2 className="text-3xl font-bold text-white text-center mb-10">{heading}</h2>}

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 bg-white/4 border border-white/8 rounded-xl p-1 mb-8 w-fit mx-auto">
          {tabs.map((tab, i) => (
            <button
              key={tab._key ?? i}
              onClick={() => setActive(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                active === i
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {current && (
          <div className="border border-white/8 rounded-2xl p-8 bg-white/2">
            {(() => {
              const imgUrl = resolveImg(current.image)
              return imgUrl ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6">
                  <Image
                    src={imgUrl}
                    alt={current.label}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : null
            })()}
            {current.content && (
              <div className="prose prose-invert prose-sm max-w-none text-white/70">
                <PortableText value={current.content as Parameters<typeof PortableText>[0]['value']} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
