// features/analytics/components/PostHogEventsClient.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePostHog } from 'posthog-js/react'
import { useUser } from '@/hooks/useUser'
import { ToggleRight, Loader2, Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SectionAnalyticsContent } from '@/types/cms'

interface ServerFlags {
  showFeaturedBanner: boolean
}

interface AttrMap {
  headingAttr?:      string
  subheadingAttr?:   string
  eventsLabelAttr?:  string
  usersLabelAttr?:   string
  emptyTitleAttr?:   string
  emptyBodyAttr?:    string
  refreshLabelAttr?: string
  prevLabelAttr?:    string
  nextLabelAttr?:    string
}

interface PostHogEventsClientProps {
  config: SectionAnalyticsContent
  serverFlags: ServerFlags
  attrMap?: AttrMap
}

interface LiveEvent {
  timestamp: string
  event: string
  properties: Record<string, unknown>
  distinct_id: string
}

type SortMode = 'time' | 'important'

const EVENT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  post_viewed:        { bg: 'bg-indigo-500/15',  text: 'text-indigo-300',  label: 'post_viewed' },
  post_created:       { bg: 'bg-emerald-500/15', text: 'text-emerald-300', label: 'post_created' },
  post_edited:        { bg: 'bg-blue-500/15',    text: 'text-blue-300',    label: 'post_edited' },
  post_deleted:       { bg: 'bg-red-500/15',     text: 'text-red-300',     label: 'post_deleted' },
  upgrade_intent:     { bg: 'bg-amber-500/15',   text: 'text-amber-300',   label: 'upgrade_intent' },
  upgrade_completed:  { bg: 'bg-purple-500/15',  text: 'text-purple-300',  label: 'upgrade_completed' },
  form_submitted:     { bg: 'bg-emerald-500/15', text: 'text-emerald-300', label: 'form_submitted' },
  login:              { bg: 'bg-emerald-500/15', text: 'text-emerald-300', label: 'login' },
  '$pageview':        { bg: 'bg-white/5',        text: 'text-white/35',    label: '$pageview' },
  '$autocapture':     { bg: 'bg-white/[0.03]',   text: 'text-white/20',    label: '$autocapture' },
  '$web_vitals':      { bg: 'bg-blue-500/8',     text: 'text-blue-400/50', label: '$web_vitals' },
  '$set':             { bg: 'bg-white/[0.03]',   text: 'text-white/20',    label: '$set' },
}

function getEventStyle(event: string) {
  return EVENT_COLORS[event] ?? { bg: 'bg-white/5', text: 'text-white/40', label: event }
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  if (seconds < 60)   return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

function formatProps(properties: Record<string, unknown>): string {
  return Object.entries(properties)
    .filter(([k]) => !k.startsWith('$') && k !== 'token')
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`)
    .join(' · ')
}

const PAGE_SIZE     = 10
const MAX_PAGE_BTNS = 5

export function PostHogEventsClient({ config, serverFlags, attrMap = {} }: PostHogEventsClientProps) {
  const posthog = usePostHog()
  const { user } = useUser()
  const [events, setEvents]                   = useState<LiveEvent[]>([])
  const [isLoading, setIsLoading]             = useState(true)
  const [configured, setConfigured]           = useState(true)
  const [apiError, setApiError]               = useState<string | null>(null)
  const [featureFlagEnabled, setFeatureFlagEnabled] = useState(serverFlags.showFeaturedBanner)
  const [stats, setStats]                     = useState({ eventsToday: 0, uniqueUsers: 0, avgSession: '—' })
  const [sortMode, setSortMode]               = useState<SortMode>('time')
  const [customEvents, setCustomEvents]       = useState<LiveEvent[]>([])
  const [systemEvents, setSystemEvents]       = useState<LiveEvent[]>([])
  const [isRefreshing, setIsRefreshing]       = useState(false)
  const [page, setPage]                       = useState(1)

  function applyData(data: Record<string, unknown>) {
    const isConfigured = data.configured !== false
    setConfigured(isConfigured)
    setApiError(isConfigured ? null : ((data.apiError as string) ?? null))
    setEvents((data.events as LiveEvent[]) ?? [])
    setStats({
      eventsToday: (data.eventsToday as number) ?? 0,
      uniqueUsers: (data.uniqueUsers as number) ?? 0,
      avgSession:  (data.avgSession  as string)  ?? '—',
    })
    setCustomEvents((data.customEvents as LiveEvent[]) ?? [])
    setSystemEvents((data.systemEvents as LiveEvent[]) ?? [])
  }

  async function refreshEvents() {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/analytics/events')
      if (response.ok) {
        const data = await response.json()
        applyData(data)
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/analytics/events')
        if (response.ok) {
          const data = await response.json()
          applyData(data)
        }
      } catch {
        // network error — leave configured:true, show empty state
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
    posthog?.capture('page_view', { path: '/analytics' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posthog])

  useEffect(() => {
    if (posthog && user?.id) {
      const flag = posthog.isFeatureEnabled('show-featured-banner')
      setFeatureFlagEnabled(flag ?? serverFlags.showFeaturedBanner)
    }
  }, [posthog, user?.id, serverFlags.showFeaturedBanner])

  const displayedEvents = sortMode === 'important'
    ? [...customEvents, ...systemEvents]
    : events

  const resetPage = useCallback(() => setPage(1), [])
  useEffect(() => { resetPage() }, [sortMode, events.length, resetPage])

  const totalPages    = Math.max(1, Math.ceil(displayedEvents.length / PAGE_SIZE))
  const safePage      = Math.min(page, totalPages)
  const pageStart     = (safePage - 1) * PAGE_SIZE
  const visibleEvents = displayedEvents.slice(pageStart, pageStart + PAGE_SIZE)

  const halfWindow  = Math.floor(MAX_PAGE_BTNS / 2)
  const winStart    = Math.max(1, Math.min(safePage - halfWindow, totalPages - MAX_PAGE_BTNS + 1))
  const winEnd      = Math.min(totalPages, winStart + MAX_PAGE_BTNS - 1)
  const pageButtons = Array.from({ length: winEnd - winStart + 1 }, (_, i) => winStart + i)

  const showingLabel = config.showingLabel ?? 'Showing'
  const prevLabel    = config.prevLabel    ?? 'Prev'
  const nextLabel    = config.nextLabel    ?? 'Next'

  const todayStr    = new Date().toDateString()
  const eventsToday = events.filter(e => new Date(e.timestamp).toDateString() === todayStr).length

  const statCards = [
    { label: config.eventsLabel ?? 'Events Today',     value: isLoading ? '—' : `${eventsToday}+`,               attr: attrMap.eventsLabelAttr },
    { label: config.usersLabel  ?? 'Unique Users',     value: isLoading ? '—' : stats.uniqueUsers.toString(),    attr: attrMap.usersLabelAttr  },
    { label: config.avgSessionLabel ?? 'Avg. Session', value: isLoading ? '—' : stats.avgSession,                attr: undefined },
  ]

  return (
    <div className="space-y-5 max-w-[900px]">
      <div>
        <h1
          {...(attrMap.headingAttr ? { 'data-directus': attrMap.headingAttr } : {})}
          className="text-white text-2xl font-bold tracking-tight"
        >
          {config.heading ?? 'PostHog Events'}
        </h1>
        <p
          {...(attrMap.subheadingAttr ? { 'data-directus': attrMap.subheadingAttr } : {})}
          className="text-white/30 text-[10px] uppercase tracking-widest font-mono mt-1"
        >
          {config.subheading ?? 'Real-time Telemetry / Production Pipeline'}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map(({ label, value, attr }) => (
          <div key={label} className="bg-[#13141c] border border-white/5 rounded-xl p-4">
            <p
              {...(attr ? { 'data-directus': attr } : {})}
              className="text-white/30 text-[10px] uppercase tracking-widest font-mono mb-2"
            >
              {label}
            </p>
            <p className="text-white text-2xl font-bold tracking-tight">
              {isLoading ? <Loader2 size={20} className="animate-spin text-white/20" /> : value}
            </p>
          </div>
        ))}
      </div>

      {/* Live event stream */}
      <div className="bg-[#13141c] border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h3 className="text-white text-sm font-semibold">
              {config.liveStreamLabel ?? 'Live event stream'}
            </h3>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortMode(sortMode === 'time' ? 'important' : 'time')}
              className="text-white/30 hover:text-white/60 text-[10px] uppercase tracking-widest font-mono cursor-pointer transition-colors px-2 py-1 rounded border border-white/10 hover:border-white/20"
            >
              {sortMode === 'time' ? '⏱ Time' : '★ Priority'}
            </button>
            <button
              onClick={refreshEvents}
              disabled={isRefreshing}
              {...(attrMap.refreshLabelAttr ? { 'data-directus': attrMap.refreshLabelAttr } : {})}
              className="text-white/30 hover:text-white/60 text-[10px] uppercase tracking-widest font-mono cursor-pointer transition-colors px-2 py-1 rounded border border-white/10 hover:border-white/20"
            >
              {isRefreshing ? 'Refreshing...' : (config.refreshLabel ?? 'Refresh')}
            </button>
            <span className="text-white/20 text-[10px] font-mono hidden lg:block">NEXT_PUBLIC_POSTHOG_KEY</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-white/20" />
          </div>
        ) : !configured ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Activity size={18} className="text-amber-400/60" />
            </div>
            <p className="text-white/40 text-sm">Analytics not configured</p>
            {apiError ? (
              <p className="text-amber-400/60 text-xs max-w-sm text-center font-mono">{apiError}</p>
            ) : (
              <p className="text-white/20 text-xs max-w-xs text-center font-mono">
                Set <span className="text-amber-400/70">POSTHOG_PERSONAL_API_KEY</span> and{' '}
                <span className="text-amber-400/70">POSTHOG_PROJECT_ID</span> in your env to enable event streaming.
              </p>
            )}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Activity size={18} className="text-white/20" />
            </div>
            <p
              {...(attrMap.emptyTitleAttr ? { 'data-directus': attrMap.emptyTitleAttr } : {})}
              className="text-white/30 text-sm"
            >
              {config.emptyTitle ?? 'No events yet'}
            </p>
            <p
              {...(attrMap.emptyBodyAttr ? { 'data-directus': attrMap.emptyBodyAttr } : {})}
              className="text-white/20 text-xs max-w-xs text-center"
            >
              {config.emptyBody ?? 'Events will appear here as users interact with your app.'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-white/5">
              {visibleEvents.map((event, i) => {
                const style = getEventStyle(event.event)
                return (
                  <div key={pageStart + i} className="flex items-center gap-3 px-5 py-3 hover:bg-white/2 transition-colors">
                    <span className="text-white/20 text-[11px] font-mono w-16 shrink-0 tabular-nums">
                      {timeAgo(event.timestamp)}
                    </span>
                    <span className={`px-2.5 py-1 text-[10px] font-semibold font-mono rounded-md shrink-0 ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                    <span className="text-white/30 text-xs font-mono truncate flex-1">
                      {formatProps(event.properties)}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 flex-wrap gap-2">
              <span className="text-white/25 text-[10px] uppercase tracking-widest font-mono">
                {showingLabel}{' '}
                {displayedEvents.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, displayedEvents.length)}{' '}
                / {displayedEvents.length}
              </span>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    {...(attrMap.prevLabelAttr ? { 'data-directus': attrMap.prevLabelAttr } : {})}
                    className="p-1 rounded text-white/30 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label={prevLabel}
                  >
                    <ChevronLeft size={13} />
                  </button>

                  {pageButtons.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        'min-w-6 h-6 px-1.5 text-[10px] font-mono rounded transition-colors cursor-pointer',
                        p === safePage
                          ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                          : 'text-white/30 hover:text-white/60 border border-transparent hover:border-white/10',
                      )}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    {...(attrMap.nextLabelAttr ? { 'data-directus': attrMap.nextLabelAttr } : {})}
                    className="p-1 rounded text-white/30 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label={nextLabel}
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Feature flag display */}
      <div className="bg-[#13141c] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ToggleRight size={15} className="text-indigo-400" />
              <p className="text-white text-sm font-medium">
                {config.featureFlagLabel ?? 'Feature flag: show-featured-banner'}
              </p>
            </div>
            <p className="text-white/35 text-xs mt-1 ml-5">
              {featureFlagEnabled
                ? (config.featureFlagEnabledNote ?? 'Enabled — evaluated server-side via PostHog Node SDK')
                : (config.featureFlagDisabledNote ?? 'Disabled — toggle in PostHog dashboard to enable')}
            </p>
          </div>
          <div
            className={cn('relative rounded-full transition-all', featureFlagEnabled ? 'bg-emerald-500' : 'bg-white/10')}
            style={{ width: '44px', height: '24px' }}
          >
            <span className={cn(
              'absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm',
              featureFlagEnabled ? 'left-6' : 'left-1',
            )} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-white/25 text-[10px] font-mono uppercase">
            {config.connectedLabel ?? 'Connected to PostHog'}
          </span>
        </div>
        <a
          href="https://us.posthog.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-mono uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
        >
          {config.ctaLabel ?? 'Configure_PostHog'}
        </a>
      </div>
    </div>
  )
}