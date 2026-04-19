// sections/AdminSection.tsx
//
// Server component that:
//   1. Fetches all users (service role, bypasses RLS)
//   2. Fetches all admin invites + access requests (service role)
//   3. Renders AdminUsersTable (existing) + AdminInvitePanel (new)
import 'server-only'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { AdminDatabase } from '@/types/admin'
import type { SectionAdminContent } from '@/types/cms'
import type { AdminInviteRow } from '@/types/admin'
import { AdminUsersTable } from '@/features/admin/components/AdminUsersTable'
import { AdminInvitePanel } from '@/features/admin/components/AdminInvitePanel'

interface Props {
  lang?:    string
  content?: SectionAdminContent
}

function adminDb() {
  return createAdminClient<AdminDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function AdminSection({ content = {} }: Props) {
  const [users, { invites, requests }] = await Promise.all([
    getAllUsers(),
    getPendingInvitesAndRequests(),
  ])

  return (
    <div>
      <AdminUsersTable users={users} config={content} />
      <AdminInvitePanel
        initialInvites={invites}
        initialRequests={requests}
        config={content}
      />
    </div>
  )
}

async function getAllUsers() {
  const db = adminDb()
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('AdminSection: Failed to fetch users', error)
    return []
  }
  return data ?? []
}

async function getPendingInvitesAndRequests(): Promise<{
  invites:  AdminInviteRow[]
  requests: AdminInviteRow[]
}> {
  const db = adminDb()

  const { data: rows, error } = await db
    .from('admin_invites')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('AdminSection: Failed to fetch invites', error)
    return { invites: [], requests: [] }
  }

  // Enrich with profile display names
  const profileIds = new Set<string>()
  for (const row of rows ?? []) {
    if (row.user_id)    profileIds.add(row.user_id)
    if (row.invited_by) profileIds.add(row.invited_by)
  }

  const profileMap = new Map<string, string>()
  if (profileIds.size > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, display_name, email')
      .in('id', Array.from(profileIds))

    for (const p of profiles ?? []) {
      profileMap.set(p.id, p.display_name ?? p.email ?? p.id)
    }
  }

  const enriched: AdminInviteRow[] = (rows ?? []).map((row) => ({
    ...row,
    requester_name:  row.user_id    ? (profileMap.get(row.user_id)    ?? null) : null,
    invited_by_name: row.invited_by ? (profileMap.get(row.invited_by) ?? null) : null,
  }))

  return {
    invites:  enriched.filter((r) => r.type === 'invite'),
    requests: enriched.filter((r) => r.type === 'request'),
  }
}
