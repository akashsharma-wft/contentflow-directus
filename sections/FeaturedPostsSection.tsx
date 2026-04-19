import Link from 'next/link'
import { format } from 'date-fns'
import { getFeaturedPosts } from '@/lib/directus/queries'
import type { FeaturedPostsSection as FeaturedPostsSectionType, PostCard } from '@/types/cms'

interface Props {
  section: FeaturedPostsSectionType
  lang?: string
}

const LANG_LABELS: Record<string, string> = { en: 'EN', hi: 'HI', kn: 'KN' }

export async function FeaturedPostsSection({ section, lang = 'en' }: Props) {
  const {
    heading = 'Featured Stories',
    subheading,
    maxPosts = 2,
    showExcerpt = true,
    showTags = true,
    viewAllLabel,
  } = section

  const posts = (await getFeaturedPosts(lang, maxPosts)) as unknown as PostCard[]

  if (posts.length === 0) return null

  const postUrl = (post: PostCard) =>
    lang === 'en' ? `/${post.slug}` : `/${lang}/${post.slug}`

  const viewAllUrl = lang === 'en' ? '/' : `/${lang}`

  return (
    <section className="w-full px-4 sm:px-6 py-14 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight relative inline-block">
            {heading}
            <span className="absolute -bottom-1.5 left-0 w-10 h-0.5 bg-indigo-500 rounded-full" />
          </h2>
          {subheading && <p className="text-white/40 text-sm mt-3">{subheading}</p>}
        </div>
        {viewAllLabel && (
          <Link href={viewAllUrl} className="text-white/40 hover:text-white text-sm font-medium transition-colors shrink-0 inline-flex items-center gap-1.5">
            {viewAllLabel}
            <span>→</span>
          </Link>
        )}
      </div>

      {/* Cards grid */}
      <div className={`grid gap-5 ${posts.length === 1 ? 'grid-cols-1 max-w-2xl' : 'grid-cols-1 md:grid-cols-2'}`}>
        {posts.map((post, idx) => (
          <Link
            key={post._id}
            href={postUrl(post)}
            className="group relative bg-[#13141c] border border-white/6 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.15)]"
          >
            {/* Cover image */}
            <div className="relative overflow-hidden bg-white/3">
              {post.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${idx === 0 ? 'h-64 sm:h-72' : 'h-56 sm:h-64'}`}
                />
              ) : (
                <div className={`w-full bg-gradient-to-br from-indigo-900/30 to-purple-900/20 ${idx === 0 ? 'h-64 sm:h-72' : 'h-56 sm:h-64'}`} />
              )}
              {/* Language badge over image */}
              {post.language && (
                <span className="absolute top-3 right-3 text-[10px] font-bold tracking-widest bg-black/60 backdrop-blur-sm text-white/70 px-2 py-0.5 rounded-md border border-white/10">
                  {LANG_LABELS[post.language] ?? post.language.toUpperCase()}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6 space-y-3">
              {showTags && post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <h3 className="text-white text-lg sm:text-xl font-bold leading-snug tracking-tight group-hover:text-indigo-300 transition-colors line-clamp-2">
                {post.title}
              </h3>

              {showExcerpt && post.excerpt && (
                <p className="text-white/40 text-sm leading-relaxed line-clamp-2">{post.excerpt}</p>
              )}

              {/* Author + date row */}
              <div className="flex items-center gap-2.5 pt-1">
                {post.authorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.authorAvatar} alt={post.authorName ?? ''} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-[9px] font-bold text-indigo-300">
                    {(post.authorName ?? 'A').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-white/30 text-xs font-medium">{post.authorName ?? 'ContentFlow'}</span>
                {post.publishedAt && (
                  <>
                    <span className="text-white/15">·</span>
                    <time className="text-white/25 text-xs font-mono" dateTime={post.publishedAt}>
                      {format(new Date(post.publishedAt), 'MMM dd, yyyy')}
                    </time>
                  </>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
