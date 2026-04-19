// features/admin/components/AdminUsersTable.tsx
'use client'

import { format } from 'date-fns'
import { useState } from 'react'
import { Shield, Crown, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/supabase'
import type { SectionAdminContent } from '@/types/cms'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AdminUsersTableProps {
  users: Profile[]
  config: SectionAdminContent
}

/** Avatar with graceful fallback when the image URL is missing or broken. */
function UserAvatar({ avatarUrl, displayName }: { avatarUrl: string | null; displayName: string | null }) {
  const [failed, setFailed] = useState(false)

  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        alt={displayName ?? ''}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    )
  }
  return <User size={12} className="text-indigo-300" />
}

export function AdminUsersTable({ users, config }: AdminUsersTableProps) {
  const proCount  = users.filter((u) => u.subscription_tier === 'pro').length
  const freeCount = users.filter((u) => u.subscription_tier === 'free').length

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-indigo-400" />
            <h1 className="text-white text-2xl font-bold tracking-tight">
              {config.heading ?? 'Admin Panel'}
            </h1>
          </div>
          <p className="text-white/35 text-sm mt-1">
            {config.subheading ?? 'All users and their subscription tiers — admin access only.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <span className="text-indigo-300 text-xs font-mono">
              {users.length} {config.totalUsersLabel ?? 'total users'}
            </span>
          </div>
          <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <span className="text-purple-300 text-xs font-mono">{proCount} {config.proLabel ?? 'pro'}</span>
          </div>
          <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
            <span className="text-white/40 text-xs font-mono">{freeCount} {config.freeLabel ?? 'free'}</span>
          </div>
        </div>
      </div>

      <div className="bg-[#13141c] border border-white/5 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[32px_1fr_120px_80px_140px] px-5 py-3 border-b border-white/5">
          {['', config.colUser ?? 'User', config.colPlan ?? 'Plan', config.colRole ?? 'Role', config.colJoined ?? 'Joined'].map((col) => (
            <span key={col} className="text-white/25 text-[10px] uppercase tracking-widest font-medium">
              {col}
            </span>
          ))}
        </div>

        {users.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-white/30 text-sm">{config.emptyLabel ?? 'No users found'}</p>
          </div>
        ) : (
          users.map((user, i) => (
            <div
              key={user.id}
              className={cn(
                'grid grid-cols-[32px_1fr_120px_80px_140px] items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors',
                i < users.length - 1 && 'border-b border-white/5'
              )}
            >
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden shrink-0">
                <UserAvatar avatarUrl={user.avatar_url} displayName={user.display_name} />
              </div>

              <div className="min-w-0 pl-2">
                <p className="text-white/80 text-sm font-medium truncate">
                  {user.display_name ?? 'Anonymous'}
                </p>
                <p className="text-white/30 text-xs truncate">{user.email}</p>
              </div>

              <div>
                <span className={cn(
                  'flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full w-fit',
                  user.subscription_tier === 'pro'
                    ? 'text-purple-300 bg-purple-500/15 border border-purple-500/20'
                    : 'text-white/30 bg-white/5 border border-white/10'
                )}>
                  {user.subscription_tier === 'pro' && <Crown size={8} />}
                  {user.subscription_tier}
                </span>
              </div>

              <span className={cn(
                'text-[10px] font-semibold uppercase tracking-wide',
                user.role === 'admin' ? 'text-indigo-400' : 'text-white/30'
              )}>
                {user.role}
              </span>

              <span className="text-white/30 text-xs font-mono">
                {user.created_at
                  ? format(new Date(user.created_at), 'MMM dd, yyyy')
                  : '—'}
              </span>
            </div>
          ))
        )}
      </div>

      <p className="text-white/15 text-[10px] font-mono uppercase tracking-widest">
        {config.footerNote ?? 'Data fetched via Supabase service role key — server-side only'}
      </p>
    </div>
  )
}