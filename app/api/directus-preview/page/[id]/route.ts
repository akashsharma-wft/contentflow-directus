// app/api/directus-preview/page/[id]/route.ts
//
// Preview redirect for the parent `pages` collection.
// Directus calls this when an editor clicks "Preview" on a page item.
// {{id}} here is the page UUID (e.g. 6f7e709d-ab77-408c-8f93-ea99813b7437).
//
// Paste into Directus → Settings → Data Model → pages → Preview URL:
//   {{NEXT_PUBLIC_SITE_URL}}/api/directus-preview/page/{{id}}

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
    return NextResponse.json({ error: 'Missing page id' }, { status: 400 })
  }

  try {
    const page = (await directusAdminClient.request(
      readItem('pages' as keyof DirectusSchema, id, {
        fields: ['slug'] as never,
      }),
    )) as unknown as { slug: string }

    const slug = page?.slug
    if (!slug) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Default to English preview — slug 'home' lives at /
    const path = slug === 'home' ? '/' : `/${slug}`

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    ).replace(/\/$/, '')

    return NextResponse.redirect(`${siteUrl}${path}?visual-editing=true`)
  } catch {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }
}