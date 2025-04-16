"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import JobForm from "@/components/job-form"
import type { Job } from "@/types"

export default function PublierOffrePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  // Gérer la création réussie d'une offre
  const handleJobCreated = (job: Job) => {
    router.push("/mes-offres")
  }

  // Si l'utilisateur n'est pas connecté ou n'est pas une entreprise
  if (!user) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold">Veuillez vous connecter</h2>
          <p className="mt-2 text-muted-foreground">Vous devez être connecté pour publier une offre d'emploi.</p>
          <Button className="mt-4" onClick={() => router.push("/login?redirect=/publier-offre")}>
            Se connecter
          </Button>
        </div>
      </div>
    )
  }

  if (user.role !== "company") {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold">Accès réservé aux entreprises</h2>
          <p className="mt-2 text-muted-foreground">
            Seuls les utilisateurs avec un compte entreprise peuvent publier des offres d'emploi.
          </p>
          <Button className="mt-4" onClick={() => router.push("/dashboard")}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Publier une offre d'emploi</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Détails de l'offre</CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour publier votre offre d'emploi. Les champs marqués d'un astérisque
            (*) sont obligatoires.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JobForm onSuccess={handleJobCreated} onCancel={() => router.push("/mes-offres")} />
        </CardContent>
      </Card>
    </div>
  )
}

