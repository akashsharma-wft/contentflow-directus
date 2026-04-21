// app/api/admin/request-access/route.ts
// POST — authenticated non-admin user requests admin access.
//
// Auth:   must be authenticated (any role)
// Body:   { message?: string }
// Effect: inserts a row in admin_invites (type='request', status='pending')
//
// Returns 409 if the user already has a pending request.

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
    // ── 1. Auth check ────────────────────────────────────────────────────────
    const supabase = await createUserClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── 2. Make sure they are not already an admin ───────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      return NextResponse.json(
        { error: 'You are already an admin' },
        { status: 409 }
      )
    }

    const email = profile?.email ?? user.email ?? ''

    // ── 3. Parse optional message ────────────────────────────────────────────
    let message: string | null = null
    try {
      const body = await request.json()
      message = body.message?.trim() || null
    } catch {
      // body is optional
    }

    const db = adminDb()

    // ── 4. Check for existing pending request from this user ─────────────────
    const { data: existing } = await db
      .from('admin_invites')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('type', 'request')
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'You already have a pending access request' },
        { status: 409 }
      )
    }

    // ── 5. Insert request row ────────────────────────────────────────────────
    const { data: row, error: insertError } = await db
      .from('admin_invites')
      .insert({
        email,
        user_id: user.id,
        type:    'request',
        status:  'pending',
        message,
      })
      .select()
      .single()

    if (insertError) {
      console.error('admin/request-access insert error:', insertError)
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
    }

    return NextResponse.json({ success: true, request: row })
  } catch (err) {
    console.error('admin/request-access unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
