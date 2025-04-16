"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getJobApplications } from "@/lib/firebase/applications"
import type { Application } from "@/types"

interface ApplicationListProps {
  jobId: string
}

export default function ApplicationList({ jobId }: ApplicationListProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    async function fetchApplications() {
      setIsLoading(true)
      const applicationsData = await getJobApplications(jobId)
      setApplications(applicationsData)
      setIsLoading(false)
    }

    fetchApplications()
  }, [jobId])

  const filteredApplications = applications.filter((app) => {
    if (filter === "all") return true
    return app.status === filter
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading applications...</div>
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <h3 className="text-lg font-medium">No applications yet</h3>
        <p className="mt-2 text-muted-foreground">You haven't received any applications for this job yet.</p>
      </div>
    )
  }

  return (
    <div>
      <Tabs defaultValue="all" onValueChange={setFilter}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({applications.filter((a) => a.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="interview">
            Interview ({applications.filter((a) => a.status === "interview").length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({applications.filter((a) => a.status === "accepted").length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({applications.filter((a) => a.status === "rejected").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          <div className="space-y-4">
            {filteredApplications.length === 0 ? (
              <div className="rounded-lg border p-4 text-center">
                <p className="text-muted-foreground">No applications with this status</p>
              </div>
            ) : (
              filteredApplications.map((application) => (
                <div key={application.id} className="rounded-lg border p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-medium">{application.user.name}</h3>
                      <p className="text-sm text-muted-foreground">{application.user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Applied on {new Date(application.appliedAt.seconds * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        View CV
                      </Button>
                      <Button size="sm">View Details</Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

