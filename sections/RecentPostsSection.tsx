import { getRecentPosts } from '@/lib/directus/queries'
import { PostFilterGrid } from '@/components/PostFilterGrid'
import type { RecentPostsSection as RecentPostsSectionType, PostCard } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

interface Props {
  section: RecentPostsSectionType
  lang?: string
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export async function RecentPostsSection({ section, lang = 'en', translationId, translationRow }: Props) {
  const { count = 12 } = section

  const heading    = translationRow?.recent_posts_heading    ?? section.heading    ?? 'Recent Publications'
  const subheading = translationRow?.recent_posts_subheading ?? section.subheading

  const posts = (await getRecentPosts(lang, Math.max(count, 24))) as unknown as PostCard[]
  if (posts.length === 0) return null

  return (
    <section className="w-full px-4 sm:px-6 py-14 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2
          data-directus={pageAttr(translationId, 'recent_posts_heading')}
          className="text-2xl sm:text-3xl font-bold text-white tracking-tight relative inline-block"
        >
          {heading}
          <span className="absolute -bottom-1.5 left-0 w-10 h-0.5 bg-indigo-500 rounded-full" />
        </h2>
        {subheading && (
          <p
            data-directus={pageAttr(translationId, 'recent_posts_subheading')}
            className="text-white/40 text-sm mt-3"
          >
            {subheading}
          </p>
        )}
      </div>

      <PostFilterGrid posts={posts} lang={lang} />
    </section>
  )
}