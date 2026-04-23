// sections/BillingSuccessHeroSection.tsx
import {
  CheckCircle, Sparkles, Trophy, Crown, Star, Zap, Award, Flame,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import type { SectionBillingSuccessHeroContent } from '@/types/cms'
import type { DirectusPageTranslationRow } from '@/types/directus'
import { pageAttr } from '@/lib/directus/section-binding'

type IconFC = React.FC<LucideProps>

const ICON_MAP: Record<string, IconFC> = {
  CheckCircle, Sparkles, Trophy, Crown, Star, Zap, Award, Flame,
}

interface Props {
  content: SectionBillingSuccessHeroContent
  translationId?:  number
  translationRow?: DirectusPageTranslationRow
}

export function BillingSuccessHeroSection({ content, translationId, translationRow }: Props) {
  const IconComponent: IconFC =
    (content.icon && ICON_MAP[content.icon]) ? ICON_MAP[content.icon] : CheckCircle

  const heading    = translationRow?.billing_success_heading    ?? content.heading    ?? 'Subscription Activated!'
  const subheading = translationRow?.billing_success_subheading ?? content.subheading ?? 'Your Pro plan is now active.'
  const body       = translationRow?.billing_success_body       ?? content.body

  return (
    <div className="flex flex-col items-center text-center py-10 px-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-5">
        <IconComponent size={32} className="text-emerald-400" />
      </div>
      <h1
        data-directus={pageAttr(translationId, 'billing_success_heading')}
        className="text-white text-2xl font-bold tracking-tight mb-2"
      >
        {heading}
      </h1>
      <p
        data-directus={pageAttr(translationId, 'billing_success_subheading')}
        className="text-white/60 text-sm font-medium mb-3"
      >
        {subheading}
      </p>
      {body && (
        <p
          data-directus={pageAttr(translationId, 'billing_success_body')}
          className="text-white/35 text-sm max-w-md leading-relaxed"
        >
          {body}
        </p>
      )}
    </div>
  )
}