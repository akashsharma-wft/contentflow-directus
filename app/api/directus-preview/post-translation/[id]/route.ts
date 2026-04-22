// app/api/directus-preview/post-translation/[id]/route.ts
//
// Preview redirect for posts_translations rows.
//
// Directus calls this URL when an editor clicks "Preview" in the
// posts_translations collection. The route reads the translation row,
// looks up the parent post slug, then redirects to the correct
// localised frontend URL with ?visual-editing=true appended.
//
// Preview URL to paste into Directus (posts_translations collection):
//   {{NEXT_PUBLIC_SITE_URL}}/api/directus-preview/post-translation/{{id}}

import { NextRequest, NextResponse } from 'next/server'
import { readItem, readItems } from '@directus/sdk'
import { directusAdminClient } from '@/lib/directus/client'
import type { DirectusSchema, DirectusPostTranslationRow } from '@/types/directus'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const numId = Number(id)

  if (!id || isNaN(numId)) {
    return NextResponse.json({ error: 'Invalid translation id' }, { status: 400 })
  }

  try {
    // 1. Fetch the translation row
    const tr = (await directusAdminClient.request(
      readItem('posts_translations' as keyof DirectusSchema, numId),
    )) as unknown as DirectusPostTranslationRow

    // 2. Fetch the parent post slug
    const posts = (await directusAdminClient.request(
      readItems('posts' as keyof DirectusSchema, {
        filter: { id: { _eq: tr.posts_id } } as never,
        fields: ['slug'] as never,
        limit: 1,
      }),
    )) as unknown as { slug: string }[]

    const slug = posts[0]?.slug
    if (!slug) {
      return NextResponse.json({ error: 'Parent post not found' }, { status: 404 })
    }

    // 3. Build the localised frontend path
    // Posts live at /[slug] (English) or /[lang]/[slug] (hi/kn)
    const lang = tr.languages_code
    const path = lang === 'en' ? `/${slug}` : `/${lang}/${slug}`

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    ).replace(/\/$/, '')

    return NextResponse.redirect(`${siteUrl}${path}?visual-editing=true`)
  } catch {
    return NextResponse.json({ error: 'Translation not found' }, { status: 404 })
  }
}
