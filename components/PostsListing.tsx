/**
 * PostsListing — server component
 *
 * Fallback content for language homepages when no CMS page document
 * with slug="home" exists for the requested language.
 * Renders a list of published posts for the given language.
 */
import Link from 'next/link'
import { format } from 'date-fns'
import { getRecentPosts } from '@/lib/directus/queries'
import { SUPPORTED_LANGUAGES, LANG_LABELS, type SupportedLang } from '@/lib/directus/pageResolver'
import type { PostCard } from '@/types/cms'

interface Props {
  lang: SupportedLang
}

/** Builds the URL for a language homepage (English = /, others = /lang). */
function langUrl(lang: string): string {
  return lang === 'en' ? '/' : `/${lang}`
}

export async function PostsListing({ lang }: Props) {
  const posts = (await getRecentPosts(lang, 50)) as unknown as PostCard[]

  return (
    <main className="min-h-screen bg-[#0d0e14] text-white px-6 py-12 max-w-4xl mx-auto">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">ContentFlow</h1>
          <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-widest bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 rounded-full">
            {LANG_LABELS[lang]}
          </span>
        </div>
        <p className="text-white/40 text-sm">
          {posts.length} published {posts.length === 1 ? 'post' : 'posts'}
        </p>

        {/* Language switcher */}
        <nav className="flex items-center gap-3 mt-4">
          {SUPPORTED_LANGUAGES.map((l) => (
            <Link
              key={l}
              href={langUrl(l)}
              className={`text-sm font-medium transition-colors ${
                l === lang ? 'text-white' : 'text-white/35 hover:text-white/70'
              }`}
            >
              {LANG_LABELS[l]}
            </Link>
          ))}
        </nav>
      </header>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-white/30 text-lg mb-2">No posts yet</p>
          <p className="text-white/20 text-sm">
            Create posts in the dashboard with language set to &quot;{LANG_LABELS[lang]}&quot;
          </p>
        </div>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li
              key={post._id}
              className="group p-5 bg-[#13141c] border border-white/5 rounded-2xl hover:border-white/10 transition-colors"
            >
              <Link href={lang === 'en' ? `/${post.slug}` : `/${lang}/${post.slug}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {post.featured && (
                      <span className="inline-block mb-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-300 bg-amber-500/15 border border-amber-500/25 rounded-full">
                        Featured
                      </span>
                    )}
                    <h2 className="text-white font-semibold text-lg group-hover:text-indigo-300 transition-colors truncate">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-white/40 text-sm mt-1 line-clamp-2">{post.excerpt}</p>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {post.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 text-[10px] font-medium text-white/40 bg-white/5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {post.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                    />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  {post.authorName && (
                    <span className="text-white/30 text-xs">{post.authorName}</span>
                  )}
                  {post.authorName && post.publishedAt && (
                    <span className="text-white/15 text-xs">·</span>
                  )}
                  {post.publishedAt && (
                    <time className="text-white/25 text-xs font-mono" dateTime={post.publishedAt}>
                      {format(new Date(post.publishedAt), 'MMM dd, yyyy')}
                    </time>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
