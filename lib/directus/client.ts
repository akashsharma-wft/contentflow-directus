/**
 * lib/directus/client.ts
 *
 * Directus SDK client instances.
 *
 * Required env vars:
 *   NEXT_PUBLIC_DIRECTUS_URL          — e.g. http://localhost:8055
 *   NEXT_PUBLIC_DIRECTUS_PUBLIC_TOKEN — read-only token (safe for browser)
 *   DIRECTUS_ADMIN_TOKEN              — full-access token (server-side only)
 */
import { createDirectus, rest, staticToken } from '@directus/sdk'
import type { DirectusSchema } from '@/types/directus'

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? 'http://localhost:8055'
const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_DIRECTUS_PUBLIC_TOKEN ?? ''
const ADMIN_TOKEN  = process.env.DIRECTUS_ADMIN_TOKEN ?? ''

// ─── Rate-limit-aware fetch wrapper ──────────────────────────────────────────
// Directus Cloud caps requests at 50/window. During Next.js static generation
// all pages fire concurrently, easily blowing the limit. This wrapper retries
// on HTTP 429 responses, sleeping until the reset timestamp Directus returns.

const MAX_RETRIES = 5

const retryFetch: typeof globalThis.fetch = async (input, init) => {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await globalThis.fetch(input, init)
    if (res.status !== 429) return res

    // Directus returns { errors: [{ extensions: { reset: ISO-timestamp } }] }
    let delay = 200 * Math.pow(2, attempt)          // exponential fallback (ms)
    try {
      const body = await res.clone().json() as {
        errors?: { extensions?: { reset?: string } }[]
      }
      const reset = body?.errors?.[0]?.extensions?.reset
      if (reset) {
        const ms = new Date(reset).getTime() - Date.now()
        if (ms > 0 && ms < 30_000) delay = ms + 100  // honour Directus reset time
      }
    } catch { /* ignore parse errors */ }

    await new Promise<void>((resolve) => setTimeout(resolve, delay))
  }
  // Final attempt — let the SDK surface the error normally
  return globalThis.fetch(input, init)
}

/**
 * Public read-only client — safe for server components and browser bundles.
 */
export const directusClient = createDirectus<DirectusSchema>(DIRECTUS_URL, {
  globals: { fetch: retryFetch },
})
  .with(staticToken(PUBLIC_TOKEN))
  .with(rest())

/**
 * Admin client — server-side only, used in API route handlers for writes.
 * Never import this in client components.
 */
export const directusAdminClient = createDirectus<DirectusSchema>(DIRECTUS_URL, {
  globals: { fetch: retryFetch },
})
  .with(staticToken(ADMIN_TOKEN))
  .with(rest())

/** The Directus base URL (useful for building file asset URLs). */
export const DIRECTUS_BASE_URL = DIRECTUS_URL
