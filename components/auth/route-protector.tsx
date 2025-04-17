"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Loader2 } from "lucide-react"

interface RouteProtectorProps {
  children: React.ReactNode
  allowedRoles: string[]
  unauthorizedRedirect?: string
  unauthenticatedRedirect?: string
}

export function RouteProtector({
  children,
  allowedRoles,
  unauthorizedRedirect = "/unauthorized",
  unauthenticatedRedirect = "/login",
}: RouteProtectorProps) {
  const { user, isChecking } = useAuth()
  const router = useRouter()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Ne rien faire tant que la vérification est en cours
    if (isChecking) return

    // Empêcher les redirections multiples
    if (hasRedirected.current) return

    // Si l'utilisateur n'est pas connecté
    if (!user) {
      hasRedirected.current = true
      router.push(unauthenticatedRedirect)
      return
    }

    // Si l'utilisateur n'a pas le rôle requis
    if (!allowedRoles.includes(user.role || "")) {
      hasRedirected.current = true
      router.push(unauthorizedRedirect)
      return
    }
  }, [user, isChecking, router, allowedRoles, unauthorizedRedirect, unauthenticatedRedirect])

  // Afficher un loader pendant la vérification
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  // Si l'utilisateur est connecté et a le bon rôle, afficher le contenu
  if (user && allowedRoles.includes(user.role || "")) {
    return <>{children}</>
  }

  // Par défaut, ne rien afficher (la redirection sera gérée par l'effet)
  return null
} 