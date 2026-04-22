import { NextRequest, NextResponse } from 'next/server'
import { readItems, createItem, aggregate } from '@directus/sdk'
import { createClient } from '@/lib/supabase/server'
import { directusAdminClient } from '@/lib/directus/client'
import { mergePost } from '@/types/directus'
import type { DirectusSchema, DirectusPostRow, DirectusPostTranslationRow } from '@/types/directus'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lang = request.nextUrl.searchParams.get('lang') ?? 'en'

    const rows = (await directusAdminClient.request(
      readItems('posts' as keyof DirectusSchema, {
        filter: { author_id: { _eq: user.id } } as never,
        sort: ['-date_updated'] as never,
        fields: ['id', 'slug', 'cover_image', 'published_at', 'featured', 'tags',
                 'author_id', 'author_name', 'author_email', 'author_avatar',
                 'date_created', 'date_updated'] as never,
      } as never)
    )) as unknown as DirectusPostRow[]

    // Fetch translations for the requested language first, fall back to 'en'
    const ids = rows.map(r => r.id)
    const trs = ids.length
      ? (await directusAdminClient.request(
          readItems('posts_translations' as keyof DirectusSchema, {
            filter: { posts_id: { _in: ids }, languages_code: { _in: [lang, 'en'] } } as never,
            fields: ['id', 'posts_id', 'languages_code', 'title', 'excerpt', 'body',
                     'seo_title', 'seo_description'] as never,
            limit: -1 as never,
          } as never)
        )) as unknown as DirectusPostTranslationRow[]
      : []

    const rowsWithTrs: DirectusPostRow[] = rows.map(row => ({
      ...row,
      translations: trs.filter(t => t.posts_id === row.id),
    }))

    const posts = rowsWithTrs.map(row => {
      const p = mergePost(row, lang)
      return {
        _id:         p._id,
        title:       p.title,
        slug:        p.slug,
        excerpt:     p.excerpt ?? null,
        publishedAt: p.publishedAt ?? null,
        featured:    p.featured ?? false,
        tags:        Array.isArray(p.tags) ? p.tags : [],
        authorId:    p.authorId ?? null,
        authorName:  p.authorName ?? null,
        authorEmail: p.authorEmail ?? null,
        authorAvatar:p.authorAvatar ?? null,
        coverImage:  p.coverImage ?? null,
        language:    p.language ?? 'en',
        status:      p.publishedAt ? 'published' : 'draft',
      }
    })

    return NextResponse.json(posts)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch posts'
    console.error('Posts fetch error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, subscription_tier')
      .eq('id', user.id)
      .single()

    const body = await request.json()
    const { title, excerpt, tags, featured, publishedAt, coverImageUrl, language } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Subscription limit check (free = 5 published posts)
    if (publishedAt && profile?.subscription_tier !== 'pro') {
      const result = (await directusAdminClient.request(
        aggregate('posts' as keyof DirectusSchema, {
          aggregate: { count: '*' },
          query: { filter: { author_id: { _eq: user.id }, published_at: { _nnull: true } } },
        } as never)
      )) as unknown as { count: { '*': string } }[]
      const currentCount = Number(result[0]?.count?.['*']) ?? 0
      if (currentCount >= 5) {
        return NextResponse.json({
          error: 'Post limit reached. Free plan allows 5 posts. Upgrade to Pro for unlimited posts.',
          limitReached: true,
        }, { status: 403 })
      }
    }

    // Derive slug from title
    const slug = title.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      || `post-${Date.now()}`

    const lang = language ?? 'en'

    // Initial body block from excerpt
    const bodyBlocks = [{
      _type: 'block',
      _key: `block-${Date.now()}`,
      style: 'normal',
      children: [{
        _type: 'span',
        _key: `span-${Date.now()}`,
        text: excerpt ?? '',
        marks: [],
      }],
      markDefs: [],
    }]

    // Create parent post. Pass fields:['id'] to avoid Directus selecting the
    // translations alias field as a real SQL column in the post-write response.
    const parentData: Record<string, unknown> = {
      slug,
      featured: featured ?? false,
      tags: (tags ?? []).filter(Boolean),
      author_id: user.id,
      author_name: profile?.display_name ?? user.email ?? 'Anonymous',
      author_email: user.email ?? '',
      author_avatar: profile?.avatar_url ?? null,
    }

    if (publishedAt) {
      parentData.published_at = new Date(publishedAt).toISOString()
    }

    if (coverImageUrl) {
      parentData.cover_image = coverImageUrl
    }

    const created = (await directusAdminClient.request(
      createItem('posts' as keyof DirectusSchema, parentData as never, { fields: ['id'] } as never)
    )) as unknown as { id: string }

    // Create the translation row separately
    await directusAdminClient.request(
      createItem('posts_translations' as keyof DirectusSchema, {
        posts_id: created.id,
        languages_code: lang,
        title: title.trim(),
        excerpt: excerpt?.trim() ?? '',
        body: bodyBlocks,
        seo_title: null,
        seo_description: null,
      } as never as DirectusPostTranslationRow)
    )

    return NextResponse.json({ success: true, postId: created.id, slug })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create post'
    console.error('Post creation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
