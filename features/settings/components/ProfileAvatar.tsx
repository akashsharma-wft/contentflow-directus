// features/settings/components/ProfileAvatar.tsx
'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface ProfileAvatarProps {
  avatarUrl: string | null
  displayName: string | null
  userId: string
  onUploadComplete: (url: string, profile?: Record<string, unknown>) => void
  uploadLabel?: string
}

export function ProfileAvatar({
  avatarUrl,
  displayName,
  userId,
  onUploadComplete,
  uploadLabel = 'Upload photo',
}: ProfileAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const initials = displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'CF'

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }

    setIsUploading(true)
    setUploadProgress(30)

    try {
      const supabase = createClient()
      const filePath = `avatars/${userId}-avatar.png`
      setUploadProgress(50)

      const { error: uploadError } = await supabase.storage
        .from('contentflow')
        .upload(filePath, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError

      setUploadProgress(80)
      const { data: { publicUrl } } = supabase.storage.from('contentflow').getPublicUrl(filePath)
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`
      setUploadProgress(100)

      const updateRes = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: urlWithCacheBust }),
      })
      const updateJson = await updateRes.json().catch(() => ({}))
      if (!updateRes.ok) {
        throw new Error((updateJson as { error?: string }).error || 'Failed to save avatar')
      }

      onUploadComplete(urlWithCacheBust, (updateJson as { profile?: Record<string, unknown> }).profile)
      toast.success('Photo updated')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center justify-between px-5 py-4 bg-[#13141c] border border-white/5 rounded-2xl">
      <div className="flex items-center gap-4">
        <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
          <Avatar className="w-16 h-16 ring-2 ring-white/10 group-hover:ring-indigo-500/50 transition-all">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName ?? ''} />}
            <AvatarFallback className="bg-indigo-500 text-white text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload size={14} className="text-white" />
          </div>
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{displayName ?? 'User'}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/8 border border-white/10 text-white/60 hover:text-white text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
      >
        {isUploading ? `Uploading ${uploadProgress}%` : uploadLabel}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}