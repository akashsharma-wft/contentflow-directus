// ─── features/dashboard/components/SidebarFooter.tsx ─────────────────────────
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Plus, type LucideIcon } from 'lucide-react'
import { ICON_MAP } from '@/lib/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import type { SiteCtaButton, SiteSidebarFooterLink } from '@/types/cms'

interface SidebarFooterProps {
  ctaButton?: SiteCtaButton
  footerLinks?: SiteSidebarFooterLink[]
}

const DEFAULT_FOOTER_LINKS: SiteSidebarFooterLink[] = [
  { _key: 'fl1', label: 'Documentation', href: '/studio', icon: 'BookOpen', external: true },
  { _key: 'fl2', label: 'Support',       href: '/settings', icon: 'LifeBuoy', external: false },
]

const DEFAULT_CTA: SiteCtaButton = { label: 'New Entry', href: '/posts' }

export function SidebarFooter({ ctaButton = DEFAULT_CTA, footerLinks = DEFAULT_FOOTER_LINKS }: SidebarFooterProps) {
  const router = useRouter()
  const { profile } = useUser()

  const initials = profile?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'CF'

  async function handleSignOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) { toast.error('Failed to sign out'); return }
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="px-2 pb-3 space-y-0.5 border-t border-white/5 pt-3">
      {/* Real user profile — data from Supabase via useUser hook */}
      <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-lg hover:bg-white/5 transition-colors cursor-default">
        <Avatar className="w-6 h-6 shrink-0">
          {profile?.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? ''} />
          )}
          <AvatarFallback className="bg-indigo-500 text-white text-[9px] font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="text-white/70 text-xs font-medium truncate">
            {profile?.display_name ?? 'Loading...'}
          </span>
          <span className="text-white/25 text-[9px] uppercase tracking-wider">
            {profile?.subscription_tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
          </span>
        </div>
      </div>

      {/* CTA button — config-driven */}
      {ctaButton?.label && ctaButton?.href && (
        <Link
          href={ctaButton.href}
          className="flex items-center justify-center gap-2 w-full py-2 mb-1 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={12} />
          {ctaButton.label}
        </Link>
      )}

      {/* Footer utility links — config-driven */}
      {footerLinks.map((link) => {
        const Icon: LucideIcon = (link.icon && ICON_MAP[link.icon]) ? ICON_MAP[link.icon] : ICON_MAP.BookOpen
        const sharedClass = "flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
        if (link.external) {
          return (
            <a
              key={link._key}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={sharedClass}
            >
              <Icon size={13} className="shrink-0" />
              {link.label}
            </a>
          )
        }
        return (
          <Link key={link._key} href={link.href} className={sharedClass}>
            <Icon size={13} className="shrink-0" />
            {link.label}
          </Link>
        )
      })}

      {/* Sign out — always present, real Supabase signOut call */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer text-left"
      >
        <LogOut size={13} className="shrink-0" />
        Sign out
      </button>
    </div>
  )
}