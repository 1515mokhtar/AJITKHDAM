import { Suspense } from "react"
import JobFilters from "@/components/job-filters"
import JobList from "@/components/job-list"
import { Skeleton } from "@/components/ui/skeleton"

export default function JobsPage() {
  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Browse Jobs</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <JobFilters />
        </div>
        <div className="md:col-span-3">
          <Suspense fallback={<JobListSkeleton />}>
            <JobList />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function JobListSkeleton() {
  return (
    <div className="space-y-4">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        ))}
    </div>
  )
}

