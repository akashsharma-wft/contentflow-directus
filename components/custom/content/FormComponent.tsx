'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ComponentFormContent } from '@/types/cms'

interface Props {
  component: ComponentFormContent
}

export function FormComponent({ component }: Props) {
  const {
    heading,
    subheading,
    method = 'post',
    action,
    fields = [],
    submitLabel = 'Submit',
    successMessage = 'Thank you! Your message has been sent.',
  } = component

  const [submitted, setSubmitted] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (action) {
      const form = e.currentTarget
      const data = new FormData(form)
      await fetch(action, {
        method: method.toUpperCase(),
        body: method === 'post' ? data : undefined,
      }).catch(() => {})
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="w-full max-w-lg mx-auto py-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/15 mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <p className="text-white font-semibold">{successMessage}</p>
      </div>
    )
  }

  return (
    <section className="w-full py-14 px-6">
      <div className="max-w-lg mx-auto space-y-8">
        {(heading || subheading) && (
          <div className="space-y-2 text-center">
            {heading    && <h2 className="text-2xl font-bold text-white">{heading}</h2>}
            {subheading && <p className="text-white/50 text-sm">{subheading}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} method={method} action={action} className="space-y-4">
          {fields.map((field, i) => {
            const id = `field-${field.name ?? i}`
            return (
              <div key={i} className="space-y-1.5">
                <label htmlFor={id} className="block text-sm font-medium text-white/70">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-0.5">*</span>}
                </label>

                {field.fieldType === 'textarea' ? (
                  <textarea
                    id={id}
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={4}
                    value={values[field.name ?? ''] ?? ''}
                    onChange={e => setValues(v => ({ ...v, [field.name ?? '']: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 resize-none"
                  />
                ) : field.fieldType === 'select' ? (
                  <select
                    id={id}
                    name={field.name}
                    required={field.required}
                    value={values[field.name ?? ''] ?? ''}
                    onChange={e => setValues(v => ({ ...v, [field.name ?? '']: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="">{field.placeholder ?? 'Select…'}</option>
                    {field.options?.map((opt, oi) => (
                      <option key={oi} value={opt.value ?? ''}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    type={field.fieldType ?? 'text'}
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={values[field.name ?? ''] ?? ''}
                    onChange={e => setValues(v => ({ ...v, [field.name ?? '']: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                  />
                )}

                {field.helperText && (
                  <p className="text-xs text-white/35">{field.helperText}</p>
                )}
              </div>
            )
          })}

          <button
            type="submit"
            className={cn(
              'w-full py-2.5 rounded-lg font-semibold text-sm transition-colors',
              'bg-indigo-500 hover:bg-indigo-600 text-white',
            )}
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </section>
  )
}
