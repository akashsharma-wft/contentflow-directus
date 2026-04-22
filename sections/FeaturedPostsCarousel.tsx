'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PostCard } from '@/types/cms'

const LANG_LABELS: Record<string, string> = { en: 'EN', hi: 'HI', kn: 'KN' }

interface Props {
  posts:       PostCard[]
  lang:        string
  showExcerpt: boolean
  showTags:    boolean
}

export function FeaturedPostsCarousel({ posts, lang, showExcerpt, showTags }: Props) {
  const [index,   setIndex]   = useState(0)
  const [visible, setVisible] = useState(1)
  const touchStartX = useRef<number | null>(null)

  // Responsive: how many cards are visible at once
  useEffect(() => {
    function update() {
      if      (window.innerWidth >= 1024) setVisible(3)
      else if (window.innerWidth >= 640)  setVisible(2)
      else                                setVisible(1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Clamp index when visible count changes (e.g. on resize)
  const maxIndex = Math.max(0, posts.length - visible)
  useEffect(() => {
    setIndex(i => Math.min(i, maxIndex))
  }, [maxIndex])

  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)),          [])
  const next = useCallback(() => setIndex(i => Math.min(maxIndex, i + 1)),   [maxIndex])

  // Touch swipe
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if      (delta >  40) next()
    else if (delta < -40) prev()
    touchStartX.current = null
  }

  const postUrl = (post: PostCard) =>
    lang === 'en' ? `/${post.slug}` : `/${lang}/${post.slug}`

  const cardWidth    = `${100 / visible}%`
  const translatePct = -(index * (100 / visible))
  const totalDots    = maxIndex + 1

  return (
    <div className="relative">
      {/* Carousel track */}
      <div
        className="overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
          style={{ transform: `translateX(${translatePct}%)` }}
        >
          {posts.map((post) => (
            <div
              key={post._id}
              className="flex-shrink-0 px-2.5"
              style={{ width: cardWidth }}
            >
              <Link
                href={postUrl(post)}
                className="group flex flex-col bg-[#13141c] border border-white/6 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.15)] h-full"
              >
                {/* Cover */}
                <div className="relative overflow-hidden bg-white/3 shrink-0">
                  {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-52 sm:h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-52 sm:h-56 bg-gradient-to-br from-indigo-900/30 to-purple-900/20" />
                  )}
                  {post.language && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold tracking-widest bg-black/60 backdrop-blur-sm text-white/70 px-2 py-0.5 rounded-md border border-white/10">
                      {LANG_LABELS[post.language] ?? post.language.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-2.5 flex-1">
                  {showTags && post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <h3 className="text-white text-base sm:text-lg font-bold leading-snug tracking-tight group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  {showExcerpt && post.excerpt && (
                    <p className="text-white/40 text-sm leading-relaxed line-clamp-2 flex-1">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Author + date */}
                  <div className="flex items-center gap-2.5 mt-auto pt-1">
                    {post.authorAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.authorAvatar} alt={post.authorName ?? ''} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-[9px] font-bold text-indigo-300 shrink-0">
                        {(post.authorName ?? 'A').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-white/30 text-xs font-medium truncate">{post.authorName ?? 'ContentFlow'}</span>
                    {post.publishedAt && (
                      <>
                        <span className="text-white/15 shrink-0">·</span>
                        <time className="text-white/25 text-xs font-mono shrink-0" dateTime={post.publishedAt}>
                          {format(new Date(post.publishedAt), 'MMM dd, yyyy')}
                        </time>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Controls row: arrows + dots — centered */}
      {posts.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          {/* Prev arrow */}
          <button
            onClick={prev}
            disabled={index === 0}
            aria-label="Previous"
            className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalDots }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  'rounded-full transition-all duration-300 cursor-pointer',
                  i === index
                    ? 'w-5 h-1.5 bg-indigo-400'
                    : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                )}
              />
            ))}
          </div>

          {/* Next arrow */}
          <button
            onClick={next}
            disabled={index >= maxIndex}
            aria-label="Next"
            className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
