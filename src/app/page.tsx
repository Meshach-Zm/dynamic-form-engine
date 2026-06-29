import { getForms } from '@/lib/api'
import { computeStats, deriveActivity } from '@/lib/dashboard'
import { FormList } from '@/components/dashboard/FormList'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'

// ✅ Add this line to prevent static generation
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const forms = await getForms()
  const stats = computeStats(forms)
  const activity = deriveActivity(forms)

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 border-b border-black/10 pb-6">
        <p className="text-sm font-medium text-neutral-500">Overview</p>
        <h1 className="mt-2 text-2xl font-bold">Dashboard</h1>
      </div>

      <p className="mt-10 mb-4 text-sm font-medium text-neutral-500">Your forms</p>
      <FormList forms={forms} />

      <p className="mt-10 mb-4 text-sm font-medium text-neutral-500">Recent activity</p>
      <ActivityFeed items={activity} />
    </div>
  )
}