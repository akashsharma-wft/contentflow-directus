// app/api/profile/route.ts
// PATCH — update the authenticated user's own profile fields.
//
// Uses the service-role client so the write succeeds regardless of how RLS
// policies are configured on the Supabase project. Auth is still verified via
// the anon-key server client — the service role is only used for the UPDATE
// itself, scoped to the verified user's own row.
//
// Allowed fields: display_name, bio, website, avatar_url
// All other keys in the request body are silently ignored.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createUserClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

function serviceDb() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const ALLOWED_FIELDS = ['display_name', 'bio', 'website', 'avatar_url'] as const
type AllowedField = typeof ALLOWED_FIELDS[number]

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createUserClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as Record<string, unknown>

    const update: Partial<Record<AllowedField, string | null>> = {}
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        const val = body[field]
        update[field] = (typeof val === 'string' && val.length > 0) ? val : null
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const db = serviceDb()
    const { data: updatedProfile, error } = await db
      .from('profiles')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) {
      console.error('profile update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: updatedProfile })
  } catch (err) {
    console.error('profile route unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
