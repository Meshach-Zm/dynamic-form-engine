// app/page.tsx
// Dashboard — stat grid + forms list + activity feed.

import { getForms } from '@/lib/api'
import { computeStats, deriveActivity } from '@/lib/dashboard'
import { FormList } from '@/components/dashboard/FormList'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'

export default async function DashboardPage() {
  const forms = await getForms()
  const stats = computeStats(forms)
  const activity = deriveActivity(forms)

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 border-b border-black/10 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
          Overview
        </p>
        <h1 className="mt-2 text-xl font-black uppercase tracking-[0.06em]">
          Dashboard
        </h1>
      </div>

      <p className="mt-10 mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
        Your forms
      </p>
      <FormList forms={forms} />

      <p className="mt-10 mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
        Recent activity
      </p>
      <ActivityFeed items={activity} />
    </div>
  )
}