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

    // Posts live at /[slug] in English
    const path = `/${slug}`

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    ).replace(/\/$/, '')

    return NextResponse.redirect(`${siteUrl}${path}?visual-editing=true`)
  } catch {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
}