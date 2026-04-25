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

  return null
}