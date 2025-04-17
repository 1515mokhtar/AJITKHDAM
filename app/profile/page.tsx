"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { ComProfileForm } from "@/components/comprofile/ComProfileForm"

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (!loading && user && user.role !== "company") {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user || user.role !== "company") {
    return null
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profil de l'entreprise</h1>
          <p className="mt-2 text-muted-foreground">
            Complétez votre profil pour pouvoir publier des offres d'emploi
          </p>
        </div>
        <ComProfileForm />
      </div>
    </div>
  )
}
