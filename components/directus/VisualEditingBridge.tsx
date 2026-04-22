'use client'

// components/directus/VisualEditingBridge.tsx
//
// Activates Directus Visual Editing when ?visual-editing=true is present in the URL.
// Must be wrapped in <Suspense> at the call site (useSearchParams requires it).
//
// The bridge calls apply() once on mount, which scans the DOM for [data-directus]
// attributes added by editableAttr() and overlays edit buttons.
// onSaved reloads the page so the server-rendered HTML reflects the saved data.

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

    apply({
      directusUrl,
      onSaved: () => window.location.reload(),
    }).then((instance) => {
      if (instance) removeRef.current = instance.remove
    })

    return () => {
      removeRef.current?.()
      removeRef.current = undefined
    }
  }, [enabled])

  return null
}
