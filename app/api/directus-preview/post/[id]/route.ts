// app/api/directus-preview/post/[id]/route.ts
//
// Preview redirect for the parent `posts` collection.
// Directus calls this when an editor clicks "Preview" on a post item.
// {{id}} here is the post UUID.
//
// Paste into Directus → Settings → Data Model → posts → Preview URL:
//   {{NEXT_PUBLIC_SITE_URL}}/api/directus-preview/post/{{id}}

import { NextRequest, NextResponse } from 'next/server'
import { readItem } from '@directus/sdk'
import { directusAdminClient } from '@/lib/directus/client'
import type { DirectusSchema } from '@/types/directus'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Missing post id' }, { status: 400 })
  }

  try {
    const post = (await directusAdminClient.request(
      readItem('posts' as keyof DirectusSchema, id, {
        fields: ['slug'] as never,
      }),
    )) as unknown as { slug: string }

    const slug = post?.slug
    if (!slug) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const path = `/${slug}`

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    ).replace(/\/$/, '')

    const previewSecret = process.env.DIRECTUS_PREVIEW_SECRET ?? ''
    const url = new URL(`${siteUrl}${path}`)
    url.searchParams.set('visual-editing', 'true')
    if (previewSecret) url.searchParams.set('preview_token', previewSecret)

    return NextResponse.redirect(url.toString())
  } catch {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
}