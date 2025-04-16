import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Building, Lock } from "lucide-react"
import { getJobById } from "@/lib/firebase/jobs"
import ApplicationForm from "@/components/application-form"
import { auth } from "@/lib/firebase/config"

interface JobPageProps {
  params: {
    id: string
  }
}

export default function JobPage({ params }: JobPageProps) {
  return (
    <div className="container py-8">
      <Suspense fallback={<JobDetailSkeleton />}>
        <JobDetail id={params.id} />
      </Suspense>
    </div>
  )
}

async function JobDetail({ id }: { id: string }) {
  try {
    // Récupérer l'ID de l'utilisateur actuel si disponible
    const userId = auth.currentUser?.uid

    const job = await getJobById(id, userId)

    if (!job) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold">Offre d'emploi non trouvée ou accès non autorisé</h2>
          <p className="mt-2 text-muted-foreground">
            L'offre que vous recherchez n'existe pas, a été supprimée, ou est privée.
          </p>
          <Link href="/jobs" className="mt-4">
            <Button>Parcourir les offres</Button>
          </Link>
        </div>
      )
    }

    const postedDate = new Date(job.postedAt.seconds * 1000)
    const isOwner = userId === job.companyId

    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{job.title}</h1>
                {job.isPublic === false && (
                  <Badge variant="outline" className="flex items-center">
                    <Lock className="mr-1 h-3 w-3" /> Privée
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center text-muted-foreground">
                  <Building className="mr-1 h-4 w-4" />
                  {job.company.name}
                </div>
                {job.location && (
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="mr-1 h-4 w-4" />
                    {job.location}
                  </div>
                )}
                <Badge variant={job.type === "CDI" ? "default" : "outline"}>{job.type}</Badge>
                {job.salary && (
                  <div className="flex items-center text-muted-foreground mt-2">
                    <span className="font-medium">Salaire:</span>
                    <span className="ml-2">{job.salary}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="mr-1 h-4 w-4" />
                Publiée le {postedDate.toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-bold">Description du poste</h2>
            <div className="prose max-w-none">
              <p>{job.description || "Aucune description fournie."}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8 rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-bold">Postuler à cette offre</h2>
            <ApplicationForm jobId={job.id} questions={job.questions || []} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error fetching job details:", error)
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold">Erreur lors du chargement de l'offre</h2>
        <p className="mt-2 text-muted-foreground">
          Une erreur s'est produite lors du chargement de cette offre d'emploi.
        </p>
        <Link href="/jobs" className="mt-4">
          <Button>Parcourir les offres</Button>
        </Link>
      </div>
    )
  }
}

function JobDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-6">
          <Skeleton className="h-10 w-2/3" />
          <div className="mt-2 flex gap-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="rounded-lg border p-6">
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

