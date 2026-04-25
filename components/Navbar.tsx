// components/Navbar.tsx
//
// Public navbar — appears on layout==='home' pages only.
//
// Auth-aware right side:
//   isLoading  → brand + language switcher (no flash of wrong UI)
//   guest      → Login (text) + Sign Up (CTA button from site config)
//   logged-in  → app nav links (Posts/Settings/Billing, + Analytics/Admin if admin)
//               + profile icon → /settings  + logout button
//
// Route protection is handled by middleware (proxy.ts). This component only
// toggles _visibility_ — actual access enforcement lives in the server.
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'
import { localizeHref, filterByVisibility, getNavItemLabel, getNavRole, resolveLabel } from '@/lib/navigation'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import type { SiteConfig, NavPage } from '@/types/cms'
import { siteAttr, siteTranslationAttrs } from '@/lib/directus/section-binding'
// NavPage kept for prop backward compat — not used in center nav

const LANG_CODES = ['en', 'hi', 'kn'] as const
type LangCode = (typeof LANG_CODES)[number]

const SUPPRESS_ROUTES = ['/login', '/signup']

function parseCurrentLang(pathname: string): LangCode {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return 'en'
  const first = segments[0]
  if ((LANG_CODES as readonly string[]).includes(first)) return first as LangCode
  return 'en'
}


interface Props {
  siteConfig: SiteConfig | null
  navPages?:  NavPage[]
  lang?: string
}

export function Navbar({ siteConfig }: Props) {
  const pathname     = usePathname()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isInIframe, setIsInIframe] = useState(false)
  const { user, profile, isLoading } = useUser()

  useEffect(() => { setIsInIframe(window !== window.top) }, [])

  // Don't render on login / signup routes
  if (SUPPRESS_ROUTES.some((route) => pathname.startsWith(route))) return null

  // Only render on home page (/ or /{lang})
  const isHomePage =
    pathname === '/' || (LANG_CODES as readonly string[]).includes(pathname.slice(1))
  if (!isHomePage) return null

  const currentLang          = parseCurrentLang(pathname)
  const cfg                  = siteConfig?.navbarConfig
  const brandName            = cfg?.brandName ?? siteConfig?.siteName ?? 'ContentFlow'
  const ctaButton            = cfg?.ctaButton
  const showLanguageSwitcher = cfg?.showLanguageSwitcher ?? true
  const loginLabel           = resolveLabel(cfg?.loginLabel, currentLang, 'Login')
  const signupLabel          = resolveLabel(cfg?.signupLabel, currentLang, 'Sign up')
  const signoutLabel         = resolveLabel(cfg?.signoutLabel, currentLang, 'Sign out')
  const mobileLanguageLabel  = resolveLabel(cfg?.mobileLanguageLabel, currentLang, 'Language')

  // In visual editor preview, show all nav items regardless of actual role.
  const isPreviewMode = searchParams.get('visual-editing') === 'true' || isInIframe
  const role          = isPreviewMode ? 'admin' : getNavRole(user?.id, profile?.role)
  const navItems      = filterByVisibility(cfg?.items ?? [], role)

  // isAuthenticated flips as soon as user is known — does NOT wait for profile.
  const isAuthenticated = user !== null
  const isGuest         = !isLoading && user === null

  const closeMobile = () => setMobileOpen(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
    closeMobile()
  }

  return (
    <>
      {/* ── Desktop + Mobile header ───────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0d0e14]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Left: hamburger (mobile) + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden flex flex-col gap-1.5 p-1 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-px bg-white/70 transition-transform duration-200 ${mobileOpen ? 'translate-y-2.5 rotate-45' : ''}`} />
              <span className={`block w-5 h-px bg-white/70 transition-opacity duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-px bg-white/70 transition-transform duration-200 ${mobileOpen ? '-translate-y-2.5 -rotate-45' : ''}`} />
            </button>

            <Link
              href={currentLang === 'en' ? '/' : `/${currentLang}`}
              className="flex items-center gap-2 shrink-0"
              onClick={closeMobile}
            >
              <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9h9m0 0-3-3m3 3-3 3M12 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span
                data-directus={siteAttr('navbar_brand_name')}
                className="text-white font-semibold text-sm tracking-tight"
              >{brandName}</span>
            </Link>
          </div>

          {/* Center: siteConfig nav items filtered by role — desktop only */}
          {navItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item, i) => {
                const href     = localizeHref(item.href, currentLang)
                const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
                const label    = getNavItemLabel(item.label, currentLang)
                return (
                  <Link
                    key={item._key}
                    href={href}
                    data-directus={siteTranslationAttrs(siteConfig?.siteConfigTranslationId, 'navbar_items')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      isActive ? 'text-white bg-white/8' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Right: language switcher + auth-state-aware actions */}
          <div className="flex items-center gap-2">

            {showLanguageSwitcher && (
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>
            )}

            {/* ── Loading placeholder — prevents flash of wrong UI ── */}
            {isLoading && (
              <div className="w-16 h-7 rounded-lg bg-white/5 animate-pulse" />
            )}

            {/* ── Guest: Login + Sign Up ─────────────────────────── */}
            {isGuest && (
              <>
                <Link
                  href={localizeHref('/login', currentLang)}
                  className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors"
                >
                  {loginLabel}
                </Link>
                {ctaButton?.label && ctaButton?.href ? (
                  <Link
                    href={localizeHref(ctaButton.href, currentLang)}
                    className="hidden sm:inline-flex px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {resolveLabel(ctaButton.label, currentLang)}
                  </Link>
                ) : (
                  <Link
                    href={localizeHref('/signup', currentLang)}
                    className="hidden sm:inline-flex px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {signupLabel}
                  </Link>
                )}
              </>
            )}

            {/* ── Logged in: profile + logout ────────────────────── */}
            {isAuthenticated && (
              <>
                {/* Profile icon → /settings */}
                <Link
                  href={localizeHref('/settings', currentLang)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/25 transition-colors"
                  aria-label="Profile settings"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleSignOut}
                  className="w-8 h-8 hidden sm:flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                  aria-label="Sign out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={closeMobile}
          />
          <div className="fixed top-14 left-0 bottom-0 z-50 w-72 bg-[#0d0e14] border-r border-white/8 flex flex-col md:hidden">
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

              {/* Language section */}
              <div className="px-2 py-3 mb-2 border-b border-white/6">
                <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-2">{mobileLanguageLabel}</p>
                <LanguageSwitcher />
              </div>

              {/* Nav items filtered by role */}
              {navItems.map((item, i) => {
                const href     = localizeHref(item.href, currentLang)
                const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
                const label    = getNavItemLabel(item.label, currentLang)
                return (
                  <Link
                    key={item._key}
                    href={href}
                    onClick={closeMobile}
                    data-directus={siteTranslationAttrs(siteConfig?.siteConfigTranslationId, 'navbar_items')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      isActive ? 'text-white bg-white/8' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}

              {/* Guest mobile links */}
              {isGuest && (
                <>
                  <Link
                    href={localizeHref('/login', currentLang)}
                    onClick={closeMobile}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {loginLabel}
                  </Link>
                  <Link
                    href={localizeHref('/signup', currentLang)}
                    onClick={closeMobile}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {signupLabel}
                  </Link>
                </>
              )}

              {/* Authenticated: sign out */}
              {isAuthenticated && (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-colors text-left"
                >
                  {signoutLabel}
                </button>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
