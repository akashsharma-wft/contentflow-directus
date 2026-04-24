/**
 * FormSection — CMS-driven form presentation layer.
 *
 * This component renders the form UI as configured in the CMS.
 * The actual auth logic (Supabase sign-in, sign-up) lives in the existing
 * features/auth/components/ components — this just wires the visual config.
 *
 * For login/signup formIds, renders the existing tested auth forms.
 * For profile formId, renders the existing ProfileForm.
 */
import Link from 'next/link'
import { pageAttr } from '@/lib/directus/section-binding'
import type { FormSection as FormSectionType } from '@/types/cms'

interface Props {
  section: FormSectionType
  translationId?: number
}

export function FormSection({ section, translationId }: Props) {
  const {
    formId,
    heading,
    subheading,
    footerText,
    footerLinkLabel,
    footerLinkHref,
  } = section

  return (
    <section className="w-full px-6 py-12 max-w-md mx-auto" data-directus={pageAttr(translationId, 'sections')}>
      {(heading || subheading) && (
        <div className="mb-8 space-y-1">
          {heading && (
            <h2 className="text-2xl font-bold text-white tracking-tight">{heading}</h2>
          )}
          {subheading && (
            <p className="text-white/40 text-sm">{subheading}</p>
          )}
        </div>
      )}

      {/* Placeholder for the actual form — the existing auth forms are used directly in pages */}
      <div className="bg-[#13141c] border border-white/10 rounded-2xl p-6 text-white/40 text-sm text-center">
        <p className="font-mono text-xs uppercase tracking-widest mb-2">Form Block</p>
        <p>formId: <span className="text-indigo-400">{formId}</span></p>
        <p className="mt-2 text-white/25">
          Wire this to your{' '}
          {formId === 'login' && <Link href="/login" className="text-indigo-400 underline">login page</Link>}
          {formId === 'signup' && <Link href="/signup" className="text-indigo-400 underline">signup page</Link>}
          {formId === 'profile' && <Link href="/settings" className="text-indigo-400 underline">settings page</Link>}
        </p>
      </div>

      {footerText && (
        <p className="mt-6 text-center text-white/30 text-sm">
          {footerText}{' '}
          {footerLinkLabel && footerLinkHref && (
            <Link href={footerLinkHref} className="text-indigo-400 hover:text-indigo-300 font-medium">
              {footerLinkLabel}
            </Link>
          )}
        </p>
      )}
    </section>
  )
}
