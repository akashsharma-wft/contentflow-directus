'use client'

// features/admin/components/DirectusCredentialsCardClient.tsx

import { useState } from 'react'
import { ExternalLink, Eye, EyeOff, Copy, Check, Database } from 'lucide-react'

interface Props {
  directusUrl:   string
  adminEmail:    string
  adminPassword: string
}

export function DirectusCredentialsCardClient({ directusUrl, adminEmail, adminPassword }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField,  setCopiedField]  = useState<string | null>(null)

  function copy(value: string, field: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  const dashboardUrl = `${directusUrl}/admin`

  return (
    <div className="bg-[#13141c] border border-indigo-500/20 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Database size={16} className="text-indigo-400" />
        <h2 className="text-white text-base font-semibold tracking-tight">
          Directus CMS Dashboard
        </h2>
      </div>

      <p className="text-white/40 text-xs leading-relaxed">
        Use these credentials to log into Directus where you can manage content,
        invite team members, and configure collections.
      </p>

      {/* Dashboard URL */}
      <div className="space-y-1.5">
        <label className="text-white/30 text-[10px] uppercase tracking-widest font-mono block">
          Dashboard URL
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 flex items-center justify-between min-w-0">
            <span className="text-indigo-300 text-sm font-mono truncate">{dashboardUrl}</span>
            <button
              onClick={() => copy(dashboardUrl, 'url')}
              className="ml-2 text-white/30 hover:text-white/70 transition-colors shrink-0"
              title="Copy URL"
            >
              {copiedField === 'url'
                ? <Check size={13} className="text-green-400" />
                : <Copy size={13} />}
            </button>
          </div>
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors shrink-0"
          >
            Open <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Credentials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-white/30 text-[10px] uppercase tracking-widest font-mono block">
            Admin Email
          </label>
          <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 flex items-center justify-between">
            <span className="text-white/70 text-sm font-mono truncate">{adminEmail}</span>
            <button
              onClick={() => copy(adminEmail, 'email')}
              className="ml-2 text-white/30 hover:text-white/70 transition-colors shrink-0"
              title="Copy email"
            >
              {copiedField === 'email'
                ? <Check size={13} className="text-green-400" />
                : <Copy size={13} />}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-white/30 text-[10px] uppercase tracking-widest font-mono block">
            Admin Password
          </label>
          <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 flex items-center justify-between">
            <span className="text-white/70 text-sm font-mono truncate">
              {showPassword ? adminPassword : '••••••••••••'}
            </span>
            <div className="flex items-center gap-2 ml-2 shrink-0">
              <button
                onClick={() => setShowPassword((v) => !v)}
                className="text-white/30 hover:text-white/70 transition-colors"
                title={showPassword ? 'Hide' : 'Show'}
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button
                onClick={() => copy(adminPassword, 'password')}
                className="text-white/30 hover:text-white/70 transition-colors"
                title="Copy password"
              >
                {copiedField === 'password'
                  ? <Check size={13} className="text-green-400" />
                  : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-white/20 text-[10px] font-mono">
        Visible to admins only — sourced from server environment variables.
      </p>
    </div>
  )
}