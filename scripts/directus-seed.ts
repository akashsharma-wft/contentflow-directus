/**
 * scripts/directus-seed.ts
 *
 * Seeds Directus with the minimum data needed for the ContentFlow demo:
 *  1. site_config row (id = "site-config", regular collection — NOT singleton)
 *  2. pages (home, login, signup, posts, analytics, settings, billing, admin)
 *  3. posts (5 sample blog posts)
 *
 * Usage:
 *   npm run directus:seed
 *
 * Required env vars (.env.local):
 *   NEXT_PUBLIC_DIRECTUS_URL  — e.g. https://your-project.directus.app
 *   DIRECTUS_ADMIN_TOKEN      — static token for a user with admin_access: true
 *                               Get it from: Directus Admin → Users → [your admin user]
 *                               → scroll to "Token" field → generate → copy
 *
 * Run AFTER:  npm run directus:bootstrap
 *
 * ── Why the token must be admin ─────────────────────────────────────────────
 * In Directus, GET /items/{collection}/{id} returns 403 (not 404) when the
 * requesting user has no read permission on that collection — even if the row
 * doesn't exist. A user with admin_access: true bypasses all permission checks
 * and receives proper 200/404 responses. This script detects a non-admin token
 * early and tells you exactly how to fix it.
 */

import 'dotenv/config'

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? 'http://localhost:8055'
const ADMIN_TOKEN  = process.env.DIRECTUS_ADMIN_TOKEN

if (!ADMIN_TOKEN) {
  console.error('❌  DIRECTUS_ADMIN_TOKEN is not set. Add it to .env.local.')
  process.exit(1)
}

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${ADMIN_TOKEN}`,
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

// req: throws on any non-2xx response.
async function req(method: string, path: string, body?: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) {
    throw new Error(
      `${method} ${path} → ${res.status}: ${JSON.stringify((data as { errors?: unknown })?.errors ?? data)}`
    )
  }
  return data as Record<string, unknown>
}

// reqItem: GET a single item by ID.
//   Returns the parsed response on 2xx.
//   Returns null on 404 (item not found) OR 403 (no permission — implies empty collection for seeding).
//   Throws on other errors.
async function reqItem(path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, { method: 'GET', headers: HEADERS })
  if (res.status === 404 || res.status === 403) return null
  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) {
    throw new Error(
      `GET ${path} → ${res.status}: ${JSON.stringify((data as { errors?: unknown })?.errors ?? data)}`
    )
  }
  return data as Record<string, unknown>
}

// reqList: GET a list endpoint.
//   Returns data[] on 2xx.
//   Returns [] on 403 (no read permission — treat collection as empty for seeding).
//   Throws on other errors.
async function reqList(path: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, { method: 'GET', headers: HEADERS })
  if (res.status === 403) return []
  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) {
    throw new Error(
      `GET ${path} → ${res.status}: ${JSON.stringify((data as { errors?: unknown })?.errors ?? data)}`
    )
  }
  return ((data as { data?: unknown[] }).data ?? []) as Record<string, unknown>[]
}

// ── Admin token validation ────────────────────────────────────────────────────
//
// In Directus v11, admin_access is a property of a POLICY — not a field on the
// user object. GET /users/me does NOT return admin_access. Checking me.admin_access
// would always be undefined (falsy) and false-reject every token, including real
// admins. Instead we verify by calling GET /users?limit=1 — a list-all-users
// endpoint that only tokens with admin_access can successfully call.

async function checkAdminAccess(): Promise<void> {
  const res = await fetch(`${DIRECTUS_URL}/users?limit=1&fields[]=id`, { headers: HEADERS })

  if (res.status === 403) {
    // Genuinely not admin — get their email for the error message
    const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields[]=email`, { headers: HEADERS })
    const email = meRes.ok
      ? ((await meRes.json()) as { data?: { email?: string } }).data?.email
      : undefined

    console.error('')
    console.error('❌  DIRECTUS_ADMIN_TOKEN does not have admin access')
    if (email) console.error(`    Current token user: ${email}`)
    console.error('')
    console.error('    The token must belong to a user with Administrator role.')
    console.error('    How to get the correct token:')
    console.error('    1. Directus Admin → User Directory')
    console.error('    2. Click your Administrator user → scroll to "Token" field')
    console.error('    3. Click the regenerate icon → copy the new token')
    console.error('    4. Update DIRECTUS_ADMIN_TOKEN in .env.local')
    console.error('    5. Re-run: npm run directus:seed')
    console.error('')
    process.exit(1)
  }

  if (!res.ok) {
    // Unexpected status — warn and continue; let the actual operations surface any real error
    console.warn(`   ⚠  Could not verify admin status (GET /users → ${res.status}). Proceeding.`)
    return
  }

  // 2xx — admin access confirmed
  const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields[]=email`, { headers: HEADERS })
  const email = meRes.ok
    ? ((await meRes.json()) as { data?: { email?: string } }).data?.email
    : 'admin user'
  console.log(`   ✓  Token has admin access (${email})`)
}

// ── site_config ───────────────────────────────────────────────────────────────
//
// site_config is a REGULAR collection (not singleton) with a fixed string PK.
// The canonical row always has id = "site-config".
// Frontend reads via: GET /items/site_config/site-config  (readItem by ID)
//
// Upsert strategy:
//   - GET /items/site_config/site-config → exists? PATCH : POST with id:"site-config"

async function upsertSiteConfig() {
  console.log('\n📋  Seeding site_config…')

  const { default: config } = await import('./seed-data/site-config.json', { with: { type: 'json' } })

  const existing = await reqItem('/items/site_config/site-config')

  if (existing?.data) {
    // Row exists — update without resending the PK
    const { id: _id, ...updatePayload } = config as Record<string, unknown>
    void _id
    await req('PATCH', '/items/site_config/site-config', updatePayload)
    console.log('   ✓  Updated site-config row')
  } else {
    // Row doesn't exist (or couldn't be verified) — create with fixed string PK
    await req('POST', '/items/site_config', { ...config, id: 'site-config' })
    console.log('   ✓  Created site-config row (id = "site-config")')
  }
}

// ── pages ─────────────────────────────────────────────────────────────────────

async function seedPages() {
  console.log('\n📄  Seeding pages…')

  const { default: pages } = await import('./seed-data/pages.json', { with: { type: 'json' } })

  for (const page of pages as Record<string, unknown>[]) {
    const slug     = page.slug     as string
    const language = (page.language as string) ?? 'en'

    const rows = await reqList(
      `/items/pages?filter[slug][_eq]=${encodeURIComponent(slug)}&filter[language][_eq]=${language}&limit=1`
    )

    if (rows.length) {
      await req('PATCH', `/items/pages/${rows[0].id as string}`, page)
      console.log(`   ✓  Updated page:  ${slug} (${language})`)
    } else {
      await req('POST', '/items/pages', page)
      console.log(`   ✓  Created page:  ${slug} (${language})`)
    }
  }
}

// ── posts ─────────────────────────────────────────────────────────────────────

async function seedPosts() {
  console.log('\n📝  Seeding posts…')

  const { default: posts } = await import('./seed-data/posts.json', { with: { type: 'json' } })

  for (const post of posts as Record<string, unknown>[]) {
    const slug     = post.slug     as string
    const language = (post.language as string) ?? 'en'

    const rows = await reqList(
      `/items/posts?filter[slug][_eq]=${encodeURIComponent(slug)}&filter[language][_eq]=${language}&limit=1`
    )

    if (rows.length) {
      await req('PATCH', `/items/posts/${rows[0].id as string}`, post)
      console.log(`   ✓  Updated post:  ${slug}`)
    } else {
      await req('POST', '/items/posts', post)
      console.log(`   ✓  Created post:  ${slug}`)
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀  ContentFlow → Directus seed`)
  console.log(`    URL: ${DIRECTUS_URL}`)

  // Connectivity check — /collections returns proper JSON (unlike /server/ping which returns plain text)
  try {
    await req('GET', '/collections')
    console.log('   ✓  Directus reachable')
  } catch (err) {
    console.error('❌  Cannot reach Directus. Check NEXT_PUBLIC_DIRECTUS_URL in .env.local')
    console.error('   ', (err as Error).message)
    process.exit(1)
  }

  // Admin capability check — must have admin_access: true for item-level CRUD
  await checkAdminAccess()

  await upsertSiteConfig()
  await seedPages()
  await seedPosts()

  console.log('\n✅  Seed complete!\n')
}

main().catch(err => {
  console.error('\n❌  Seed failed:', err.message)
  process.exit(1)
})
