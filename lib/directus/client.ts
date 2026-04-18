/**
 * lib/directus/client.ts
 *
 * Directus SDK client instances — mirrors the three-client pattern from lib/sanity/client.ts.
 *
 * Required env vars:
 *   NEXT_PUBLIC_DIRECTUS_URL         — e.g. http://localhost:8055
 *   NEXT_PUBLIC_DIRECTUS_PUBLIC_TOKEN — read-only token (safe for browser)
 *   DIRECTUS_ADMIN_TOKEN             — full-access token (server-side only)
 */
import { createDirectus, rest, staticToken } from '@directus/sdk'
import type { DirectusSchema } from '@/types/directus'

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? 'http://localhost:8055'
const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_DIRECTUS_PUBLIC_TOKEN ?? ''
const ADMIN_TOKEN  = process.env.DIRECTUS_ADMIN_TOKEN ?? ''

/**
 * Public read-only client — safe for server components and browser bundles.
 * Uses the public read token. Equivalent to sanityClient (with CDN).
 */
export const directusClient = createDirectus<DirectusSchema>(DIRECTUS_URL)
  .with(staticToken(PUBLIC_TOKEN))
  .with(rest())

/**
 * Admin client — server-side only, used in API route handlers for writes.
 * Never import this in client components.
 * Equivalent to sanityAdminClient.
 */
export const directusAdminClient = createDirectus<DirectusSchema>(DIRECTUS_URL)
  .with(staticToken(ADMIN_TOKEN))
  .with(rest())

/** The Directus base URL (useful for building file asset URLs). */
export const DIRECTUS_BASE_URL = DIRECTUS_URL
