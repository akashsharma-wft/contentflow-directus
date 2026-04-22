// Shared navigation structure used across Navbar, Footer, and Sidebar
import {
  FileText, BarChart3, Settings, CreditCard, Shield,
  LayoutDashboard, HelpCircle, LogOut, BookOpen, LifeBuoy,
  Plus, Home, type LucideIcon,
} from 'lucide-react'
import type { NavRole, SiteNavItem, SiteNavItemLabel, SidebarNavLink } from '@/types/cms'

export const ICON_MAP: Record<string, LucideIcon> = {
  // Dashboard app nav
  LayoutDashboard,
  FileText,
  BarChart2:       BarChart3,   // seed uses BarChart2, map to BarChart3
  BarChart3,
  Settings,
  CreditCard,
  Shield,
  ShieldCheck:     Shield,      // seed uses ShieldCheck, map to Shield
  // Sidebar utility links
  BookOpen,
  LifeBuoy,
  HelpCircle,
  LogOut,
  Plus,
  Home,
}

// ── Unified nav helpers ────────────────────────────────────────────────────────

/**
 * Derive the user's NavRole from their auth state.
 * - No user      → 'guest'
 * - Admin role   → 'admin'
 * - Any other    → 'user'
 */
export function getNavRole(
  userId:      string | null | undefined,
  profileRole: string | null | undefined,
): NavRole {
  if (!userId) return 'guest'
  if (profileRole === 'admin') return 'admin'
  return 'user'
}

/**
 * Filter SiteNavItems by the visitor's current role.
 * - 'admin' sees items marked for 'admin' or 'user' (admin is superset of user).
 * - 'user'  sees items marked for 'user' only.
 * - 'guest' sees items marked for 'guest' only.
 * Items with an empty visibleFor array are hidden from everyone.
 */
export function filterByVisibility(items: SiteNavItem[], role: NavRole): SiteNavItem[] {
  return items.filter((item) => {
    const vf = item.visibleFor ?? []
    if (vf.length === 0) return false
    if (role === 'admin') return vf.includes('admin') || vf.includes('user')
    return vf.includes(role)
  })
}

/**
 * Resolve the display label for a nav item in the requested language.
 * Falls back to English if the translation is absent.
 */
export function getNavItemLabel(label: SiteNavItemLabel, lang: string): string {
  if (lang === 'hi' && label.hi) return label.hi
  if (lang === 'kn' && label.kn) return label.kn
  return label.en
}

/**
 * Resolve any CMS label that may be a plain string or a multilingual object.
 * Plain strings pass through unchanged (backward compat with legacy seed data).
 */
export function resolveLabel(
  label: string | SiteNavItemLabel | undefined,
  lang: string,
  fallback = '',
): string {
  if (!label) return fallback
  if (typeof label === 'string') return label
  return getNavItemLabel(label, lang)
}

// ── Legacy helpers (kept for backward compat) ─────────────────────────────────

export const APP_NAV_ITEMS: SidebarNavLink[] = [
  { label: 'Posts',     href: '/posts',     icon: 'FileText',  adminOnly: false },
  { label: 'Settings',  href: '/settings',  icon: 'Settings',  adminOnly: false },
  { label: 'Billing',   href: '/billing',   icon: 'CreditCard', adminOnly: false },
  { label: 'Analytics', href: '/analytics', icon: 'BarChart3', adminOnly: true  },
  { label: 'Admin',     href: '/admin',     icon: 'Shield',    adminOnly: true  },
]

/** @deprecated Use filterByVisibility + SiteNavItem instead. */
export function filterNavItems(items: SidebarNavLink[], userRole?: string | null): SidebarNavLink[] {
  return items.filter((item) => !(item.adminOnly && userRole !== 'admin'))
}

/**
 * Build a language-aware href.
 * /posts → /posts (en)
 * /posts → /hi/posts (hi)
 */
export function localizeHref(href: string, lang: string): string {
  if (lang === 'en' || !lang) return href
  return `/${lang}${href}`
}

/** @deprecated Use getNavItemLabel + SiteNavItemLabel instead. */
export function getLocalizedLabel(label: string, lang: string): string {
  const translations: Record<string, Record<string, string>> = {
    Posts:     { en: 'Posts',      hi: 'पोस्ट',    kn: 'ಪೋಸ್ಟ್‌ಗಳು'   },
    Settings:  { en: 'Settings',   hi: 'सेटिंग्स',  kn: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು' },
    Billing:   { en: 'Billing',    hi: 'बिलिंग',    kn: 'ಬಿಲ್ಲಿಂಗ್'     },
    Analytics: { en: 'Analytics',  hi: 'विश्लेषण',  kn: 'ವಿಶ್ಲೇಷಣೆ'     },
    Admin:     { en: 'Admin',      hi: 'एडमिन',     kn: 'ಅಡ್ಮಿನ್'        },
  }
  return translations[label]?.[lang] ?? label
}
