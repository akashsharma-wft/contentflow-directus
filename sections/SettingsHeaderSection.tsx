// sections/SettingsHeaderSection.tsx
import type { SectionSettingsHeaderContent } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

interface Props {
  content: SectionSettingsHeaderContent
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function SettingsHeaderSection({ content, translationId, translationRow }: Props) {
  const heading    = translationRow?.settings_heading    ?? content.heading    ?? 'Account Settings'
  const subheading = translationRow?.settings_subheading ?? content.subheading ?? 'Manage your architectural preferences and profile identity.'

  return (
    <div className="mb-5">
      <h1
        data-directus={pageAttr(translationId, 'settings_heading')}
        className="text-white text-2xl font-bold tracking-tight"
      >
        {heading}
      </h1>
      <p
        data-directus={pageAttr(translationId, 'settings_subheading')}
        className="text-white/35 text-sm mt-1"
      >
        {subheading}
      </p>
    </div>
  )
}