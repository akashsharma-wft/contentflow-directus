// app/api/directus-preview/page/[id]/route.ts
//
// Preview redirect for the parent `pages` collection.
// Directus calls this when an editor clicks "Preview" on a page item.
// {{id}} here is the page UUID.
//
// Paste into Directus → Settings → Data Model → pages → Preview URL:
//   {{NEXT_PUBLIC_SITE_URL}}/api/directus-preview/page/{{id}}

import { NextRequest, NextResponse } from 'next/server'
import { readItem } from '@directus/sdk'
import { directusAdminClient } from '@/lib/directus/client'
import { generatePreviewMagicLink } from '@/lib/directus/previewAuth'
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

    const path = slug === 'home' ? '/' : `/${slug}`

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    ).replace(/\/$/, '')

    const previewSecret = process.env.DIRECTUS_PREVIEW_SECRET ?? ''
    const url = new URL(`${siteUrl}${path}`)
    url.searchParams.set('visual-editing', 'true')
    if (previewSecret) url.searchParams.set('preview_token', previewSecret)

    const dest = (await generatePreviewMagicLink(url.toString())) ?? url.toString()
    return NextResponse.redirect(dest)
  } catch {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }
}