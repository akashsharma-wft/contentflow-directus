import { NextRequest, NextResponse } from 'next/server'
import { readItem, updateItem, deleteItem, readItems, createItem } from '@directus/sdk'
import { createClient } from '@/lib/supabase/server'
import { directusAdminClient } from '@/lib/directus/client'
import type { DirectusSchema, DirectusPostTranslationRow } from '@/types/directus'

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
    const { title, excerpt, tags, featured, publishedAt, coverImageUrl, removeCoverImage, language } = body
    const lang = language ?? 'en'

    // ── Update parent (non-translatable fields) ───────────────────────────────
    const parentUpdate: Record<string, unknown> = {}
    if (tags !== undefined)       parentUpdate.tags        = tags
    if (featured !== undefined)   parentUpdate.featured    = featured
    if (publishedAt !== undefined) parentUpdate.published_at = publishedAt
    if (coverImageUrl)            parentUpdate.cover_image = coverImageUrl
    else if (removeCoverImage)    parentUpdate.cover_image = null

    if (Object.keys(parentUpdate).length) {
      // fields:['id'] prevents Directus selecting the translations alias as a SQL column
      await directusAdminClient.request(
        updateItem('posts' as keyof DirectusSchema, id, parentUpdate as never, { fields: ['id'] } as never)
      )
    }

    // ── Upsert translation (translatable fields) ──────────────────────────────
    if (title !== undefined || excerpt !== undefined) {
      const trRows = (await directusAdminClient.request(
        readItems('posts_translations' as keyof DirectusSchema, {
          filter: { posts_id: { _eq: id }, languages_code: { _eq: lang } } as never,
          fields: ['id'] as never,
          limit: 1,
        } as never)
      )) as unknown as DirectusPostTranslationRow[]

      const trUpdate: Record<string, unknown> = {}
      if (title !== undefined)   trUpdate.title   = title
      if (excerpt !== undefined) trUpdate.excerpt  = excerpt

      if (trRows.length) {
        await directusAdminClient.request(
          updateItem('posts_translations' as keyof DirectusSchema, trRows[0].id, trUpdate as never)
        )
      } else {
        await directusAdminClient.request(
          createItem('posts_translations' as keyof DirectusSchema, {
            posts_id: id,
            languages_code: lang,
            title: title ?? '',
            excerpt: excerpt ?? '',
            body: null,
            seo_title: null,
            seo_description: null,
          } as never)
        )
      }
    }

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

    // Delete parent — cascade deletes posts_translations rows
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
