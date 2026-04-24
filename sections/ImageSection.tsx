'use client'
import Image from 'next/image'
import { pageAttr } from '@/lib/directus/section-binding'

type ImgSrc = string | { asset?: { _ref?: string } } | null | undefined
function resolveImg(src: ImgSrc): string { return typeof src === 'string' ? src : '' }

interface ImageSectionProps {
  section: {
    image: ImgSrc
    alt: string
    caption?: string
    maxWidth?: 'narrow' | 'medium' | 'wide' | 'full'
    rounded?: boolean
    shadow?: boolean
  }
  translationId?: number
}

const maxWidthClass: Record<string, string> = {
  narrow: 'max-w-xl',
  medium: 'max-w-3xl',
  wide: 'max-w-5xl',
  full: 'max-w-none',
}

export function ImageSection({ section, translationId }: ImageSectionProps) {
  const { image, alt, caption, maxWidth = 'wide', rounded = true, shadow = false } = section
  const url = resolveImg(image)
  if (!url) return null
  return (
    <section className="py-12 px-6 bg-[#0d0e14]" data-directus={pageAttr(translationId, 'sections')}>
      <div className={`mx-auto ${maxWidthClass[maxWidth]}`}>
        <div className={`relative w-full aspect-video overflow-hidden ${rounded ? 'rounded-2xl' : ''} ${shadow ? 'shadow-2xl shadow-black/50' : ''}`}>
          <Image
            src={url}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 80vw"
          />
        </div>
        {caption && (
          <p className="text-center text-white/30 text-xs font-mono mt-3">{caption}</p>
        )}
      </div>
    </section>
  )
}
