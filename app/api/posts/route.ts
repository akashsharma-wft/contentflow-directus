import { NextRequest, NextResponse } from 'next/server'
import { createItem, readItems, aggregate } from '@directus/sdk'
import { createClient } from '@/lib/supabase/server'
import { directusAdminClient } from '@/lib/directus/client'
import type { DirectusSchema, DirectusPostRow } from '@/types/directus'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = (await directusAdminClient.request(
      readItems('posts' as keyof DirectusSchema, {
        filter: { author_id: { _eq: user.id } } as never,
        sort: ['-date_updated'] as never,
      } as never)
    )) as unknown as DirectusPostRow[]

    const posts = rows.map(r => ({
      _id:         r.id,
      title:       r.title,
      slug:        r.slug,
      excerpt:     r.excerpt ?? null,
      publishedAt: r.published_at ?? null,
      featured:    r.featured ?? false,
      tags:        Array.isArray(r.tags) ? r.tags : [],
      authorId:    r.author_id ?? null,
      authorName:  r.author_name ?? null,
      authorEmail: r.author_email ?? null,
      authorAvatar:r.author_avatar ?? null,
      coverImage:  r.cover_image ?? null,
      language:    r.language ?? 'en',
      status:      r.published_at ? 'published' : 'draft',
    }))

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

    const postData: Record<string, unknown> = {
      title: title.trim(),
      slug,
      language: language ?? 'en',
      excerpt: excerpt?.trim() ?? '',
      featured: featured ?? false,
      tags: (tags ?? []).filter(Boolean),
      author_id: user.id,
      author_name: profile?.display_name ?? user.email ?? 'Anonymous',
      author_email: user.email ?? '',
      author_avatar: profile?.avatar_url ?? null,
      // Initial body: single paragraph with excerpt text
      body: [{
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
      }],
    }

    if (publishedAt) {
      postData.published_at = new Date(publishedAt).toISOString()
    }

    // Store Supabase Storage URL directly — no re-upload needed
    if (coverImageUrl) {
      postData.cover_image = coverImageUrl
    }

    const created = (await directusAdminClient.request(
      createItem('posts' as keyof DirectusSchema, postData as never)
    )) as unknown as { id: string }

    return NextResponse.json({ success: true, postId: created.id, slug })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create post'
    console.error('Post creation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
