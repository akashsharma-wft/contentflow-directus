'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { pageAttr } from '@/lib/directus/section-binding'

type ImgSrc = string | { asset?: { _ref?: string } } | null | undefined
function resolveImg(src: ImgSrc): string { return typeof src === 'string' ? src : '' }

interface VideoSectionProps {
  section: {
    heading?: string
    subheading?: string
    url: string
    posterImage?: ImgSrc
    maxWidth?: 'medium' | 'wide' | 'full'
  }
  translationId?: number
}

const maxWidthClass: Record<string, string> = {
  medium: 'max-w-3xl',
  wide: 'max-w-5xl',
  full: 'max-w-none',
}

function getEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`
  const vmMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1`
  return url
}

export function VideoSection({ section, translationId }: VideoSectionProps) {
  const { heading, subheading, url, posterImage, maxWidth = 'wide' } = section
  const [playing, setPlaying] = useState(false)
  const embedUrl = getEmbedUrl(url)
  const posterUrl = resolveImg(posterImage)

  return (
    <section className="py-16 px-6 bg-[#0d0e14]" data-directus={pageAttr(translationId, 'sections')}>
      <div className={`mx-auto ${maxWidthClass[maxWidth]}`}>
        {(heading || subheading) && (
          <div className="text-center mb-8">
            {heading && <h2 className="text-3xl font-bold text-white mb-3">{heading}</h2>}
            {subheading && <p className="text-white/50">{subheading}</p>}
          </div>
        )}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/40 border border-white/8">
          {playing ? (
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 w-full h-full flex items-center justify-center group"
            >
              {posterUrl && (
                <Image
                  src={posterUrl}
                  alt="Video thumbnail"
                  fill
                  className="object-cover"
                />
              )}
              <div className="relative z-10 w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                <Play size={24} className="text-white ml-1" />
              </div>
              <div className="absolute inset-0 bg-black/30" />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
