"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { getEmployerJobs, deleteJob } from "@/lib/firebase/jobs"
import { toast } from "react-hot-toast"
import { AlertCircle, Edit, Plus, Trash2, Globe, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Job } from "@/types"
import JobForm from "@/components/job-form"

export default function MesOffresPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Vérifier si l'utilisateur est une entreprise
  useEffect(() => {
    if (user && user.role !== "company") {
      router.push("/dashboard")
    }
  }, [user, router])

  // Charger les offres d'emploi de l'entreprise
  useEffect(() => {
    async function fetchJobs() {
      if (user && user.role === "company") {
        setIsLoading(true)
        try {
          const jobsData = await getEmployerJobs(user.uid)
          setJobs(jobsData)
        } catch (err) {
          console.error("Erreur lors du chargement des offres d'emploi:", err)
          setError("Impossible de charger vos offres d'emploi. Veuillez réessayer.")
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchJobs()
  }, [user])

  // Gérer la suppression d'une offre d'emploi
  const handleDeleteJob = async () => {
    if (!selectedJob) return

    setIsDeleting(true)
    try {
      const result = await deleteJob(selectedJob.id)
      if (result.success) {
        setJobs(jobs.filter((job) => job.id !== selectedJob.id))
        toast.success("Offre d'emploi supprimée avec succès")
      } else {
        toast.error(result.error || "Échec de la suppression de l'offre d'emploi")
      }
    } catch (err) {
      console.error("Erreur lors de la suppression de l'offre d'emploi:", err)
      toast.error("Une erreur s'est produite lors de la suppression de l'offre d'emploi")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setSelectedJob(null)
    }
  }

  // Gérer la mise à jour de la liste des offres d'emploi après création/modification
  const handleJobUpdated = (updatedJob: Job, isNew = false) => {
    if (isNew) {
      setJobs([updatedJob, ...jobs])
    } else {
      setJobs(jobs.map((job) => (job.id === updatedJob.id ? updatedJob : job)))
    }
    setIsFormDialogOpen(false)
    setSelectedJob(null)
  }

  // Filtrer les offres selon leur visibilité
  const publicJobs = jobs.filter((job) => job.isPublic)
  const privateJobs = jobs.filter((job) => !job.isPublic)

  // Si l'utilisateur n'est pas connecté ou n'est pas une entreprise
  if (!user) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold">Veuillez vous connecter</h2>
          <p className="mt-2 text-muted-foreground">Vous devez être connecté pour accéder à cette page.</p>
          <Button className="mt-4" onClick={() => router.push("/login?redirect=/mes-offres")}>
            Se connecter
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mes offres d'emploi</h1>
          <p className="text-muted-foreground mt-1">Gérez vos offres d'emploi publiées</p>
        </div>
        <Button className="mt-4 md:mt-0" onClick={() => router.push("/publier-offre")}>
          <Plus className="mr-2 h-4 w-4" /> Publier une offre
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">Toutes les offres</TabsTrigger>
          <TabsTrigger value="public">
            <Globe className="mr-2 h-4 w-4" /> Publiques ({publicJobs.length})
          </TabsTrigger>
          <TabsTrigger value="private">
            <Lock className="mr-2 h-4 w-4" /> Privées ({privateJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <div className="text-center py-8">Chargement des offres d'emploi...</div>
          ) : jobs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onEdit={() => {
                    setSelectedJob(job)
                    setIsFormDialogOpen(true)
                  }}
                  onDelete={() => {
                    setSelectedJob(job)
                    setIsDeleteDialogOpen(true)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border p-8 text-center">
              <h3 className="text-lg font-medium">Aucune offre d'emploi</h3>
              <p className="mt-2 text-muted-foreground">Vous n'avez pas encore publié d'offres d'emploi.</p>
              <Button className="mt-4" onClick={() => router.push("/publier-offre")}>
                Publier votre première offre
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="public">
          {isLoading ? (
            <div className="text-center py-8">Chargement des offres d'emploi...</div>
          ) : publicJobs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {publicJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onEdit={() => {
                    setSelectedJob(job)
                    setIsFormDialogOpen(true)
                  }}
                  onDelete={() => {
                    setSelectedJob(job)
                    setIsDeleteDialogOpen(true)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border p-8 text-center">
              <h3 className="text-lg font-medium">Aucune offre publique</h3>
              <p className="mt-2 text-muted-foreground">Vous n'avez pas encore publié d'offres d'emploi publiques.</p>
              <Button className="mt-4" onClick={() => router.push("/publier-offre")}>
                Publier une offre
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="private">
          {isLoading ? (
            <div className="text-center py-8">Chargement des offres d'emploi...</div>
          ) : privateJobs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {privateJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onEdit={() => {
                    setSelectedJob(job)
                    setIsFormDialogOpen(true)
                  }}
                  onDelete={() => {
                    setSelectedJob(job)
                    setIsDeleteDialogOpen(true)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border p-8 text-center">
              <h3 className="text-lg font-medium">Aucune offre privée</h3>
              <p className="mt-2 text-muted-foreground">Vous n'avez pas encore publié d'offres d'emploi privées.</p>
              <Button className="mt-4" onClick={() => router.push("/publier-offre")}>
                Publier une offre
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogue de modification d'offre */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'offre d'emploi</DialogTitle>
            <DialogDescription>Modifiez les détails de votre offre d'emploi ci-dessous.</DialogDescription>
          </DialogHeader>
          <JobForm
            job={selectedJob}
            onSuccess={handleJobUpdated}
            onCancel={() => {
              setIsFormDialogOpen(false)
              setSelectedJob(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette offre d'emploi ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteJob} disabled={isDeleting}>
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface JobCardProps {
  job: Job
  onEdit: () => void
  onDelete: () => void
}

function JobCard({ job, onEdit, onDelete }: JobCardProps) {
  const postedDate = new Date(job.postedAt.seconds * 1000)

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-1">{job.title}</CardTitle>
          <Badge variant={job.isPublic ? "default" : "outline"}>{job.isPublic ? "Publique" : "Privée"}</Badge>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm text-muted-foreground">{job.company.name}</span>
          <Badge variant="secondary">{job.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {job.location && <p className="text-sm">Lieu: {job.location}</p>}
          {job.salary && <p className="text-sm">Salaire: {job.salary}</p>}
          {job.description && <p className="text-sm line-clamp-3">{job.description}</p>}
          <p className="text-xs text-muted-foreground">Publiée le {postedDate.toLocaleDateString()}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" /> Modifier
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" /> Supprimer
        </Button>
      </CardFooter>
    </Card>
  )
}

