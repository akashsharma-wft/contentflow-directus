// app/api/directus-preview/page-translation/[id]/route.ts
//
// Preview redirect for pages_translations rows.
//
// Directus calls this URL when an editor clicks "Preview" in the
// pages_translations collection. The route reads the translation row,
// looks up the parent page slug, then redirects to the correct
// localised frontend URL with ?visual-editing=true appended so the
// VisualEditingBridge activates on arrival.
//
// Preview URL to paste into Directus (pages_translations collection):
//   {{NEXT_PUBLIC_SITE_URL}}/api/directus-preview/page-translation/{{id}}

import { NextRequest, NextResponse } from 'next/server'
import { readItem, readItems } from '@directus/sdk'
import { directusAdminClient } from '@/lib/directus/client'
import type { DirectusSchema, DirectusPageTranslationRow } from '@/types/directus'

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
      readItem('pages_translations' as keyof DirectusSchema, numId),
    )) as unknown as DirectusPageTranslationRow

    // 2. Fetch the parent page slug
    const pages = (await directusAdminClient.request(
      readItems('pages' as keyof DirectusSchema, {
        filter: { id: { _eq: tr.pages_id } } as never,
        fields: ['slug'] as never,
        limit: 1,
      }),
    )) as unknown as { slug: string }[]

    const slug = pages[0]?.slug
    if (!slug) {
      return NextResponse.json({ error: 'Parent page not found' }, { status: 404 })
    }

    // 3. Build the localised frontend path
    const lang = tr.languages_code
    let path: string
    if (lang === 'en') {
      path = slug === 'home' ? '/' : `/${slug}`
    } else {
      path = slug === 'home' ? `/${lang}` : `/${lang}/${slug}`
    }

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    ).replace(/\/$/, '')

    return NextResponse.redirect(`${siteUrl}${path}?visual-editing=true`)
  } catch {
    return NextResponse.json({ error: 'Translation not found' }, { status: 404 })
  }
}
