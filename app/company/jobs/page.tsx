"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { getEmployerJobs, deleteJob, updateJob } from "@/lib/firebase/jobs"
import { toast } from "react-hot-toast"
import { AlertCircle, Edit, Plus, Trash2, XCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Job } from "@/types"
import JobForm from "@/components/job-form"

export default function CompanyJobsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExpiringJob, setIsExpiringJob] = useState(false)
  const [isClosingJob, setIsClosingJob] = useState(false)

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

  const handleExpireJob = async (job: Job) => {
    setIsExpiringJob(true)
    try {
      const result = await updateJob(job.id, {
        deadline: {
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: 0
        },
        status: 'expired'
      })

      if (result.success) {
        setJobs(jobs.map(j => j.id === job.id ? {
          ...job,
          deadline: {
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: 0
          },
          status: 'expired'
        } : j))
        toast.success("L'offre a été marquée comme expirée")
      } else {
        toast.error(result.error || "Une erreur s'est produite lors de l'expiration de l'offre")
      }
    } catch (error) {
      console.error("Erreur lors de l'expiration de l'offre:", error)
      toast.error("Une erreur s'est produite lors de l'expiration de l'offre")
    } finally {
      setIsExpiringJob(false)
    }
  }

  const handleCloseJob = async (job: Job) => {
    setIsClosingJob(true)
    try {
      const result = await updateJob(job.id, {
        status: 'closed',
        deadline: {
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: 0
        }
      })

      if (result.success) {
        setJobs(jobs.map(j => j.id === job.id ? {
          ...job,
          status: 'closed',
          deadline: {
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: 0
          }
        } : j))
        toast.success("L'offre a été clôturée avec succès")
      } else {
        toast.error(result.error || "Une erreur s'est produite lors de la clôture de l'offre")
      }
    } catch (error) {
      console.error("Erreur lors de la clôture de l'offre:", error)
      toast.error("Une erreur s'est produite lors de la clôture de l'offre")
    } finally {
      setIsClosingJob(false)
    }
  }

  // Si l'utilisateur n'est pas connecté ou n'est pas une entreprise
  if (!user) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold">Veuillez vous connecter</h2>
          <p className="mt-2 text-muted-foreground">Vous devez être connecté pour accéder à cette page.</p>
          <Button className="mt-4" onClick={() => router.push("/login?redirect=/company/jobs")}>
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
          <h1 className="text-3xl font-bold">Gestion des offres d'emploi</h1>
          <p className="text-muted-foreground mt-1">Créez et gérez vos offres d'emploi</p>
        </div>
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0" onClick={() => setSelectedJob(null)}>
              <Plus className="mr-2 h-4 w-4" /> Créer une offre d'emploi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedJob ? "Modifier l'offre d'emploi" : "Créer une offre d'emploi"}</DialogTitle>
              <DialogDescription>
                {selectedJob
                  ? "Modifiez les détails de votre offre d'emploi ci-dessous."
                  : "Remplissez les détails de votre nouvelle offre d'emploi."}
              </DialogDescription>
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
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="active">
        <TabsList className="mb-6">
          <TabsTrigger value="active">Offres actives</TabsTrigger>
          <TabsTrigger value="expired">Offres expirées</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {isLoading ? (
            <div className="text-center py-8">Chargement des offres d'emploi...</div>
          ) : jobs.filter((job) => job.deadline && new Date(job.deadline.seconds * 1000) > new Date()).length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs
                .filter((job) => job.deadline && new Date(job.deadline.seconds * 1000) > new Date())
                .map((job) => (
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
                    onExpire={() => handleExpireJob(job)}
                    onClose={() => handleCloseJob(job)}
                  />
                ))}
            </div>
          ) : (
            <div className="rounded-lg border p-8 text-center">
              <h3 className="text-lg font-medium">Aucune offre d'emploi active</h3>
              <p className="mt-2 text-muted-foreground">Vous n'avez pas encore d'offres d'emploi actives.</p>
              <Button
                className="mt-4"
                onClick={() => {
                  setSelectedJob(null)
                  setIsFormDialogOpen(true)
                }}
              >
                Créer votre première offre
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired">
          {isLoading ? (
            <div className="text-center py-8">Chargement des offres d'emploi...</div>
          ) : jobs.filter((job) => job.deadline && new Date(job.deadline.seconds * 1000) <= new Date()).length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs
                .filter((job) => job.deadline && new Date(job.deadline.seconds * 1000) <= new Date())
                .map((job) => (
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
                    isExpired
                  />
                ))}
            </div>
          ) : (
            <div className="rounded-lg border p-8 text-center">
              <h3 className="text-lg font-medium">Aucune offre d'emploi expirée</h3>
              <p className="mt-2 text-muted-foreground">Vous n'avez pas d'offres d'emploi expirées.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
  onExpire?: () => void
  onClose?: () => void
  isExpired?: boolean
}

function JobCard({ job, onEdit, onDelete, onExpire, onClose, isExpired = false }: JobCardProps) {
  const deadlineDate = job.deadline ? new Date(job.deadline.seconds * 1000) : new Date()
  const postedDate = new Date(job.postedAt.seconds * 1000)
  const daysLeft = job.deadline ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0

  return (
    <Card className={isExpired ? "border-muted" : ""}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="line-clamp-1">{job.title}</CardTitle>
            <CardDescription className="mt-1">{job.location}</CardDescription>
          </div>
          <Badge variant={isExpired ? "outline" : "default"}>{job.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm font-medium">Salaire: {job.salary}</p>
          <p className="text-sm line-clamp-3">{job.description}</p>
          <div className="text-xs text-muted-foreground">
            {job.deadline ? (
              isExpired ? (
                <span>Expirée le {deadlineDate.toLocaleDateString()}</span>
              ) : (
                <span>
                  Expire dans {daysLeft} jour{daysLeft !== 1 ? "s" : ""}
                </span>
              )
            ) : (
              <span>Pas de date limite</span>
            )}
            <span className="mx-1">•</span>
            <span>Publiée le {postedDate.toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 w-full">
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" /> Modifier
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Supprimer
          </Button>
        </div>
        {!isExpired && onExpire && onClose && (
          <div className="flex justify-between w-full gap-2">
            <Button variant="secondary" size="sm" onClick={onExpire} className="flex-1">
              <XCircle className="h-4 w-4 mr-2" /> Expirer l'offre
            </Button>
            <Button variant="default" size="sm" onClick={onClose} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" /> Clôturer l'offre
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

