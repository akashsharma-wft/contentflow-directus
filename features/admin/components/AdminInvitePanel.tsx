// features/admin/components/AdminInvitePanel.tsx
'use client'

import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { UserPlus, Send, Check, X, Loader2, Mail, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { SectionAdminContent } from '@/types/cms'
import type { AdminInviteRow } from '@/types/admin'

interface AdminInvitePanelProps {
  initialInvites:  AdminInviteRow[]
  initialRequests: AdminInviteRow[]
  config:          SectionAdminContent
}

type ActionState = Record<string, 'loading' | 'done' | 'error'>

export function AdminInvitePanel({
  initialInvites,
  initialRequests,
  config,
}: AdminInvitePanelProps) {
  const [invites,  setInvites]  = useState<AdminInviteRow[]>(initialInvites)
  const [requests, setRequests] = useState<AdminInviteRow[]>(initialRequests)
  const [actions,  setActions]  = useState<ActionState>({})

  // ── Invite form state ────────────────────────────────────────────────────
  const [inviteEmail,   setInviteEmail]   = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviteStatus,  setInviteStatus]  = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [inviteError,   setInviteError]   = useState('')

  // ── Collapsible panel state ──────────────────────────────────────────────
  const [showInvites,  setShowInvites]  = useState(true)
  const [showRequests, setShowRequests] = useState(true)

  // ── CMS labels (with fallbacks) ──────────────────────────────────────────
  const c = {
    sectionHeading:      config.inviteSectionHeading    ?? 'Admin Access',
    formTitle:           config.inviteFormTitle         ?? 'Invite User to Admin',
    emailLabel:          config.inviteEmailLabel        ?? 'Email address',
    emailPlaceholder:    config.inviteEmailPlaceholder  ?? 'user@example.com',
    messageLabel:        config.inviteMessageLabel      ?? 'Note (optional)',
    sendLabel:           config.inviteSendLabel         ?? 'Send Invite',
    pendingInvitesHead:  config.pendingInvitesHeading   ?? 'Pending Invites',
    inviteEmpty:         config.inviteEmptyLabel        ?? 'No pending invites',
    cancelLabel:         config.cancelInviteLabel       ?? 'Cancel',
    pendingReqHead:      config.pendingRequestsHeading  ?? 'Access Requests',
    requestEmpty:        config.requestEmptyLabel       ?? 'No pending access requests',
    approveLabel:        config.approveLabel            ?? 'Approve',
    rejectLabel:         config.rejectLabel             ?? 'Reject',
    colEmail:            config.colEmail                ?? 'Email',
    colSentAt:           config.colSentAt               ?? 'Date',
    colActions:          config.colActions              ?? 'Actions',
  }

  // ── Send invite ──────────────────────────────────────────────────────────
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
        const errMsg = data.error ?? 'Failed to send invite'
        setInviteError(errMsg)
        setInviteStatus('error')
        toast.error(errMsg)
        return
      }

      setInviteStatus('success')
      setInviteEmail('')
      setInviteMessage('')

      if (data.directGrant) {
        // Direct admin promotion — no email sent, no pending row
        toast.success('Admin access granted directly')
      } else {
        // Full email-invite flow — pending row created, email sent
        toast.success('Email invite sent')
        if (data.invite) {
          setInvites((prev) => [
            { ...data.invite, requester_name: null, invited_by_name: null },
            ...prev,
          ])
        }
      }

      // Reset form status after 2s
      setTimeout(() => setInviteStatus('idle'), 2000)
    } catch {
      const errMsg = 'Network error — please try again'
      setInviteError(errMsg)
      setInviteStatus('error')
      toast.error(errMsg)
    }
  }

  // ── Take action on a row (approve / reject / cancel) ─────────────────────
  const handleAction = useCallback(
    async (id: string, action: 'approve' | 'reject' | 'cancel') => {
      setActions((prev) => ({ ...prev, [id]: 'loading' }))

      try {
        const res = await fetch(`/api/admin/invites/${id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ action }),
        })
        const data = await res.json()

        if (!res.ok) {
          const errMsg = data.error ?? `Failed to ${action}`
          console.error('Action failed:', errMsg)
          setActions((prev) => ({ ...prev, [id]: 'error' }))
          toast.error(errMsg)
          setTimeout(() => setActions((prev) => { const n = { ...prev }; delete n[id]; return n }), 3000)
          return
        }

        // Remove actioned row from the displayed list
        setInvites((prev)  => prev.filter((r)  => r.id !== id))
        setRequests((prev) => prev.filter((r) => r.id !== id))
        setActions((prev) => { const n = { ...prev }; delete n[id]; return n })

        const actionLabel = action === 'approve' ? 'Access approved' : action === 'reject' ? 'Request rejected' : 'Invite cancelled'
        toast.success(actionLabel)
      } catch {
        setActions((prev) => ({ ...prev, [id]: 'error' }))
        toast.error(`Network error — could not ${action}`)
        setTimeout(() => setActions((prev) => { const n = { ...prev }; delete n[id]; return n }), 3000)
      }
    },
    []
  )

  const pendingInvites  = invites.filter((r)  => r.status === 'pending')
  const pendingRequests = requests.filter((r) => r.status === 'pending')

  return (
    <div className="space-y-5 mt-8">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <UserPlus size={16} className="text-indigo-400" />
        <h2 className="text-white text-lg font-bold tracking-tight">{c.sectionHeading}</h2>
      </div>

      {/* ── Invite form ────────────────────────────────────────────────────── */}
      <div className="bg-[#13141c] border border-white/5 rounded-2xl p-5">
        <p className="text-white/60 text-sm font-semibold mb-4">{c.formTitle}</p>
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

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleSendInvite}
            disabled={!inviteEmail.trim() || inviteStatus === 'loading'}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-mono uppercase tracking-widest transition-colors cursor-pointer',
              inviteStatus === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 cursor-default'
                : !inviteEmail.trim() || inviteStatus === 'loading'
                ? 'bg-white/5 border border-white/10 text-white/25 cursor-not-allowed'
                : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
            )}
          >
            {inviteStatus === 'loading' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : inviteStatus === 'success' ? (
              <Check size={12} />
            ) : (
              <Send size={12} />
            )}
            {inviteStatus === 'success' ? 'Invite Sent!' : c.sendLabel}
          </button>
        </div>
      </div>

      {/* ── Pending invites ─────────────────────────────────────────────────── */}
      <CollapsibleTable
        heading={c.pendingInvitesHead}
        count={pendingInvites.length}
        open={showInvites}
        onToggle={() => setShowInvites((v) => !v)}
        emptyLabel={c.inviteEmpty}
        rows={pendingInvites}
        actions={actions}
        colEmail={c.colEmail}
        colSentAt={c.colSentAt}
        colActions={c.colActions}
        renderActions={(row) => (
          <ActionButton
            id={row.id}
            action="cancel"
            label={c.cancelLabel}
            state={actions[row.id]}
            variant="danger"
            onAction={handleAction}
          />
        )}
      />

      {/* ── Pending access requests ──────────────────────────────────────────── */}
      <CollapsibleTable
        heading={c.pendingReqHead}
        count={pendingRequests.length}
        open={showRequests}
        onToggle={() => setShowRequests((v) => !v)}
        emptyLabel={c.requestEmpty}
        rows={pendingRequests}
        actions={actions}
        colEmail={c.colEmail}
        colSentAt={c.colSentAt}
        colActions={c.colActions}
        renderActions={(row) => (
          <div className="flex items-center gap-2">
            <ActionButton
              id={row.id}
              action="approve"
              label={c.approveLabel}
              state={actions[row.id]}
              variant="success"
              onAction={handleAction}
            />
            <ActionButton
              id={row.id}
              action="reject"
              label={c.rejectLabel}
              state={actions[row.id]}
              variant="danger"
              onAction={handleAction}
            />
          </div>
        )}
      />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface CollapsibleTableProps {
  heading:       string
  count:         number
  open:          boolean
  onToggle:      () => void
  emptyLabel:    string
  rows:          AdminInviteRow[]
  actions:       ActionState
  colEmail:      string
  colSentAt:     string
  colActions:    string
  renderActions: (row: AdminInviteRow) => React.ReactNode
}

function CollapsibleTable({
  heading, count, open, onToggle, emptyLabel,
  rows, colEmail, colSentAt, colActions, renderActions,
}: CollapsibleTableProps) {
  return (
    <div className="bg-[#13141c] border border-white/5 rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-white/80 text-sm font-semibold">{heading}</h3>
          {count > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-full">
              {count}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={13} className="text-white/30" /> : <ChevronDown size={13} className="text-white/30" />}
      </button>

      {open && (
        <>
          {rows.length === 0 ? (
            <div className="flex items-center gap-2 px-5 py-5">
              <Mail size={14} className="text-white/15" />
              <p className="text-white/25 text-sm">{emptyLabel}</p>
            </div>
          ) : (
            <>
              {/* Column header */}
              <div className="grid grid-cols-[1fr_120px_auto] px-5 py-2.5 border-b border-white/5">
                {[colEmail, colSentAt, colActions].map((col) => (
                  <span key={col} className="text-white/25 text-[10px] uppercase tracking-widest font-medium">
                    {col}
                  </span>
                ))}
              </div>

              {rows.map((row, i) => (
                <div
                  key={row.id}
                  className={cn(
                    'grid grid-cols-[1fr_120px_auto] items-center px-5 py-3 hover:bg-white/[0.02] transition-colors',
                    i < rows.length - 1 && 'border-b border-white/5'
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-white/70 text-sm truncate">{row.email}</p>
                    {row.requester_name && (
                      <p className="text-white/30 text-xs truncate">{row.requester_name}</p>
                    )}
                    {row.message && (
                      <p className="text-white/25 text-xs italic truncate mt-0.5">{row.message}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-white/30 text-xs font-mono">
                    <Clock size={11} className="shrink-0" />
                    {format(new Date(row.created_at), 'MMM dd, yyyy')}
                  </div>

                  <div className="flex items-center justify-end">
                    {renderActions(row)}
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

interface ActionButtonProps {
  id:       string
  action:   'approve' | 'reject' | 'cancel'
  label:    string
  state:    'loading' | 'done' | 'error' | undefined
  variant:  'success' | 'danger'
  onAction: (id: string, action: 'approve' | 'reject' | 'cancel') => void
}

function ActionButton({ id, action, label, state, variant, onAction }: ActionButtonProps) {
  const isLoading = state === 'loading'
  const isError   = state === 'error'

  return (
    <button
      onClick={() => onAction(id, action)}
      disabled={isLoading}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold font-mono uppercase tracking-widest rounded-lg border transition-colors cursor-pointer',
        isError
          ? 'bg-red-500/15 border-red-500/30 text-red-300'
          : variant === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20'
          : 'bg-red-500/8 border-red-500/20 text-red-400/80 hover:bg-red-500/15',
        isLoading && 'cursor-not-allowed opacity-50'
      )}
    >
      {isLoading ? (
        <Loader2 size={10} className="animate-spin" />
      ) : isError ? (
        <X size={10} />
      ) : action === 'approve' ? (
        <Check size={10} />
      ) : (
        <X size={10} />
      )}
      {isError ? 'Error' : label}
    </button>
  )
}
