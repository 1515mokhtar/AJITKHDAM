"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

export function LoginRedirect() {
  const { user, loading, isChecking } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Ne pas rediriger pendant la vérification initiale
    if (isChecking) return

    // Si l'utilisateur est connecté et a le rôle "chercheur", rediriger vers le dashboard
    if (!loading && user?.role === "chercheur") {
      router.push("/dashboard")
    }
  }, [user, loading, isChecking, router])

  // Afficher un état de chargement pendant la vérification
  if (loading || isChecking) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return null
} 