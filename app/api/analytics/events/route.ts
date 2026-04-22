// ─── app/api/analytics/events/route.ts ───────────────────────────────────────
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // ─── Auth ────────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ─── Admin guard ─────────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ─── Env Config ──────────────────────────────────────────────────────────
    const posthogPersonalKey = process.env.POSTHOG_PERSONAL_API_KEY
    const projectId = process.env.POSTHOG_PROJECT_ID

    if (!posthogPersonalKey || !projectId) {
      console.warn(
        '[analytics/events] Missing env vars: ' +
        (!posthogPersonalKey ? 'POSTHOG_PERSONAL_API_KEY ' : '') +
        (!projectId ? 'POSTHOG_PROJECT_ID' : '')
      )
      return NextResponse.json({
        configured: false,
        events: [],
        customEvents: [],
        systemEvents: [],
        eventsToday: 0,
        uniqueUsers: 0,
        avgSession: '—',
      })
    }

    const host = 'https://us.posthog.com'

    // ─── Fetch Events ────────────────────────────────────────────────────────
    const eventsRes = await fetch(
      `${host}/api/projects/${projectId}/events/?limit=50&order=-timestamp`,
      {
        headers: {
          Authorization: `Bearer ${posthogPersonalKey}`,
        },
        cache: 'no-store',
      }
    )

    if (!eventsRes.ok) {
      const errText = await eventsRes.text().catch(() => '')
      console.error(`PostHog events fetch failed: ${eventsRes.status} ${eventsRes.statusText}`, errText)
      // Treat a failed PostHog API call as a configuration error so the frontend
      // can show a meaningful message instead of silent "No events yet".
      return NextResponse.json({
        configured: false,
        apiError: `PostHog API ${eventsRes.status}: check POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID`,
        events: [],
        customEvents: [],
        systemEvents: [],
        eventsToday: 0,
        uniqueUsers: 0,
        avgSession: '—',
      })
    }

    const data = await eventsRes.json()

    const allEvents: Array<{
      timestamp: string
      event: string
      properties: Record<string, unknown>
      distinct_id: string
    }> = data.results ?? []

    // ─── Metrics Calculation ─────────────────────────────────────────────────
    const todayStr = new Date().toDateString()

    const eventsToday = allEvents.filter(
      (e) => new Date(e.timestamp).toDateString() === todayStr
    ).length

    const uniqueUsers = new Set(
      allEvents.map((e) => e.distinct_id)
    ).size

    // ─── Session Calculation (FIXED) ─────────────────────────────────────────
    let avgSession = '—'

    if (allEvents.length > 0) {
      const SESSION_GAP = 30 * 60 * 1000 // 30 minutes

      const eventsByUser: Record<string, typeof allEvents> = {}

      // Group by user
      for (const event of allEvents) {
        if (!eventsByUser[event.distinct_id]) {
          eventsByUser[event.distinct_id] = []
        }
        eventsByUser[event.distinct_id].push(event)
      }

      let totalSessionTime = 0
      let totalSessions = 0

      for (const userEvents of Object.values(eventsByUser)) {
        const sorted = userEvents
          .map((e) => new Date(e.timestamp).getTime())
          .sort((a, b) => a - b)

        let sessionStart = sorted[0]
        let lastEvent = sorted[0]

        for (let i = 1; i < sorted.length; i++) {
          const current = sorted[i]

          // New session if gap > 30 min
          if (current - lastEvent > SESSION_GAP) {
            totalSessionTime += lastEvent - sessionStart
            totalSessions++

            sessionStart = current
          }

          lastEvent = current
        }

        // Final session
        totalSessionTime += lastEvent - sessionStart
        totalSessions++
      }

      if (totalSessions > 0) {
        const avgMs = totalSessionTime / totalSessions

        const mins = Math.floor(avgMs / 60000)
        const secs = Math.floor((avgMs % 60000) / 1000)

        avgSession = `${mins}m ${secs}s`
      }
    }

    // ─── Custom Events Priority ──────────────────────────────────────────────
    const CUSTOM_EVENTS = new Set([
      'post_viewed',
      'post_created',
      'post_edited',
      'post_deleted',
      'upgrade_intent',
      'upgrade_completed',
      'form_submitted',
      'login',
    ])

    const customEvents = allEvents
      .filter((e) => CUSTOM_EVENTS.has(e.event))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      )

    const systemEvents = allEvents
      .filter((e) => !CUSTOM_EVENTS.has(e.event))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      )

    // ─── Final Response ──────────────────────────────────────────────────────
    return NextResponse.json({
      configured: true,
      events: allEvents.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      ),
      customEvents,
      systemEvents,
      eventsToday,
      uniqueUsers,
      avgSession,
    })
  } catch (err) {
    console.error('Analytics route error:', err)

    return NextResponse.json({
      configured: true,
      events: [],
      customEvents: [],
      systemEvents: [],
      eventsToday: 0,
      uniqueUsers: 0,
      avgSession: '—',
    })
  }
}