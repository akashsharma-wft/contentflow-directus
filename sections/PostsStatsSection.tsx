'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, CheckCircle, FileEdit } from 'lucide-react'
import type { SectionPostsStatsContent } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

interface Props {
  content: SectionPostsStatsContent
  lang?: string
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

interface PostMeta {
  _id: string
  authorId?: string
  publishedAt: string | null
  language?: string
}

export function PostsStatsSection({ content, lang = 'en', translationId, translationRow }: Props) {
  const { user, isLoading: authLoading } = useUser()

  const { data: posts = [], isLoading } = useQuery<PostMeta[]>({
    queryKey: ['posts', 'stats', lang],
    queryFn: async () => {
      const res = await fetch(`/api/posts?lang=${lang}`)
      if (!res.ok) throw new Error('Failed')
      return (await res.json()) as PostMeta[]
    },
    enabled: !!user?.id,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })

  if (authLoading || isLoading) {
    return (
      <div className="mb-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  const myPosts   = posts.filter((p) => p.authorId === user?.id)
  const published = myPosts.filter((p) => !!p.publishedAt).length
  const drafts    = myPosts.filter((p) => !p.publishedAt).length
  const total     = myPosts.length

  const myPostsLabel   = translationRow?.posts_my_label        ?? content.myPostsLabel    ?? 'My Posts'
  const publishedLabel = translationRow?.posts_published_label ?? content.publishedLabel  ?? 'Published'
  const draftsLabel    = translationRow?.posts_drafts_label    ?? content.draftsLabel     ?? 'Drafts'

  const stats = [
    {
      label:    myPostsLabel,
      labelAttr: pageAttr(translationId, 'posts_my_label'),
      value:    total.toLocaleString(),
      sub:      undefined,
      subColor: 'text-indigo-400',
      icon:     FileText,
      bar:      false,
    },
    {
      label:    publishedLabel,
      labelAttr: pageAttr(translationId, 'posts_published_label'),
      value:    published.toString(),
      sub:      'Live',
      subColor: 'text-emerald-400',
      icon:     CheckCircle,
      bar:      true,
      barColor: 'bg-emerald-500',
      barWidth: `${Math.round((published / (total || 1)) * 100)}%`,
    },
    {
      label:    draftsLabel,
      labelAttr: pageAttr(translationId, 'posts_drafts_label'),
      value:    drafts.toString(),
      sub:      'Unpublished',
      subColor: 'text-white/30',
      icon:     FileEdit,
      bar:      false,
    },
  ]

  return (
    <div className="mb-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {stats.map(({ label, labelAttr, value, sub, subColor, icon: Icon, bar, barColor, barWidth }) => (
          <div key={label} className="bg-[#13141c] border border-white/5 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p
                {...(labelAttr ? { 'data-directus': labelAttr } : {})}
                className="text-white/30 text-[10px] uppercase tracking-widest font-medium"
              >
                {label}
              </p>
              <Icon size={13} className="text-white/20" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-white text-2xl font-bold tracking-tight">{value}</span>
              {sub && <span className={`text-xs font-medium ${subColor}`}>{sub}</span>}
            </div>
            {bar && barWidth && (
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: barWidth }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}