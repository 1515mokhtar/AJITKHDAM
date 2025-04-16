"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ShieldAlert, Loader2, UserX } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { getUserApplications } from "@/lib/firebase/applications"
import { getSavedJobs } from "@/lib/firebase/users"
import { getEmployerJobs } from "@/lib/firebase/jobs"
import JobCard from "@/components/job-card"
import ApplicationCard from "@/components/application-card"
import ApplicationList from "@/components/application-list"
import type { Job, Application } from "@/types"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      // Attendre un peu pour montrer le message de vérification
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (!user) {
        router.push("/login?redirect=/dashboard")
      } else {
        setIsChecking(false)
      }
    }

    checkAccess()
  }, [user, router])

  // Page de chargement pendant la vérification
  if (isChecking) {
    return (
      <div className="container max-w-xl mx-auto py-20">
        <div className="flex flex-col items-center justify-center p-8 text-center bg-background rounded-lg border">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <h2 className="text-2xl font-bold mb-2">Vérification en cours...</h2>
          <p className="text-muted-foreground">
            Nous vérifions vos autorisations d'accès au tableau de bord.
          </p>
        </div>
      </div>
    )
  }

  // Page d'erreur pour les comptes entreprises
  if (user?.role === "company") {
    return (
      <div className="container max-w-xl mx-auto py-20">
        <div className="flex flex-col items-center justify-center p-8 text-center bg-destructive/10 rounded-lg border border-destructive">
          <ShieldAlert className="h-10 w-10 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Accès refusé</h2>
          <p className="text-muted-foreground mb-6">
            Le tableau de bord est réservé aux chercheurs d'emploi. En tant qu'entreprise, 
            vous pouvez gérer vos offres d'emploi depuis votre espace entreprise.
          </p>
          <Link href="/profile/entdetails">
            <Button>Accéder à mon espace entreprise</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Page d'erreur pour les utilisateurs non-chercheurs
  if (user?.role !== "chercheur") {
    return (
      <div className="container max-w-xl mx-auto py-20">
        <div className="flex flex-col items-center justify-center p-8 text-center bg-warning/10 rounded-lg border border-warning">
          <UserX className="h-10 w-10 text-warning mb-4" />
          <h2 className="text-2xl font-bold mb-2">Accès non autorisé</h2>
          <p className="text-muted-foreground mb-6">
            Le tableau de bord est réservé aux chercheurs d'emploi. 
            Si vous êtes un chercheur d'emploi, veuillez mettre à jour votre profil.
          </p>
          <Link href="/">
            <Button variant="outline">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Afficher le tableau de bord pour les chercheurs
  return <SeekerDashboard />
}

function SeekerDashboard() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [savedJobs, setSavedJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (user) {
        setIsLoading(true)
        const [applicationsData, savedJobsData] = await Promise.all([
          getUserApplications(user.uid),
          getSavedJobs(user.uid),
        ])
        setApplications(applicationsData)
        setSavedJobs(savedJobsData)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Job Seeker Dashboard</h1>

      <Tabs defaultValue="applications">
        <TabsList className="mb-6">
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="saved">Saved Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          {isLoading ? (
            <div className="text-center py-8">Loading applications...</div>
          ) : applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border p-8 text-center">
              <h3 className="text-lg font-medium">No applications yet</h3>
              <p className="mt-2 text-muted-foreground">You haven't applied to any jobs yet.</p>
              <Link href="/jobs" className="mt-4 inline-block">
                <Button>Browse Jobs</Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved">
          {isLoading ? (
            <div className="text-center py-8">Loading saved jobs...</div>
          ) : savedJobs.length > 0 ? (
            <div className="space-y-4">
              {savedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border p-8 text-center">
              <h3 className="text-lg font-medium">No saved jobs</h3>
              <p className="mt-2 text-muted-foreground">You haven't saved any jobs yet.</p>
              <Link href="/jobs" className="mt-4 inline-block">
                <Button>Browse Jobs</Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmployerDashboard() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchJobs() {
      if (user) {
        setIsLoading(true)
        const jobsData = await getEmployerJobs(user.uid)
        setJobs(jobsData)
        if (jobsData.length > 0 && !selectedJobId) {
          setSelectedJobId(jobsData[0].id)
        }
        setIsLoading(false)
      }
    }

    fetchJobs()
  }, [user, selectedJobId])

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Employer Dashboard</h1>
        <Link href="/jobs/post">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Post a Job
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="jobs">
        <TabsList className="mb-6">
          <TabsTrigger value="jobs">My Job Listings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          {isLoading ? (
            <div className="text-center py-8">Loading job listings...</div>
          ) : jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} isEmployer={true} onSelect={() => setSelectedJobId(job.id)} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border p-8 text-center">
              <h3 className="text-lg font-medium">No job listings</h3>
              <p className="mt-2 text-muted-foreground">You haven't posted any jobs yet.</p>
              <Link href="/jobs/post" className="mt-4 inline-block">
                <Button>Post Your First Job</Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications">
          {jobs.length === 0 ? (
            <div className="rounded-lg border p-8 text-center">
              <h3 className="text-lg font-medium">No applications</h3>
              <p className="mt-2 text-muted-foreground">You need to post jobs to receive applications.</p>
              <Link href="/jobs/post" className="mt-4 inline-block">
                <Button>Post a Job</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="md:col-span-1">
                <div className="rounded-lg border p-4">
                  <h3 className="mb-4 font-medium">Select a job</h3>
                  <div className="space-y-2">
                    {jobs.map((job) => (
                      <Button
                        key={job.id}
                        variant={selectedJobId === job.id ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSelectedJobId(job.id)}
                      >
                        {job.title}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="md:col-span-3">
                {selectedJobId ? (
                  <ApplicationList jobId={selectedJobId} />
                ) : (
                  <div className="rounded-lg border p-8 text-center">
                    <h3 className="text-lg font-medium">Select a job</h3>
                    <p className="mt-2 text-muted-foreground">Please select a job to view its applications.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

