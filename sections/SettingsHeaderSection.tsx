// sections/SettingsHeaderSection.tsx
//
// Server component — renders the heading + subheading for /settings.
// Receives content from the `settingsHeader` CMS section config.

import type { SectionSettingsHeaderContent } from '@/types/cms'

interface Props {
  content: SectionSettingsHeaderContent
}

export function SettingsHeaderSection({ content }: Props) {
  return (
    <div className="mb-5">
      <h1 className="text-white text-2xl font-bold tracking-tight">
        {content.heading ?? 'Account Settings'}
      </h1>
      <p className="text-white/35 text-sm mt-1">
        {content.subheading ?? 'Manage your architectural preferences and profile identity.'}
      </p>
    </div>
  )
}
