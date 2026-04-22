import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createUserClient } from '@/lib/supabase/server'
import type { AdminDatabase } from '@/types/admin'

function adminDb() {
  return createClient<AdminDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function inviteToDirectus(email: string): Promise<{ ok: boolean; error?: string }> {
  const roleId = process.env.DIRECTUS_ADMINISTRATOR_ROLE_ID ?? ''
  const adminToken = process.env.DIRECTUS_ADMIN_TOKEN        ?? ''
  const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL   ?? ''

  if (!roleId) {
    console.warn('[admin/invite] DIRECTUS_ADMINISTRATOR_ROLE_ID not set — skipping Directus invite')
    return { ok: true }
  }

  try {
    const res = await fetch(`${directusUrl}/users/invite`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ email, role: roleId }),
    })

    if (res.ok) return { ok: true }

    const body = await res.json().catch(() => ({}))
    const msg: string = body?.errors?.[0]?.message ?? ''

    // Already a Directus user — not an error
    if (res.status === 400 && msg.toLowerCase().includes('already')) return { ok: true }

    console.error('[admin/invite] Directus invite failed:', res.status, msg)
    return { ok: false, error: msg || `Directus returned ${res.status}` }
  } catch (err) {
    console.error('[admin/invite] Directus invite fetch error:', err)
    return { ok: false, error: 'Could not reach Directus' }
  }
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth + admin role check ───────────────────────────────────────────
    const supabase = await createUserClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    // ── 2. Validate body ─────────────────────────────────────────────────────
    const body = await request.json()
    const email: string   = (body.email ?? '').trim().toLowerCase()
    const message: string | null = body.message?.trim() || null

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const db = adminDb()

    // ── 3. Target must have a ContentFlow account ────────────────────────────
    const { data: targetProfile } = await db
      .from('profiles')
      .select('id, role')
      .eq('email', email)
      .maybeSingle()

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'No account found for that email — the user must sign up on ContentFlow first' },
        { status: 404 }
      )
    }

    if (targetProfile.role === 'admin') {
      return NextResponse.json({ error: 'This user is already an admin' }, { status: 409 })
    }

    // ── 4. Promote Supabase role ─────────────────────────────────────────────
    const { error: roleError } = await db
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', targetProfile.id)

    if (roleError) {
      console.error('admin/invite role promotion error:', roleError)
      return NextResponse.json({ error: 'Failed to promote user to admin' }, { status: 500 })
    }

    // ── 5. Invite to Directus (non-blocking) ─────────────────────────────────
    const directusResult = await inviteToDirectus(email)

    // ── 6. Audit record ──────────────────────────────────────────────────────
    await db.from('admin_invites').insert({
      email,
      user_id:     targetProfile.id,
      type:        'invite',
      status:      'approved',
      message,
      invited_by:  user.id,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success:         true,
      directGrant:     true,
      directusInvited: directusResult.ok,
      ...(directusResult.ok ? {} : { directusWarning: directusResult.error }),
    })
  } catch (err) {
    console.error('admin/invite unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}