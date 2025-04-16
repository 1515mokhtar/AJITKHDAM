"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createJob, updateJob } from "@/lib/firebase/jobs"
import { toast } from "react-hot-toast"
import { Loader2, Globe, Lock } from "lucide-react"
import type { Job } from "@/types"

interface JobFormProps {
  job?: Job | null
  onSuccess: (job: Job, isNew: boolean) => void
  onCancel: () => void
}

export default function JobForm({ job, onSuccess, onCancel }: JobFormProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [type, setType] = useState("CDI")
  const [location, setLocation] = useState("")
  const [salary, setSalary] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pré-remplir le formulaire si nous modifions une offre existante
  useEffect(() => {
    if (job) {
      setTitle(job.title)
      setCompanyName(job.company.name)
      setType(job.type)
      setLocation(job.location || "")
      setSalary(job.salary || "")
      setDescription(job.description || "")
      setIsPublic(job.isPublic !== undefined ? job.isPublic : true)
    } else if (user) {
      // Pré-remplir le nom de l'entreprise pour une nouvelle offre
      setCompanyName(user.companyName || "")
    }
  }, [job, user])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = "Le nom du poste est requis"
    }

    if (!companyName.trim()) {
      newErrors.companyName = "Le nom de l'entreprise est requis"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!user) {
      toast.error("Vous devez être connecté pour publier une offre d'emploi")
      return
    }

    if (user.role !== "company") {
      toast.error("Seules les entreprises peuvent publier des offres d'emploi")
      return
    }

    setIsSubmitting(true)

    try {
      const jobData = {
        title,
        type,
        location,
        salary,
        description,
        companyId: user.uid,
        company: {
          name: companyName,
          logo: user.companyLogo || "/placeholder.svg?height=100&width=100",
        },
        isPublic, // Ajout de la propriété de visibilité
        postedAt: new Date(),
      }

      let result
      let updatedJob

      if (job) {
        // Mise à jour d'une offre existante
        result = await updateJob(job.id, jobData)
        if (result.success) {
          updatedJob = {
            ...job,
            ...jobData,
            updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
          }
          toast.success("Offre d'emploi mise à jour avec succès")
        }
      } else {
        // Création d'une nouvelle offre
        result = await createJob(jobData)
        if (result.success) {
          updatedJob = {
            id: result.id,
            ...jobData,
            postedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
          }
          toast.success("Offre d'emploi publiée avec succès")
        }
      }

      if (result.success && updatedJob) {
        onSuccess(updatedJob as Job, !job)
      } else {
        toast.error(result.error || "Une erreur s'est produite. Veuillez réessayer.")
      }
    } catch (error) {
      console.error("Erreur lors de la soumission de l'offre d'emploi:", error)
      toast.error("Une erreur inattendue s'est produite. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="flex items-center justify-between">
          Nom du poste *{errors.title && <span className="text-xs font-normal text-destructive">{errors.title}</span>}
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ex: Développeur Frontend"
          className={errors.title ? "border-destructive" : ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName" className="flex items-center justify-between">
          Nom de l'entreprise *
          {errors.companyName && <span className="text-xs font-normal text-destructive">{errors.companyName}</span>}
        </Label>
        <Input
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="ex: Acme Inc."
          className={errors.companyName ? "border-destructive" : ""}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Type de contrat</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Sélectionner le type de contrat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CDI">CDI</SelectItem>
              <SelectItem value="CDD">CDD</SelectItem>
              <SelectItem value="Stage">Stage</SelectItem>
              <SelectItem value="Freelance">Freelance</SelectItem>
              <SelectItem value="Alternance">Alternance</SelectItem>
              <SelectItem value="Temps partiel">Temps partiel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Lieu</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="ex: Paris, Remote"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="salary">Salaire</Label>
        <Input
          id="salary"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          placeholder="ex: 45000€ - 55000€ par an"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description du poste</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez les responsabilités, les exigences, les avantages, etc."
          className="min-h-[150px]"
        />
      </div>

      {/* Option de visibilité */}
      <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="visibility" className="text-base">
            Visibilité de l'offre
          </Label>
          <p className="text-sm text-muted-foreground">
            {isPublic ? (
              <span className="flex items-center">
                <Globe className="mr-1 h-4 w-4" />
                Publique - Visible par tous les utilisateurs
              </span>
            ) : (
              <span className="flex items-center">
                <Lock className="mr-1 h-4 w-4" />
                Privée - Visible uniquement par vous
              </span>
            )}
          </p>
        </div>
        <Switch id="visibility" checked={isPublic} onCheckedChange={setIsPublic} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {job ? "Mise à jour..." : "Publication..."}
            </>
          ) : job ? (
            "Mettre à jour l'offre"
          ) : (
            "Publier l'offre"
          )}
        </Button>
      </div>
    </form>
  )
}

