"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isChecking } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Ne pas rediriger pendant la vérification initiale
    if (isChecking) return

    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    if (!loading && !user) {
      router.push("/login")
      return
    }

    // Si des rôles sont spécifiés, vérifier que l'utilisateur a un rôle autorisé
    if (user && allowedRoles && !allowedRoles.includes(user.role || "")) {
      router.push("/login")
    }
  }, [user, loading, isChecking, router, pathname, allowedRoles])

  // Afficher un état de chargement pendant la vérification
  if (loading || isChecking) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Si l'utilisateur n'est pas connecté, ne rien afficher
  if (!user) {
    return null
  }

  // Si des rôles sont spécifiés et que l'utilisateur n'a pas un rôle autorisé, ne rien afficher
  if (allowedRoles && !allowedRoles.includes(user.role || "")) {
    return null
  }

  return <>{children}</>
} 