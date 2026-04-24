import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import { pageAttr } from '@/lib/directus/section-binding'

// ─── HEADING SECTION ──────────────────────────────────────────────────────────
interface HeadingSectionProps {
  section: {
    heading: string
    subheading?: string
    badge?: string
    align?: 'left' | 'center' | 'right'
    size?: 'h1' | 'h2' | 'h3'
  }
  translationId?: number
}

const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }
const sizeClass = { h1: 'text-5xl font-bold', h2: 'text-3xl font-bold', h3: 'text-2xl font-semibold' }

export function HeadingSection({ section, translationId }: HeadingSectionProps) {
  const { heading, subheading, badge, align = 'center', size = 'h2' } = section
  const Tag = size as 'h1' | 'h2' | 'h3'
  return (
    <section className="py-12 px-6 bg-[#0d0e14]" data-directus={pageAttr(translationId, 'sections')}>
      <div className={`max-w-4xl mx-auto ${alignClass[align]}`}>
        {badge && (
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
            {badge}
          </span>
        )}
        <Tag className={`text-white ${sizeClass[size]} mb-4`}>{heading}</Tag>
        {subheading && <p className="text-white/50 text-lg leading-relaxed">{subheading}</p>}
      </div>
    </section>
  )
}

// ─── FEATURE LIST SECTION ─────────────────────────────────────────────────────
interface Feature { _key?: string; icon?: string; title: string; description?: string }
interface FeatureListSectionProps {
  section: {
    heading?: string
    subheading?: string
    layout?: 'list' | 'grid-2' | 'grid-3'
    features?: Feature[]
  }
  translationId?: number
}

const featureGridClass: Record<string, string> = {
  list: 'grid-cols-1 max-w-2xl',
  'grid-2': 'grid-cols-1 sm:grid-cols-2',
  'grid-3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}

export function FeatureListSection({ section, translationId }: FeatureListSectionProps) {
  const { heading, subheading, layout = 'grid-3', features = [] } = section
  return (
    <section className="py-16 px-6 bg-[#0d0e14]" data-directus={pageAttr(translationId, 'sections')}>
      <div className="max-w-6xl mx-auto">
        {(heading || subheading) && (
          <div className="mb-12 text-center">
            {heading && <h2 className="text-3xl font-bold text-white mb-3">{heading}</h2>}
            {subheading && <p className="text-white/50">{subheading}</p>}
          </div>
        )}
        <div className={`grid gap-8 mx-auto ${featureGridClass[layout]}`}>
          {features.map((f, i) => (
            <div key={f._key ?? i} className="flex gap-4">
              {f.icon && (
                <div className="w-10 h-10 shrink-0 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                  <span className="text-indigo-400 text-xs font-mono">{f.icon}</span>
                </div>
              )}
              <div>
                <h3 className="text-white font-semibold mb-1">{f.title}</h3>
                {f.description && <p className="text-white/45 text-sm leading-relaxed">{f.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── TESTIMONIALS SECTION ─────────────────────────────────────────────────────
interface Testimonial { _key?: string; quote: string; name: string; title?: string; rating?: number }
interface TestimonialsSectionProps {
  section: {
    heading?: string
    testimonials?: Testimonial[]
    layout?: 'grid' | 'single' | 'carousel'
  }
  translationId?: number
}

export function TestimonialsSection({ section, translationId }: TestimonialsSectionProps) {
  const { heading, testimonials = [] } = section
  return (
    <section className="py-16 px-6 bg-[#0d0e14]" data-directus={pageAttr(translationId, 'sections')}>
      <div className="max-w-6xl mx-auto">
        {heading && <h2 className="text-3xl font-bold text-white text-center mb-12">{heading}</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={t._key ?? i} className="border border-white/8 rounded-2xl p-6 bg-white/2">
              {t.rating && (
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <span key={s} className={s < t.rating! ? 'text-amber-400' : 'text-white/15'}>★</span>
                  ))}
                </div>
              )}
              <p className="text-white/70 text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="text-white font-semibold text-sm">{t.name}</p>
                {t.title && <p className="text-white/40 text-xs mt-0.5">{t.title}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ SECTION ──────────────────────────────────────────────────────────────
interface FAQ { _key?: string; question: string; answer: unknown[] }
interface FaqSectionProps {
  section: {
    heading?: string
    subheading?: string
    faqs?: FAQ[]
    layout?: 'accordion' | 'open' | 'two-col'
  }
  translationId?: number
}

export function FaqSection({ section, translationId }: FaqSectionProps) {
  const { heading, subheading, faqs = [] } = section
  return (
    <section className="py-16 px-6 bg-[#0d0e14]" data-directus={pageAttr(translationId, 'sections')}>
      <div className="max-w-3xl mx-auto">
        {heading && <h2 className="text-3xl font-bold text-white text-center mb-3">{heading}</h2>}
        {subheading && <p className="text-white/50 text-center mb-12">{subheading}</p>}
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={faq._key ?? i} className="group border border-white/8 rounded-xl">
              <summary className="flex justify-between items-center px-6 py-4 cursor-pointer text-white font-medium select-none list-none">
                {faq.question}
                <span className="text-white/30 group-open:rotate-180 transition-transform ml-4">↓</span>
              </summary>
              <div className="px-6 pb-5 text-white/55 text-sm leading-relaxed prose prose-invert max-w-none">
                <PortableText value={faq.answer as Parameters<typeof PortableText>[0]['value']} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── PRICING SECTION ──────────────────────────────────────────────────────────
interface PricingFeature { _key?: string; text: string; included: boolean }
interface PricingPlan {
  _key?: string
  name: string
  price?: string
  priceNote?: string
  description?: string
  badge?: string
  highlighted?: boolean
  features?: PricingFeature[]
  ctaLabel?: string
  ctaHref?: string
}
interface PricingSectionProps {
  section: { heading?: string; subheading?: string; plans?: PricingPlan[] }
  translationId?: number
}

export function PricingSection({ section, translationId }: PricingSectionProps) {
  const { heading, subheading, plans = [] } = section
  return (
    <section className="py-16 px-6 bg-[#0d0e14]" data-directus={pageAttr(translationId, 'sections')}>
      <div className="max-w-5xl mx-auto">
        {heading && <h2 className="text-3xl font-bold text-white text-center mb-3">{heading}</h2>}
        {subheading && <p className="text-white/50 text-center mb-12">{subheading}</p>}
        <div className={`grid gap-6 ${plans.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
          {plans.map((plan, i) => (
            <div key={plan._key ?? i} className={`relative rounded-2xl p-6 flex flex-col ${plan.highlighted ? 'border-2 border-indigo-500 bg-indigo-500/5' : 'border border-white/8'}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-500 text-white text-xs font-semibold rounded-full">
                  {plan.badge}
                </div>
              )}
              <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>
              {plan.description && <p className="text-white/45 text-sm mb-4">{plan.description}</p>}
              {plan.price && (
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.priceNote && <span className="text-white/40 text-sm ml-1">{plan.priceNote}</span>}
                </div>
              )}
              <ul className="space-y-2 mb-8 flex-1">
                {(plan.features ?? []).map((f, fi) => (
                  <li key={f._key ?? fi} className={`flex items-center gap-2 text-sm ${f.included ? 'text-white/70' : 'text-white/25 line-through'}`}>
                    <span className={f.included ? 'text-emerald-400' : 'text-white/20'}>✓</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              {plan.ctaHref && plan.ctaLabel && (
                <Link
                  href={plan.ctaHref}
                  className={`text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${plan.highlighted ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'border border-white/15 text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                  {plan.ctaLabel}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── BANNER SECTION ───────────────────────────────────────────────────────────
interface BannerSectionProps {
  section: {
    text: string
    ctaLabel?: string
    ctaHref?: string
    color?: 'indigo' | 'amber' | 'red' | 'emerald'
  }
  translationId?: number
}

const bannerColors: Record<string, string> = {
  indigo: 'bg-indigo-500/15 border-indigo-500/25 text-indigo-200',
  amber: 'bg-amber-500/15 border-amber-500/25 text-amber-200',
  red: 'bg-red-500/15 border-red-500/25 text-red-200',
  emerald: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-200',
}

export function BannerSection({ section, translationId }: BannerSectionProps) {
  const { text, ctaLabel, ctaHref, color = 'indigo' } = section
  return (
    <div
      className={`flex items-center justify-center gap-4 px-6 py-3 border-b ${bannerColors[color]}`}
      data-directus={pageAttr(translationId, 'sections')}
    >
      <p className="text-sm font-medium">{text}</p>
      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className="text-xs font-semibold underline underline-offset-2 hover:no-underline">
          {ctaLabel} →
        </Link>
      )}
    </div>
  )
}

// ─── COLUMNS SECTION ──────────────────────────────────────────────────────────
interface ColumnsSectionProps {
  section: {
    left?: unknown[]
    right?: unknown[]
    ratio?: '1/1' | '3/2' | '2/3' | '7/3'
    reverseOnMobile?: boolean
  }
}

const ratioClasses: Record<string, [string, string]> = {
  '1/1': ['flex-1', 'flex-1'],
  '3/2': ['flex-[3]', 'flex-[2]'],
  '2/3': ['flex-[2]', 'flex-[3]'],
  '7/3': ['flex-[7]', 'flex-[3]'],
}

export function ColumnsSection({ section }: ColumnsSectionProps) {
  const { left, right, ratio = '1/1', reverseOnMobile = false } = section
  const [leftClass, rightClass] = ratioClasses[ratio]
  return (
    <section className="py-12 px-6 bg-[#0d0e14]">
      <div className={`max-w-6xl mx-auto flex gap-12 ${reverseOnMobile ? 'flex-col-reverse md:flex-row' : 'flex-col md:flex-row'}`}>
        <div className={`${leftClass} text-white/70 prose prose-invert max-w-none`}>
          {left && <PortableText value={left as Parameters<typeof PortableText>[0]['value']} />}
        </div>
        <div className={`${rightClass} text-white/70 prose prose-invert max-w-none`}>
          {right && <PortableText value={right as Parameters<typeof PortableText>[0]['value']} />}
        </div>
      </div>
    </section>
  )
}

// ─── SPACER SECTION ───────────────────────────────────────────────────────────
const spacerSizes: Record<string, string> = { sm: 'h-6', md: 'h-12', lg: 'h-24', xl: 'h-32' }
export function SpacerSection({ section }: { section: { size?: string } }) {
  return <div className={spacerSizes[section.size ?? 'md']} aria-hidden="true" />
}

// ─── DIVIDER SECTION ──────────────────────────────────────────────────────────
export function DividerSection({ section }: { section: { style?: 'line' | 'dots' | 'invisible' } }) {
  if (section.style === 'invisible') return <div className="h-px" aria-hidden="true" />
  if (section.style === 'dots') {
    return (
      <div className="flex justify-center gap-2 py-8" aria-hidden="true">
        {[0,1,2].map(i => <span key={i} className="w-1 h-1 rounded-full bg-white/20" />)}
      </div>
    )
  }
  return <hr className="border-t border-white/8 my-8 mx-6" />
}

// ─── NEWSLETTER SECTION ───────────────────────────────────────────────────────
interface NewsletterSectionProps {
  section: {
    heading?: string
    subheading?: string
    placeholder?: string
    buttonLabel?: string
    successMessage?: string
    privacyText?: string
    layout?: 'centered' | 'split' | 'bar'
  }
  translationId?: number
}

export function NewsletterSection({ section, translationId }: NewsletterSectionProps) {
  const { heading = 'Stay in the loop', subheading, placeholder = 'Enter your email', buttonLabel = 'Subscribe', privacyText } = section
  return (
    <section className="py-16 px-6 bg-[#0d0e14]" data-directus={pageAttr(translationId, 'sections')}>
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-white mb-3">{heading}</h2>
        {subheading && <p className="text-white/50 mb-8">{subheading}</p>}
        <form className="flex gap-3" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder={placeholder}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50"
          />
          <button type="submit" className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors">
            {buttonLabel}
          </button>
        </form>
        {privacyText && <p className="text-white/25 text-xs mt-4">{privacyText}</p>}
      </div>
    </section>
  )
}

// ─── NOT FOUND SECTION ────────────────────────────────────────────────────────
interface NotFoundSectionProps {
  section: {
    heading?: string
    subheading?: string
    ctaLabel?: string
    ctaHref?: string
  }
}

export function NotFoundSection({ section }: NotFoundSectionProps) {
  const { heading = "This page doesn't exist", subheading, ctaLabel = 'Go home', ctaHref = '/' } = section
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-6 bg-[#0d0e14]">
      <div className="text-center">
        <p className="text-white/15 text-8xl font-black mb-6">404</p>
        <h1 className="text-3xl font-bold text-white mb-3">{heading}</h1>
        {subheading && <p className="text-white/50 mb-8 max-w-md mx-auto">{subheading}</p>}
        <Link href={ctaHref} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors">
          {ctaLabel}
        </Link>
      </div>
    </section>
  )
}
