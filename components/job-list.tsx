"use client"

import { useEffect, useState } from "react"
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import JobCard from "@/components/job-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { JobFilters } from "@/components/job-filters"
import type { Job } from "@/types"

interface JobListProps {
  initialFilters?: JobFilters
  limit?: number
}

export default function JobList({ initialFilters, limit: itemsPerPage = 10 }: JobListProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<JobFilters>(
    initialFilters || {
      type: "",
      location: [],
      keyword: "",
    },
  )

  // Fetch jobs with filters
  const fetchJobs = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("Fetching public jobs from jobs collection...")

      // Get all public jobs from the jobs collection
      const jobsQuery = query(
        collection(db, "jobs"),
        where("isPublic", "==", true),
        orderBy("postedAt", "desc")
      )

      console.log("Query built:", jobsQuery)

      const snapshot = await getDocs(jobsQuery)
      console.log("Number of jobs found:", snapshot.size)
      console.log("Snapshot empty:", snapshot.empty)
      console.log("Snapshot docs:", snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          isPublic: data.isPublic,
          title: data.title,
          postedAt: data.postedAt
        }
      }))

      // Get the jobs data
      let fetchedJobs = snapshot.docs.map((doc) => {
        const data = doc.data()
        console.log("Job document:", {
          id: doc.id,
          path: doc.ref.path,
          data: data
        })
        return {
          id: doc.id,
          title: data.title || "",
          description: data.description || "",
          type: data.type || "",
          location: data.location || "",
          company: {
            name: data.company?.name || "",
            logo: data.company?.logo || "",
          },
          companyId: data.companyId || "",
          contactInfo: data.contactInfo || "",
          educationLevel: data.educationLevel || "",
          isPublic: data.isPublic || false,
          salary: data.salary || "",
          availabilitySlots: data.availabilitySlots || [],
          createdAt: data.postedAt || { seconds: Date.now() / 1000, nanoseconds: 0 },
          postedAt: data.postedAt || { seconds: Date.now() / 1000, nanoseconds: 0 },
        }
      }) as Job[]

      console.log("Processed jobs:", fetchedJobs)

      // Apply type filter (radio button)
      if (filters.type) {
        fetchedJobs = fetchedJobs.filter(job => job.type === filters.type)
        console.log("Applied type filter:", filters.type)
      }

      // Apply client-side filtering for location
      if (filters.location.length > 0) {
        fetchedJobs = fetchedJobs.filter((job) => {
          const jobLocationId = (job.location || "").toLowerCase().replace(/\s+/g, "-")
          return filters.location.includes(jobLocationId)
        })
      }

      // Apply keyword search
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        fetchedJobs = fetchedJobs.filter(
          (job) => 
            (job.title || "").toLowerCase().includes(keyword) || 
            (job.description || "").toLowerCase().includes(keyword),
        )
      }

      console.log("Final filtered jobs:", fetchedJobs)
      setJobs(fetchedJobs)
    } catch (err) {
      console.error("Error fetching jobs:", err)
      setError("Impossible de charger les offres d'emploi. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle filter changes
  const handleFilterChange = (newFilters: JobFilters) => {
    setFilters(newFilters)
    fetchJobs()
  }

  if (isLoading && jobs.length === 0) {
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
                  <div className="flex gap-2 mt-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full mt-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          ))}
      </div>
    )
  }

  if (error && jobs.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <h3 className="text-lg font-medium text-red-500">Erreur</h3>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button onClick={() => fetchJobs()} className="mt-4">
          Réessayer
        </Button>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <h3 className="text-lg font-medium">Aucune offre d'emploi trouvée</h3>
        <p className="mt-2 text-muted-foreground">
          {filters.keyword || filters.type || filters.location.length > 0
            ? "Essayez de modifier vos filtres pour trouver plus d'offres."
            : "Il n'y a pas encore d'offres d'emploi publiées."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  )
}

