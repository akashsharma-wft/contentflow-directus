'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { PostCard } from '@/types/cms'

const LANG_LABELS: Record<string, string> = { en: 'EN', hi: 'HI', kn: 'KN' }
const PAGE_SIZE = 6

const UI_STRINGS: Record<string, { allPosts: string; noResults: string; loadMore: string }> = {
  en: { allPosts: 'All Posts',         noResults: 'No posts found.',                    loadMore: 'Load More Stories'              },
  hi: { allPosts: 'सभी पोस्ट',         noResults: 'कोई पोस्ट नहीं मिली।',              loadMore: 'और कहानियाँ लोड करें'           },
  kn: { allPosts: 'ಎಲ್ಲಾ ಪೋಸ್ಟ್‌ಗಳು', noResults: 'ಯಾವುದೇ ಪೋಸ್ಟ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ.', loadMore: 'ಹೆಚ್ಚಿನ ಕಥೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಿ' },
}

interface Props {
  posts: PostCard[]
  lang: string
  viewAllLabel?: string
}

export function PostFilterGrid({ posts, lang, viewAllLabel }: Props) {
  const [activeTag, setActiveTag] = useState<string>('all')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const ui = UI_STRINGS[lang] ?? UI_STRINGS.en

  // Extract unique tags from all posts
  const tags = useMemo(() => {
    const set = new Set<string>()
    posts.forEach((p) => p.tags?.forEach((t) => set.add(t)))
    return Array.from(set).slice(0, 6) // max 6 filter tabs
  }, [posts])

  const filtered = useMemo(
    () => (activeTag === 'all' ? posts : posts.filter((p) => p.tags?.includes(activeTag))),
    [posts, activeTag]
  )

  const shown = filtered.slice(0, visible)
  const hasMore = visible < filtered.length

  const postUrl = (post: PostCard) =>
    lang === 'en' ? `/${post.slug}` : `/${lang}/${post.slug}`

  return (
    <div className="space-y-7">
      {/* Filter tabs */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setActiveTag('all'); setVisible(PAGE_SIZE) }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
              activeTag === 'all'
                ? 'bg-white text-[#0d0e14]'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            {ui.allPosts}
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => { setActiveTag(tag); setVisible(PAGE_SIZE) }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors capitalize ${
                activeTag === tag
                  ? 'bg-white text-[#0d0e14]'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-white/30 text-sm py-8 text-center">{ui.noResults}</p>
      ) : (
        <>
          {/* Desktop: 3-col grid / Mobile: 1-col list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {shown.map((post) => (
              <Link
                key={post._id}
                href={postUrl(post)}
                className="group bg-[#13141c] border border-white/6 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300"
              >
                {/* Cover image */}
                <div className="relative overflow-hidden bg-white/3">
                  {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-white/3 to-white/[0.01]" />
                  )}

                  {/* Tag + language overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    {post.tags && post.tags.length > 0 && (
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-black/60 backdrop-blur-sm text-white/80 px-2 py-0.5 rounded-md border border-white/10">
                        {post.tags[0]}
                      </span>
                    )}
                    {post.language && (
                      <span className="text-[9px] font-bold tracking-widest bg-black/60 backdrop-blur-sm text-white/50 px-2 py-0.5 rounded-md border border-white/10">
                        {LANG_LABELS[post.language] ?? post.language.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 space-y-2.5">
                  <h3 className="text-white text-sm font-semibold leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-white/35 text-xs leading-relaxed line-clamp-2">{post.excerpt}</p>
                  )}
                  {/* Author row */}
                  <div className="flex items-center gap-2 pt-0.5">
                    {post.authorAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.authorAvatar} alt={post.authorName ?? ''} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-indigo-500/25 flex items-center justify-center text-[8px] font-bold text-indigo-300">
                        {(post.authorName ?? 'A').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-white/30 text-[11px] truncate">{post.authorName ?? 'ContentFlow'}</span>
                    {post.publishedAt && (
                      <>
                        <span className="text-white/15 text-[11px]">·</span>
                        <time className="text-white/20 text-[11px] font-mono shrink-0" dateTime={post.publishedAt}>
                          {format(new Date(post.publishedAt), 'MMM dd')}
                        </time>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Load more / view all row */}
          <div className="flex items-center justify-center gap-4">
            {hasMore && (
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-sm font-medium rounded-xl transition-colors inline-flex items-center gap-2"
              >
                {ui.loadMore}
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            {viewAllLabel && !hasMore && (
              <Link
                href={lang === 'en' ? '/posts' : `/${lang}/posts`}
                className="text-white/40 hover:text-white text-sm font-medium transition-colors inline-flex items-center gap-1.5"
              >
                {viewAllLabel} →
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}
