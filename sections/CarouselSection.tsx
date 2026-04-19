'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type ImgSrc = string | { asset?: { _ref?: string } } | null | undefined
function resolveImg(src: ImgSrc): string { return typeof src === 'string' ? src : '' }

interface Slide {
  _key?: string
  image?: ImgSrc
  heading?: string
  body?: string
  ctaLabel?: string
  ctaHref?: string
}

interface CarouselSectionProps {
  section: {
    heading?: string
    slides?: Slide[]
    autoplay?: boolean
    showDots?: boolean
    showArrows?: boolean
  }
}

export function CarouselSection({ section }: CarouselSectionProps) {
  const { heading, slides = [], autoplay = false, showDots = true, showArrows = true } = section
  const [current, setCurrent] = useState(0)

  const prev = useCallback(() => setCurrent((i: number) => (i === 0 ? slides.length - 1 : i - 1)), [slides.length])
  const next = useCallback(() => setCurrent((i: number) => (i === slides.length - 1 ? 0 : i + 1)), [slides.length])

  useEffect(() => {
    if (!autoplay || slides.length < 2) return
    const id = setInterval(next, 4000)
    return () => clearInterval(id)
  }, [autoplay, slides.length, next])

  if (slides.length === 0) return null
  const slide = slides[current]

  return (
    <section className="py-16 px-6 bg-[#0d0e14]">
      <div className="max-w-5xl mx-auto">
        {heading && <h2 className="text-3xl font-bold text-white text-center mb-10">{heading}</h2>}

        <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-white/2">
          {/* Slide */}
          <div className="relative aspect-[16/7] w-full">
            {resolveImg(slide.image) && (
              <Image
                src={resolveImg(slide.image)}
                alt={slide.heading ?? ''}
                fill
                className="object-cover"
              />
            )}
            {/* Overlay content */}
            {(slide.heading || slide.body || slide.ctaHref) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-8">
                {slide.heading && <h3 className="text-white text-2xl font-bold mb-2">{slide.heading}</h3>}
                {slide.body && <p className="text-white/70 text-sm mb-4 max-w-xl">{slide.body}</p>}
                {slide.ctaHref && slide.ctaLabel && (
                  <Link
                    href={slide.ctaHref}
                    className="inline-flex w-fit items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    {slide.ctaLabel}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Arrows */}
          {showArrows && slides.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/70 hover:text-white transition-colors backdrop-blur-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/70 hover:text-white transition-colors backdrop-blur-sm"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {showDots && slides.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${i === current ? 'w-6 bg-indigo-400' : 'w-1.5 bg-white/20'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
