import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { CtaSection as CtaSectionType } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'

interface Props {
  section: CtaSectionType
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function CtaSection({ section }: Props) {
  const {
    heading,
    body,
    primaryButton,
    secondaryButton,
    theme = 'indigo',
    centered = true,
  } = section

  return (
    <section
      className={cn(
        'w-full px-6 py-16',
        theme === 'dark' && 'bg-[#13141c]',
        theme === 'indigo' && 'bg-indigo-500/10 border-y border-indigo-500/20',
        theme === 'subtle' && 'bg-transparent border border-white/10 rounded-2xl'
      )}
    >
      <div
        className={cn(
          'max-w-2xl space-y-6',
          centered ? 'mx-auto text-center' : ''
        )}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          {heading}
        </h2>

        {body && (
          <p className="text-white/55 text-lg leading-relaxed">{body}</p>
        )}

        {(primaryButton?.label || secondaryButton?.label) && (
          <div
            className={cn(
              'flex gap-4 flex-wrap',
              centered ? 'justify-center' : ''
            )}
          >
            {primaryButton?.label && primaryButton?.href && (
              <Link
                href={primaryButton.href}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                {primaryButton.label}
              </Link>
            )}
            {secondaryButton?.label && secondaryButton?.href && (
              <Link
                href={secondaryButton.href}
                className="px-6 py-3 border border-white/15 text-white/70 hover:border-white/30 hover:text-white font-semibold rounded-xl transition-colors text-sm"
              >
                {secondaryButton.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
