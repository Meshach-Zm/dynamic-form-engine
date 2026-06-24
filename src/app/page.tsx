import { getForms } from '@/lib/api'
import { computeStats, deriveActivity } from '@/lib/dashboard'
import { NavBar } from '@/components/dashboard/NavBar'
import { HeroSection } from '@/components/dashboard/HeroSection'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { FormList } from '@/components/dashboard/FormList'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'

export default async function HomePage() {
  const forms = await getForms()
  const stats = computeStats(forms)
  const activity = deriveActivity(forms)

  return (
    <>
      <NavBar />
      <HeroSection />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <StatsGrid stats={stats} />

        <p className="mt-12 mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
          Your forms
        </p>
        <FormList forms={forms} />

        <p className="mt-12 mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
          Recent activity
        </p>

        <ActivityFeed items={activity} />
      </main>
    </>
  )
}