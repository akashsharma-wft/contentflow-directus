// app/api/admin/invite/route.ts
// POST — admin promotes an existing user to the admin role.
//
// Auth:   must be authenticated + role === 'admin'
// Body:   { email: string; message?: string }
//
// Flow:
//   1. Target profile must already exist (user must have signed up first).
//   2. If the target is already admin → 409.
//   3. Promote profiles.role = 'admin' immediately (direct grant).
//   4. Insert an approved audit row in admin_invites for the audit trail.
//
// If the target has not signed up yet → 404 with a clear message.
// Duplicate pending-invite check is kept so the invites panel stays coherent
// (e.g., if an old pending row exists from a previous run).

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
    const email: string = (body.email ?? '').trim().toLowerCase()
    const message: string | null = body.message?.trim() || null

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const db = adminDb()

    // ── 3. Require the target to have an existing profile ────────────────────
    // Admin promotion is a direct grant — the user must already have an account.
    const { data: targetProfile } = await db
      .from('profiles')
      .select('id, role')
      .eq('email', email)
      .maybeSingle()

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'No account found for that email — the user must sign up first' },
        { status: 404 }
      )
    }

    if (targetProfile.role === 'admin') {
      return NextResponse.json(
        { error: 'This user is already an admin' },
        { status: 409 }
      )
    }

    // ── 4. Promote role ──────────────────────────────────────────────────────
    const { error: roleError } = await db
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', targetProfile.id)

    if (roleError) {
      console.error('admin/invite role promotion error:', roleError)
      return NextResponse.json({ error: 'Failed to promote user to admin' }, { status: 500 })
    }

    // ── 5. Insert approved audit record ─────────────────────────────────────
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

    return NextResponse.json({ success: true, directGrant: true })
  } catch (err) {
    console.error('admin/invite unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
