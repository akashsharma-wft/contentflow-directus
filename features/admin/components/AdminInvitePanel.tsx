'use client'

// features/admin/components/AdminInvitePanel.tsx
// Invite form only — pending invites and access requests sections removed.

import { useState } from 'react'
import { UserPlus, Loader2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { SectionAdminContent } from '@/types/cms'

interface AdminInvitePanelProps {
  config: SectionAdminContent
}

export function AdminInvitePanel({ config }: AdminInvitePanelProps) {
  const [inviteEmail,   setInviteEmail]   = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviteStatus,  setInviteStatus]  = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [inviteError,   setInviteError]   = useState('')

  const c = {
    sectionHeading:   config.inviteSectionHeading   ?? 'Admin Access',
    formTitle:        config.inviteFormTitle        ?? 'Grant Admin Access',
    emailLabel:       config.inviteEmailLabel       ?? 'Email address',
    emailPlaceholder: config.inviteEmailPlaceholder ?? 'user@example.com',
    messageLabel:     config.inviteMessageLabel     ?? 'Note (optional)',
    sendLabel:        config.inviteSendLabel        ?? 'Grant Access',
  }

  async function handleSendInvite() {
    setInviteStatus('loading')
    setInviteError('')

    try {
      const res = await fetch('/api/admin/invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:   inviteEmail.trim(),
          message: inviteMessage.trim() || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        const errMsg = data.error ?? 'Failed to grant access'
        setInviteError(errMsg)
        setInviteStatus('error')
        toast.error(errMsg)
        setTimeout(() => setInviteStatus('idle'), 3000)
        return
      }

      setInviteStatus('success')
      setInviteEmail('')
      setInviteMessage('')

      const msg = data.directusInvited
        ? 'Admin access granted + Directus invite sent'
        : 'Admin access granted'
      toast.success(msg)

      if (data.directusWarning) {
        toast.warning(`Directus invite: ${data.directusWarning}`)
      }

      setTimeout(() => setInviteStatus('idle'), 2500)
    } catch {
      setInviteError('Network error — please try again')
      setInviteStatus('error')
      toast.error('Network error — please try again')
      setTimeout(() => setInviteStatus('idle'), 3000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <UserPlus size={16} className="text-indigo-400" />
        <h2 className="text-white text-lg font-bold tracking-tight">{c.sectionHeading}</h2>
      </div>

      <div className="bg-[#13141c] border border-white/5 rounded-2xl p-5">
        <p className="text-white/60 text-sm font-semibold mb-1">{c.formTitle}</p>
        <p className="text-white/30 text-xs mb-4">
          The user must already have a ContentFlow account. They will also receive a Directus invite.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-2">
            <label className="text-white/30 text-[10px] uppercase tracking-widest font-mono block">
              {c.emailLabel}
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={c.emailPlaceholder}
              onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-white/30 text-[10px] uppercase tracking-widest font-mono block">
              {c.messageLabel}
            </label>
            <input
              type="text"
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              placeholder="Internal note…"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
        </div>

        {inviteError && (
          <p className="text-red-400 text-xs mt-2">{inviteError}</p>
        )}

        <div className="mt-3">
          <button
            onClick={handleSendInvite}
            disabled={!inviteEmail.trim() || inviteStatus === 'loading'}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-mono uppercase tracking-widest transition-colors cursor-pointer',
              inviteStatus === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 cursor-default'
                : inviteStatus === 'error'
                ? 'bg-red-500/15 border border-red-500/30 text-red-300 cursor-default'
                : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {inviteStatus === 'loading' && <Loader2 size={12} className="animate-spin" />}
            {inviteStatus === 'success' && <Check size={12} />}
            {inviteStatus === 'error'   && <X size={12} />}
            {inviteStatus === 'success' ? 'Access Granted!' : inviteStatus === 'error' ? 'Failed' : c.sendLabel}
          </button>
        </div>
      </div>
    </div>
  )
}