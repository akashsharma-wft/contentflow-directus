'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { PortableText } from '@portabletext/react'
import { ArrowLeft, Share2, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { usePostHog } from 'posthog-js/react'
import { toast } from 'sonner'
import type {
  SectionPostDetailHeaderContent,
  SectionPostDetailMetaContent,
  SectionPostDetailBodyContent,
  SectionPostDetailTagsContent,
  SectionPostDetailBackLinkContent,
} from '@/types/cms'

interface PostDetailProps {
  post: {
    _id: string
    title: string
    slug: string
    body: unknown[]
    tags: string[]
    featured: boolean
    publishedAt: string | null
    coverImage: string | null
    authorId?: string
    authorName?: string
    authorEmail?: string
    authorAvatar?: string | null
    // keep old author for backwards compat with studio-created posts
    author?: { name: string; avatar: string | null } | null
  }
  prevSlug?: string | null
  nextSlug?: string | null
  lang?: string
  // CMS-sourced labels — all optional with hardcoded fallbacks
  headerContent?:   SectionPostDetailHeaderContent | null
  metaContent?:     SectionPostDetailMetaContent | null
  bodyContent?:     SectionPostDetailBodyContent | null
  tagsContent?:     SectionPostDetailTagsContent | null
  backLinkContent?: SectionPostDetailBackLinkContent | null
}


const portableTextComponents = {
  types: {
    image: ({ value }: { value: { asset: { url: string }; alt?: string; caption?: string } }) => (
      <figure className="my-6">
        <img
          src={value.asset?.url}
          alt={value.alt ?? ''}
          className="w-full rounded-xl border border-white/5"
        />
        {value.caption && (
          <figcaption className="text-center text-white/30 text-xs mt-2 font-mono">
            {value.caption}
          </figcaption>
        )}
      </figure>
    ),
    code: ({ value }: { value: { code: string; language?: string; filename?: string } }) => (
      <div className="my-4 rounded-xl overflow-hidden border border-white/10">
        {value.filename && (
          <div className="flex items-center px-4 py-2 bg-white/5 border-b border-white/5">
            <span className="text-white/30 text-[10px] font-mono uppercase tracking-widest">
              {value.filename}
            </span>
          </div>
        )}
        <pre className="p-4 bg-[#0d0e14] overflow-x-auto">
          <code className="text-white/70 text-sm font-mono leading-relaxed">
            {value.code}
          </code>
        </pre>
      </div>
    ),
  },
  block: {
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="text-white text-2xl font-bold mt-8 mb-4">{children}</h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-white text-xl font-bold mt-6 mb-3">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-white text-lg font-semibold mt-5 mb-2">{children}</h3>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-white/60 text-sm leading-relaxed mb-4">{children}</p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-2 border-indigo-500 pl-4 my-4 text-white/40 text-sm italic">
        {children}
      </blockquote>
    ),
  },
  marks: {
    code: ({ children }: { children?: React.ReactNode }) => (
      <code className="bg-white/5 border border-white/10 text-indigo-300 text-xs font-mono px-1.5 py-0.5 rounded">
        {children}
      </code>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="text-white font-semibold">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="text-white/70 italic">{children}</em>
    ),
  },
}

export function PostDetail({
  post,
  prevSlug,
  nextSlug,
  lang = 'en',
  headerContent,
  metaContent,
  bodyContent,
  backLinkContent,
}: PostDetailProps) {
  const posthog = usePostHog()

  const authorName     = post.authorName ?? post.author?.name ?? 'Unknown'
  const authorAvatar   = post.authorAvatar ?? post.author?.avatar ?? null
  const authorInitials = authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  // CMS labels with fallbacks
  const featuredBadgeLabel = headerContent?.featuredBadgeLabel ?? 'Featured'
  const unpublishedLabel   = metaContent?.unpublishedLabel     ?? 'Unpublished'
  const emptyBodyText      = bodyContent?.emptyBodyText        ?? 'No content yet.'
  const shareLabel         = bodyContent?.shareLabel           ?? 'Share'
  const linkCopiedText     = bodyContent?.linkCopiedText       ?? 'Link copied!'
  const backLabel          = backLinkContent?.backLabel        ?? 'Back to Posts'
  const allPostsLabel      = backLinkContent?.allPostsLabel    ?? 'All Posts'
  const prevLabel          = backLinkContent?.prevLabel        ?? 'Previous'
  const nextLabel          = backLinkContent?.nextLabel        ?? 'Next'
  const backHref           = backLinkContent?.backHref         ?? '/posts'

  // Build language-aware slug hrefs
  function postHref(slug: string) {
    return lang === 'en' ? `/${slug}` : `/${lang}/${slug}`
  }

  useEffect(() => {
    if (!posthog) return
    posthog.capture('post_viewed', {
      slug:     post.slug,
      title:    post.title,
      author:   authorName,
      featured: post.featured,
      lang,
    })
  }, [post.slug]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-170 mx-auto px-5 lg:px-8 py-8">

      {/* Back link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-white/35 hover:text-white/70 text-sm mb-6 transition-colors cursor-pointer group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        {backLabel}
      </Link>

      {/* Tags row */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 bg-white/5 border border-white/10 text-white/50 text-[10px] uppercase tracking-widest font-mono rounded"
            >
              {tag}
            </span>
          ))}
          {post.featured && (
            <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] uppercase tracking-widest font-mono rounded">
              {featuredBadgeLabel}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <h1 className="text-white text-2xl lg:text-3xl font-bold tracking-tight leading-tight mb-4">
        {post.title}
      </h1>

      {/* Author + meta row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {authorAvatar
              ? <img src={authorAvatar} alt={authorName} className="w-full h-full rounded-full object-cover" />
              : authorInitials
            }
          </div>
          <div>
            <p className="text-white/70 text-sm font-medium">{authorName}</p>
            <p className="text-white/30 text-xs">
              {post.publishedAt ? format(new Date(post.publishedAt), 'MMM dd, yyyy') : unpublishedLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Cover image */}
      {post.coverImage && (
        <div className="mb-6 rounded-xl overflow-hidden border border-white/5 aspect-video bg-linear-to-br from-indigo-500/20 to-teal-500/20">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Body content */}
      <article className="prose prose-invert max-w-none">
        {post.body ? (
          <PortableText value={post.body as Parameters<typeof PortableText>[0]['value']} components={portableTextComponents} />
        ) : (
          <p className="text-white/30 text-sm italic">{emptyBodyText}</p>
        )}
      </article>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between pt-8 mt-8 border-t border-white/5">
        {prevSlug ? (
          <Link
            href={postHref(prevSlug)}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/8 border border-white/10 text-white/50 hover:text-white text-sm rounded-lg transition-all cursor-pointer"
          >
            <ChevronLeft size={14} />
            {prevLabel}
          </Link>
        ) : (
          <Link
            href={backHref}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/8 border border-white/10 text-white/50 hover:text-white text-sm rounded-lg transition-all cursor-pointer"
          >
            <ChevronLeft size={14} />
            {allPostsLabel}
          </Link>
        )}

        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href)
            toast.success(linkCopiedText)
          }}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/8 border border-white/10 text-white/50 hover:text-white text-sm rounded-lg transition-all cursor-pointer"
        >
          <Share2 size={14} />
          {shareLabel}
        </button>

        {nextSlug ? (
          <Link
            href={postHref(nextSlug)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {nextLabel}
            <ChevronRight size={14} />
          </Link>
        ) : (
          <Link
            href={backHref}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {allPostsLabel}
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

    </div>
  )
}
