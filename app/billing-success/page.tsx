import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout'

export const dynamic = 'force-dynamic'

export default async function BillingSuccessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/billing-success')

  return (
    <DashboardLayout lang="en">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">Payment successful</h1>
        <p className="text-white/50 text-sm mb-1 max-w-sm">
          Your subscription is being activated. This usually takes a few seconds.
        </p>
        <p className="text-white/30 text-xs mb-8 max-w-sm">
          Your plan will update automatically — no need to refresh.
        </p>
        <Link
          href="/billing"
          className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          Go to Billing
        </Link>
      </div>
    </DashboardLayout>
  )
}
