import { getPostsCountByLang } from '@/lib/directus/queries'
import type { StatsSection as StatsSectionType } from '@/types/cms'

interface Props {
  section: StatsSectionType
}

export async function StatsSection({ section }: Props) {
  const { heading, stats = [] } = section

  // Resolve live post count for any stat that requests it
  let livePostCount: number | null = null
  const needsLiveCount = stats.some((s) => s.useLivePostCount)
  if (needsLiveCount) {
    livePostCount = await getPostsCountByLang('en')
  }

  const resolvedStats = stats.map((stat) => ({
    ...stat,
    value: stat.useLivePostCount && livePostCount !== null
      ? livePostCount.toLocaleString()
      : stat.value,
  }))

  return (
    <section className="w-full px-6 py-12">
      {heading && (
        <h2 className="text-center text-2xl font-bold text-white tracking-tight mb-10">
          {heading}
        </h2>
      )}
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {resolvedStats.map((stat, i) => (
          <div
            key={i}
            className="bg-[#13141c] border border-white/5 rounded-xl p-5 space-y-1 text-center"
          >
            <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
            <p className="text-white/60 text-sm font-medium">{stat.label}</p>
            {stat.description && (
              <p className="text-white/30 text-xs">{stat.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
