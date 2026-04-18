import { NextRequest, NextResponse } from 'next/server'
import { readItem, updateItem, deleteItem } from '@directus/sdk'
import { createClient } from '@/lib/supabase/server'
import { directusAdminClient } from '@/lib/directus/client'
import type { DirectusSchema } from '@/types/directus'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ownership check
    const existing = (await directusAdminClient.request(
      readItem('posts' as keyof DirectusSchema, id)
    )) as unknown as { author_id: string } | null

    if (!existing || existing.author_id !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own posts' }, { status: 403 })
    }

    const body = await request.json()
    const { title, excerpt, tags, featured, publishedAt, coverImageUrl, removeCoverImage } = body

    const updateData: Record<string, unknown> = {}

    if (title !== undefined)      updateData.title       = title
    if (excerpt !== undefined)    updateData.excerpt     = excerpt
    if (tags !== undefined)       updateData.tags        = tags
    if (featured !== undefined)   updateData.featured    = featured
    if (publishedAt !== undefined) updateData.published_at = publishedAt

    // Store Supabase Storage URL directly — no re-upload needed
    if (coverImageUrl) {
      updateData.cover_image = coverImageUrl
    } else if (removeCoverImage) {
      updateData.cover_image = null
    }

    await directusAdminClient.request(
      updateItem('posts' as keyof DirectusSchema, id, updateData as never)
    )

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ownership check
    const existing = (await directusAdminClient.request(
      readItem('posts' as keyof DirectusSchema, id)
    )) as unknown as { author_id: string } | null

    if (!existing || existing.author_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own posts' }, { status: 403 })
    }

    await directusAdminClient.request(
      deleteItem('posts' as keyof DirectusSchema, id)
    )

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
