'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { apply } from '@directus/visual-editing'

export function VisualEditingBridge() {
  const searchParams = useSearchParams()
  const paramEnabled = searchParams.get('visual-editing') === 'true'
  const removeRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    // Activate when URL has ?visual-editing=true OR when running inside an iframe
    // (the Directus Visual Editor at /admin/visual/ loads the site in an iframe
    //  without appending ?visual-editing=true, so we also detect via window.top)
    const inIframe = typeof window !== 'undefined' && window !== window.top
    if (!paramEnabled && !inIframe) return

    const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? ''
    if (!directusUrl) return

    let cancelled = false

    apply({
      directusUrl,
      onSaved: () => setTimeout(() => window.location.reload(), 300),
    })
      .then((instance) => {
        if (cancelled || !instance) return
        removeRef.current = instance.remove
      })
      .catch((err) => console.error('[VisualEditingBridge]', err))

    return () => {
      cancelled = true
      removeRef.current?.()
      removeRef.current = undefined
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramEnabled])

  // ── Navigation interceptor (only active inside the visual editor iframe) ────
  // Cookies set inside a cross-site iframe are blocked by modern Chrome's
  // third-party cookie policy, so we can't use a ve_session cookie to carry
  // the ?visual-editing=true bypass across navigations. Instead we intercept
  // every internal link click and force a full-page reload with the param in
  // the URL. The server middleware already honours ?visual-editing=true to skip
  // auth redirects, so protected pages render as guest/preview state.
  useEffect(() => {
    const inIframe = typeof window !== 'undefined' && window !== window.top
    // When the URL already has the param, no interception needed — navigations
    // will carry it forward via history.pushState naturally.
    if (!inIframe || paramEnabled) return

    function handleClick(e: MouseEvent) {
      const link = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null
      if (!link) return

      const href = link.getAttribute('href') ?? ''
      // Skip external links, anchors, tel:, mailto:, etc.
      if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || href.includes(':')) return

      e.preventDefault()
      e.stopPropagation()

      try {
        const url = new URL(href, window.location.origin)
        url.searchParams.set('visual-editing', 'true')
        window.location.href = url.toString()
      } catch {
        window.location.href = href
      }
    }

    // useCapture=true so we fire before Next.js's own click handler
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [paramEnabled])

  return null
}