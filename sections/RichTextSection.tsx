import { PortableText } from '@portabletext/react'
import { cn } from '@/lib/utils'
import { pageAttr } from '@/lib/directus/section-binding'
import type { RichTextSection as RichTextSectionType } from '@/types/cms'

interface Props {
  section: RichTextSectionType
  translationId?: number
}

const MAX_WIDTH_MAP = {
  narrow: 'max-w-[680px]',
  medium: 'max-w-[800px]',
  full: 'max-w-full',
}

export function RichTextSection({ section, translationId }: Props) {
  const { heading, content, maxWidth = 'medium' } = section

  return (
    <section
      className="w-full px-6 py-12"
      data-directus={pageAttr(translationId, 'sections')}
    >
      <div className={cn('mx-auto', MAX_WIDTH_MAP[maxWidth])}>
        {heading && (
          <h2 className="text-2xl font-bold text-white tracking-tight mb-6">{heading}</h2>
        )}
        <article className="prose prose-invert prose-indigo max-w-none">
          <PortableText value={content as Parameters<typeof PortableText>[0]['value']} />
        </article>
      </div>
    </section>
  )
}
