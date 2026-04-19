'use client'

import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

interface Props {
  label: string
  /** Href from CMS config (e.g. /signup). Overridden to /posts when authenticated. */
  href: string
  className: string
}

/**
 * Primary CTA link in the Hero section.
 * When the user is authenticated the destination becomes /posts (the dashboard)
 * instead of the CMS-configured href (typically /signup or /login).
 * No visual flicker — href resolves silently after auth state is known.
 */
export function HeroPrimaryCta({ label, href, className }: Props) {
  const { user, isLoading } = useUser()

  // While loading keep the original href so there is no layout shift.
  // Once resolved, authenticated users go to /posts.
  const resolvedHref = !isLoading && user ? '/posts' : href

  return (
    <Link href={resolvedHref} className={className}>
      {label}
    </Link>
  )
}
