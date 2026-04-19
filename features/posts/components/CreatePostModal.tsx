'use client'

import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { X, Upload, Plus, Loader2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { usePostHog } from 'posthog-js/react'

interface CreatePostModalProps {
  open: boolean
  onClose: () => void
  lang?: string
}

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState('')

  function addTag() {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-[#0d0e14] border border-white/10 rounded-xl min-h-10.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs rounded-md"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-indigo-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag()
          }
        }}
        onBlur={addTag}
        placeholder={tags.length === 0 ? 'Add tags (press Enter)...' : ''}
        className="flex-1 min-w-25 bg-transparent outline-none text-white/70 text-xs placeholder:text-white/20"
      />
    </div>
  )
}

export function CreatePostModal({ open, onClose, lang = 'en' }: CreatePostModalProps) {
  const queryClient = useQueryClient()
  const coverImageRef = useRef<HTMLInputElement>(null)
  const posthog = usePostHog()

  const [title, setTitle]           = useState('')
  const [excerpt, setExcerpt]       = useState('')
  const [tags, setTags]             = useState<string[]>([])
  const [featured, setFeatured]     = useState(false)
  const [publishNow, setPublishNow] = useState(true)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile]   = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-generate slug from title
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image')
      return
    }
    setCoverFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleClose() {
    if (isSubmitting) return
    setTitle('')
    setExcerpt('')
    setTags([])
    setFeatured(false)
    setPublishNow(true)
    setCoverPreview(null)
    setCoverFile(null)
    onClose()
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    setIsSubmitting(true)

    try {
      let coverImageUrl: string | undefined

      // If cover image selected, upload to Supabase first to get a URL
      // The API route handles the upload to Directus files
      if (coverFile) {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const path = `covers/${user.id}-${Date.now()}.${coverFile.name.split('.').pop()}`
          const { error } = await supabase.storage
            .from('contentflow')
            .upload(path, coverFile, { upsert: true })

          if (!error) {
            const { data: { publicUrl } } = supabase.storage
              .from('contentflow')
              .getPublicUrl(path)
            coverImageUrl = publicUrl
          }
        }
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim(),
          tags,
          featured,
          publishedAt: publishNow ? new Date().toISOString() : null,
          coverImageUrl,
          language: lang,
        }),
      })

      const data = await response.json()

      if (response.status === 403 && data.limitReached) {
        toast.error('Post limit reached — upgrade to Pro for unlimited posts', {
          action: {
            label: 'Upgrade',
            onClick: () => window.location.href = '/billing',
          },
        })
        return
      }

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create post')
      }

      // ['posts'] prefix hits both ['posts','all',lang] and ['posts','stats',lang].
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Post created successfully!')
      posthog?.capture('post_created', {
      title: title.trim(),
      featured,
      published: !!publishNow,
      has_cover: !!coverFile,
      tag_count: tags.length,
    })
      handleClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      {/* Modal */}
      <div className="w-full max-w-3xl bg-[#13141c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Plus size={14} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white text-sm font-semibold">New Post</h2>
              <p className="text-white/30 text-[10px]">Content &gt; Blog Posts &gt; Create</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white/30 hover:text-white/70 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] divide-y lg:divide-y-0 lg:divide-x divide-white/5">

            {/* Left — main fields */}
            <div className="p-5 space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-white/40 text-[10px] uppercase tracking-widest font-medium">
                  Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title..."
                  disabled={isSubmitting}
                  className="bg-[#0d0e14] border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl text-base focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/40 text-[10px] uppercase tracking-widest font-medium">
                  Slug
                </Label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-[#0d0e14] border border-white/5 rounded-xl">
                  <span className="text-white/20 text-xs font-mono shrink-0">/{' '}</span>
                  <span className="text-white/40 text-xs font-mono truncate">
                    {slug || <span className="text-white/20 italic">auto-generated from title</span>}
                  </span>
                </div>
              </div>

              {/* Body / Excerpt */}
              <div className="space-y-1.5">
                <Label className="text-white/40 text-[10px] uppercase tracking-widest font-medium">
                  Excerpt / Body
                </Label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Write a brief summary or the post body..."
                  disabled={isSubmitting}
                  rows={6}
                  className="w-full px-3 py-2.5 bg-[#0d0e14] border border-white/10 rounded-xl text-white/70 text-sm placeholder:text-white/20 outline-none focus:border-indigo-500/40 transition-colors resize-none"
                />
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <Label className="text-white/40 text-[10px] uppercase tracking-widest font-medium">
                  Tags
                </Label>
                <TagInput tags={tags} onChange={setTags} />
                <p className="text-white/20 text-[10px]">Press Enter or comma to add a tag</p>
              </div>
            </div>

            {/* Right — sidebar fields */}
            <div className="p-5 space-y-4">
              {/* Featured toggle */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-white/60 text-sm font-medium flex items-center gap-1.5">
                    <Star size={13} className={featured ? 'text-amber-400 fill-amber-400' : 'text-white/30'} />
                    Featured
                  </p>
                  <p className="text-white/25 text-[10px] mt-0.5">Show in hero section</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFeatured(!featured)}
                  className={cn(
                    'relative w-10 h-5.5 rounded-full transition-all cursor-pointer shrink-0',
                    featured ? 'bg-indigo-500' : 'bg-white/10'
                  )}
                  style={{ height: '22px', width: '40px' }}
                >
                  <span className={cn(
                    'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm',
                    featured ? 'left-5' : 'left-0.5'
                  )} />
                </button>
              </div>

              {/* Publish toggle */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-white/60 text-sm font-medium">Publish now</p>
                  <p className="text-white/25 text-[10px] mt-0.5">Set publishedAt to now</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPublishNow(!publishNow)}
                  className={cn(
                    'relative rounded-full transition-all cursor-pointer shrink-0',
                    publishNow ? 'bg-indigo-500' : 'bg-white/10'
                  )}
                  style={{ height: '22px', width: '40px' }}
                >
                  <span className={cn(
                    'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm',
                    publishNow ? 'left-5' : 'left-0.5'
                  )} />
                </button>
              </div>

              {/* Cover image */}
              <div className="space-y-1.5">
                <Label className="text-white/40 text-[10px] uppercase tracking-widest font-medium">
                  Cover Image
                </Label>
                <div
                  onClick={() => coverImageRef.current?.click()}
                  className={cn(
                    'relative aspect-video rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden',
                    coverPreview
                      ? 'border-indigo-500/30'
                      : 'border-white/10 hover:border-white/20'
                  )}
                >
                  {coverPreview ? (
                    <>
                      <Image
                        src={coverPreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        height={200}
                        width={400}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs font-medium">Change Image</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <Upload size={14} className="text-white/30" />
                      </div>
                      <p className="text-white/30 text-xs text-center">
                        Click to upload<br />
                        <span className="text-white/20 text-[10px]">Recommended: 1200×630px</span>
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={coverImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverChange}
                />
              </div>

              {/* Excerpt preview */}
              <div className="space-y-1.5">
                <Label className="text-white/40 text-[10px] uppercase tracking-widest font-medium">
                  Excerpt
                </Label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary of the post..."
                  rows={3}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-[#0d0e14] border border-white/10 rounded-xl text-white/60 text-xs placeholder:text-white/20 outline-none focus:border-indigo-500/40 transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/5 shrink-0">
          <p className="text-white/20 text-[10px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Changes saved to Directus on publish
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-white/40 hover:text-white/70 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer',
                'bg-indigo-500 hover:bg-indigo-600 text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSubmitting && <Loader2 size={13} className="animate-spin" />}
              {isSubmitting ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}