// sections/BillingSuccessHeroSection.tsx
//
// Server component — renders the hero block for /billing-success.
// Displays an icon badge, heading, subheading, and body text.
// Content is fully configurable from the `billingSuccessHero` CMS section config.

import {
  CheckCircle, Sparkles, Trophy, Crown, Star, Zap, Award, Flame,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import type { SectionBillingSuccessHeroContent } from '@/types/cms'

type IconFC = React.FC<LucideProps>

const ICON_MAP: Record<string, IconFC> = {
  CheckCircle, Sparkles, Trophy, Crown, Star, Zap, Award, Flame,
}

interface Props {
  content: SectionBillingSuccessHeroContent
}

export function BillingSuccessHeroSection({ content }: Props) {
  const IconComponent: IconFC =
    (content.icon && ICON_MAP[content.icon]) ? ICON_MAP[content.icon] : CheckCircle

  return (
    <div className="flex flex-col items-center text-center py-10 px-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-5">
        <IconComponent size={32} className="text-emerald-400" />
      </div>
      <h1 className="text-white text-2xl font-bold tracking-tight mb-2">
        {content.heading ?? 'Subscription Activated!'}
      </h1>
      <p className="text-white/60 text-sm font-medium mb-3">
        {content.subheading ?? 'Your Pro plan is now active.'}
      </p>
      {content.body && (
        <p className="text-white/35 text-sm max-w-md leading-relaxed">
          {content.body}
        </p>
      )}
    </div>
  )
}
