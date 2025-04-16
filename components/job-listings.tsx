"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Building } from "lucide-react"
import { getAllJobs } from "@/lib/firebase/jobs"
import type { Job } from "@/types"

interface JobListingsProps {
  limit?: number
}

export default function JobListings({ limit }: JobListingsProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchJobs() {
      setIsLoading(true)
      try {
        // getAllJobs ne récupère maintenant que les offres publiques
        const jobsData = await getAllJobs(limit)
        setJobs(jobsData)
      } catch (err) {
        console.error("Erreur lors du chargement des offres d'emploi:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobs()
  }, [limit])

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array(limit || 6)
          .fill(0)
          .map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <div className="flex justify-between items-center mt-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-28" />
              </CardFooter>
            </Card>
          ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium">Aucune offre d'emploi disponible</h3>
        <p className="mt-2 text-muted-foreground">Revenez plus tard pour voir les nouvelles offres.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <Card key={job.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="line-clamp-1">{job.title}</CardTitle>
            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Building className="mr-1 h-4 w-4" />
                <span className="truncate">{job.company.name}</span>
              </div>
              <Badge>{job.type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-2">
              {job.location && (
                <div className="flex items-center text-sm">
                  <MapPin className="mr-1 h-4 w-4" />
                  {job.location}
                </div>
              )}
              {job.salary && <p className="text-sm">Salaire: {job.salary}</p>}
              {job.description && <p className="text-sm line-clamp-3">{job.description}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Link href={`/jobs/${job.id}`}>
              <Button variant="outline" size="sm">
                Voir les détails
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

