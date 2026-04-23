import Link from 'next/link'
import { getFeaturedPosts } from '@/lib/directus/queries'
import { FeaturedPostsCarousel } from './FeaturedPostsCarousel'
import type { FeaturedPostsSection as FeaturedPostsSectionType, PostCard } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'

interface Props {
  section: FeaturedPostsSectionType
  lang?: string
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export async function FeaturedPostsSection({ section, lang = 'en' }: Props) {
  const {
    heading     = 'Featured Stories',
    subheading,
    showExcerpt = true,
    showTags    = true,
    viewAllLabel,
  } = section

  const posts = (await getFeaturedPosts(lang)) as unknown as PostCard[]

  if (posts.length === 0) return null

  const viewAllUrl = lang === 'en' ? '/posts' : `/${lang}/posts`

  return (
    <section className="w-full px-4 sm:px-6 py-14 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight relative inline-block">
            {heading}
            <span className="absolute -bottom-1.5 left-0 w-10 h-0.5 bg-indigo-500 rounded-full" />
          </h2>
          {subheading && <p className="text-white/40 text-sm mt-3">{subheading}</p>}
        </div>
        {viewAllLabel && (
          <Link
            href={viewAllUrl}
            className="text-white/40 hover:text-white text-sm font-medium transition-colors shrink-0 inline-flex items-center gap-1.5"
          >
            {viewAllLabel}
            <span>→</span>
          </Link>
        )}
      </div>

      {/* Carousel (client component — handles navigation state) */}
      <FeaturedPostsCarousel
        posts={posts}
        lang={lang}
        showExcerpt={showExcerpt}
        showTags={showTags}
      />
    </section>
  )
}
