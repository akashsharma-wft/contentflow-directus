// sections/AdminSection.tsx
import 'server-only'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { AdminDatabase } from '@/types/admin'
import type { SectionAdminContent } from '@/types/cms'
import { AdminUsersTable } from '@/features/admin/components/AdminUsersTable'
import { AdminInvitePanel } from '@/features/admin/components/AdminInvitePanel'
import { DirectusCredentialsCard } from '@/features/admin/components/DirectusCredentialsCard'
import type { DirectusPageTranslationRow } from '@/types/directus'

interface Props {
  lang?:    string
  content?: SectionAdminContent
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

function adminDb() {
  return createAdminClient<AdminDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function AdminSection({ content = {} }: Props) {
  const users = await getAllUsers()

  return (
    <div className="space-y-8">
      {/* Directus dashboard access card — shown at top */}
      <DirectusCredentialsCard />

      {/* Users table */}
      <AdminUsersTable users={users} config={content} />

      {/* Invite panel — only the invite form, no pending/requests sections */}
      <AdminInvitePanel config={content} />
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