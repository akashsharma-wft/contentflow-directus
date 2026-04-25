// sections/AdminSection.tsx
import 'server-only'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { AdminDatabase } from '@/types/admin'
import type { SectionAdminContent } from '@/types/cms'
import { AdminUsersTable } from '@/features/admin/components/AdminUsersTable'
import { AdminInvitePanel } from '@/features/admin/components/AdminInvitePanel'
import { DirectusCredentialsCard } from '@/features/admin/components/DirectusCredentialsCard'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttrs } from '@/lib/directus/section-binding'

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

export async function AdminSection({ content = {}, translationId, translationRow }: Props) {
  const users = await getAllUsers()

  // Merge translationRow fields over the content blob so child components
  // get the CMS-driven strings without knowing about translationRow directly.
  const resolvedContent: SectionAdminContent = {
    ...content,
    heading:                translationRow?.admin_heading                  ?? content.heading,
    subheading:             translationRow?.admin_subheading               ?? content.subheading,
    totalUsersLabel:        translationRow?.admin_total_users_label        ?? content.totalUsersLabel,
    proLabel:               translationRow?.admin_pro_label                ?? content.proLabel,
    freeLabel:              translationRow?.admin_free_label               ?? content.freeLabel,
    colUser:                translationRow?.admin_col_user                 ?? content.colUser,
    colPlan:                translationRow?.admin_col_plan                 ?? content.colPlan,
    colRole:                translationRow?.admin_col_role                 ?? content.colRole,
    colJoined:              translationRow?.admin_col_joined               ?? content.colJoined,
    emptyLabel:             translationRow?.admin_empty_label              ?? content.emptyLabel,
    inviteSectionHeading:   translationRow?.admin_invite_heading          ?? content.inviteSectionHeading,
    inviteFormTitle:        translationRow?.admin_invite_form_title       ?? content.inviteFormTitle,
    inviteEmailLabel:       translationRow?.admin_invite_email_label      ?? content.inviteEmailLabel,
    inviteEmailPlaceholder: translationRow?.admin_invite_email_placeholder ?? content.inviteEmailPlaceholder,
    inviteMessageLabel:     translationRow?.admin_invite_message_label    ?? content.inviteMessageLabel,
    inviteSendLabel:        translationRow?.admin_invite_send_label       ?? content.inviteSendLabel,
  }

  return (
    <div
      className="space-y-8"
      data-directus={pageAttrs(translationId,
        'admin_heading', 'admin_subheading',
        'admin_total_users_label', 'admin_pro_label', 'admin_free_label',
        'admin_col_user', 'admin_col_plan', 'admin_col_role', 'admin_col_joined',
        'admin_empty_label',
        'admin_invite_heading', 'admin_invite_form_title',
        'admin_invite_email_label', 'admin_invite_email_placeholder',
        'admin_invite_message_label', 'admin_invite_send_label',
      )}
    >
      {/* Directus dashboard access card — shown at top */}
      <DirectusCredentialsCard />

      {/* Users table */}
      <AdminUsersTable users={users} config={resolvedContent} translationId={translationId} />

      {/* Invite panel — only the invite form, no pending/requests sections */}
      <AdminInvitePanel config={resolvedContent} translationId={translationId} />
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