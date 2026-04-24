'use client'
import Image from 'next/image'
import { Globe, Share2 } from 'lucide-react'
import Link from 'next/link'
import { pageAttr } from '@/lib/directus/section-binding'

type ImgSrc = string | { asset?: { _ref?: string } } | null | undefined
function resolveImg(src: ImgSrc): string { return typeof src === 'string' ? src : '' }

// ─── TIMELINE SECTION ─────────────────────────────────────────────────────────
interface TimelineEvent {
  _key?: string
  date: string
  title: string
  description?: string
  icon?: string
  highlight?: boolean
}

interface TimelineSectionProps {
  section: {
    heading?: string
    events?: TimelineEvent[]
    orientation?: 'vertical' | 'horizontal'
  }
  translationId?: number
}

export function TimelineSection({ section, translationId }: TimelineSectionProps) {
  const { heading, events = [] } = section
  return (
    <section className="py-16 px-6 bg-[#0d0e14]" data-directus={pageAttr(translationId, 'sections')}>
      <div className="max-w-3xl mx-auto">
        {heading && <h2 className="text-3xl font-bold text-white text-center mb-12">{heading}</h2>}
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-white/8" />
          <div className="space-y-8">
            {events.map((ev, i) => (
              <div key={ev._key ?? i} className="flex gap-6 pl-0">
                <div className={`relative z-10 w-12 h-12 shrink-0 rounded-full flex items-center justify-center border ${
                  ev.highlight
                    ? 'bg-indigo-500/20 border-indigo-500/50'
                    : 'bg-white/5 border-white/10'
                }`}>
                  {ev.icon
                    ? <span className="text-xs">{ev.icon}</span>
                    : <span className={`w-2 h-2 rounded-full ${ev.highlight ? 'bg-indigo-400' : 'bg-white/30'}`} />
                  }
                </div>
                <div className="pb-4">
                  <span className="text-white/30 text-xs font-mono uppercase tracking-widest">{ev.date}</span>
                  <h3 className={`text-base font-semibold mt-0.5 ${ev.highlight ? 'text-indigo-300' : 'text-white'}`}>{ev.title}</h3>
                  {ev.description && <p className="text-white/45 text-sm mt-1 leading-relaxed">{ev.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── TEAM SECTION ─────────────────────────────────────────────────────────────
interface TeamMember {
  _key?: string
  name: string
  role?: string
  bio?: string
  avatar?: ImgSrc
  linkedIn?: string
  twitter?: string
}

interface TeamSectionProps {
  section: {
    heading?: string
    subheading?: string
    members?: TeamMember[]
    columns?: 2 | 3 | 4
  }
  translationId?: number
}

const teamColClass: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
}

export function TeamSection({ section, translationId }: TeamSectionProps) {
  const { heading, subheading, members = [], columns = 3 } = section
  return (
    <section className="py-16 px-6 bg-[#0d0e14]" data-directus={pageAttr(translationId, 'sections')}>
      <div className="max-w-6xl mx-auto">
        {(heading || subheading) && (
          <div className="text-center mb-12">
            {heading && <h2 className="text-3xl font-bold text-white mb-3">{heading}</h2>}
            {subheading && <p className="text-white/50">{subheading}</p>}
          </div>
        )}
        <div className={`grid gap-8 ${teamColClass[columns]}`}>
          {members.map((m, i) => {
            const avatarUrl = resolveImg(m.avatar)
            return (
              <div key={m._key ?? i} className="text-center">
                <div className="relative w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 bg-white/5">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={m.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 text-2xl font-bold">
                      {m.name[0]}
                    </div>
                  )}
                </div>
                <h3 className="text-white font-semibold">{m.name}</h3>
                {m.role && <p className="text-indigo-400 text-sm mt-0.5">{m.role}</p>}
                {m.bio && <p className="text-white/40 text-xs mt-2 leading-relaxed max-w-xs mx-auto">{m.bio}</p>}
                <div className="flex justify-center gap-3 mt-3">
                  {m.linkedIn && (
                    <Link href={m.linkedIn} target="_blank" className="text-white/25 hover:text-white/60 transition-colors">
                      <Globe size={14} />
                    </Link>
                  )}
                  {m.twitter && (
                    <Link href={m.twitter} target="_blank" className="text-white/25 hover:text-white/60 transition-colors">
                      <Share2 size={14} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── LOGO BAR SECTION ─────────────────────────────────────────────────────────
interface Logo { _key?: string; image: ImgSrc; alt: string; href?: string }

interface LogoBarSectionProps {
  section: {
    heading?: string
    logos?: Logo[]
    scrolling?: boolean
  }
  translationId?: number
}

export function LogoBarSection({ section, translationId }: LogoBarSectionProps) {
  const { heading, logos = [] } = section
  return (
    <section className="py-12 px-6 bg-[#0d0e14] border-y border-white/5" data-directus={pageAttr(translationId, 'sections')}>
      <div className="max-w-5xl mx-auto">
        {heading && (
          <p className="text-center text-white/25 text-xs uppercase tracking-widest font-mono mb-8">{heading}</p>
        )}
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-40 grayscale">
          {logos.map((logo, i) => {
            const imgUrl = resolveImg(logo.image)
            if (!imgUrl) return null
            const img = (
              <div key={logo._key ?? i} className="relative h-8 w-24">
                <Image
                  src={imgUrl}
                  alt={logo.alt}
                  fill
                  className="object-contain"
                />
              </div>
            )
            return logo.href
              ? <Link key={logo._key ?? i} href={logo.href} target="_blank" className="hover:opacity-100 transition-opacity">{img}</Link>
              : img
          })}
        </div>
      </div>
    </section>
  )
}
