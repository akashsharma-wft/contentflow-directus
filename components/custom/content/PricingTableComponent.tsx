'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ComponentPricingTableContent } from '@/types/cms'

interface Props {
  component: ComponentPricingTableContent
}

export function PricingTableComponent({ component }: Props) {
  const {
    heading,
    subheading,
    currency = '$',
    billingToggle = true,
    plans = [],
  } = component

  const [yearly, setYearly] = useState(false)

  return (
    <section className="w-full py-16 px-6">
      <div className="max-w-6xl mx-auto space-y-10">

        {(heading || subheading || billingToggle) && (
          <div className="text-center space-y-4">
            {heading    && <h2 className="text-3xl font-bold text-white">{heading}</h2>}
            {subheading && <p className="text-white/50 max-w-xl mx-auto">{subheading}</p>}
            {billingToggle && (
              <div className="inline-flex items-center gap-3 bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => setYearly(false)}
                  className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors', !yearly ? 'bg-white text-[#0d0e14]' : 'text-white/50 hover:text-white')}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setYearly(true)}
                  className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors', yearly ? 'bg-white text-[#0d0e14]' : 'text-white/50 hover:text-white')}
                >
                  Yearly
                  <span className="ml-1.5 text-[10px] text-emerald-400 font-semibold">Save 20%</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className={cn('grid gap-6', plans.length <= 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
          {plans.map((plan, i) => (
            <div
              key={i}
              className={cn(
                'flex flex-col rounded-2xl p-6 border',
                plan.highlighted
                  ? 'bg-indigo-500/10 border-indigo-500/40 relative'
                  : 'bg-[#13141c] border-white/8',
              )}
            >
              {plan.badge && (
                <span className={cn(
                  'absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full',
                  plan.highlighted ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/60',
                )}>
                  {plan.badge}
                </span>
              )}

              <div className="space-y-1 mb-4">
                <h3 className="font-bold text-white">{plan.name}</h3>
                {plan.description && <p className="text-sm text-white/50">{plan.description}</p>}
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  {currency}{yearly ? (plan.yearlyPrice ?? plan.monthlyPrice ?? '0') : (plan.monthlyPrice ?? '0')}
                </span>
                {plan.priceNote && <span className="text-white/40 text-sm ml-1">{plan.priceNote}</span>}
              </div>

              {plan.features && plan.features.length > 0 && (
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-sm">
                      <span className={cn('mt-0.5 shrink-0 text-xs font-bold', feat.included ? 'text-emerald-400' : 'text-white/20')}>
                        {feat.included ? '✓' : '✗'}
                      </span>
                      <span className={feat.included ? 'text-white/70' : 'text-white/25 line-through'}>{feat.text}</span>
                    </li>
                  ))}
                </ul>
              )}

              {plan.ctaLabel && (
                <Link
                  href={plan.ctaHref ?? '#'}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors',
                    plan.highlighted
                      ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                      : 'border border-white/15 text-white hover:bg-white/5',
                  )}
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
