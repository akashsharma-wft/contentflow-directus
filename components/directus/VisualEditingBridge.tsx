'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { apply } from '@directus/visual-editing'

export function VisualEditingBridge() {
  const searchParams = useSearchParams()
  const enabled = searchParams.get('visual-editing') === 'true'
  const removeRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    if (!enabled) return

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
  }, [enabled])

  return null
}