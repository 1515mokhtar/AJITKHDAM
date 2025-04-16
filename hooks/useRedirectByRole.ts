"use client"

import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

type RedirectConfig = {
  allowedRoles?: string[]
  redirectTo?: string
  requireAuth?: boolean
}

export const useRedirectByRole = ({
  allowedRoles = [],
  redirectTo = "/",
  requireAuth = true,
}: RedirectConfig = {}) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Si l'authentification est requise et l'utilisateur n'est pas connecté
      if (requireAuth && !user) {
        router.push("/auth/login")
        return
      }

      // Si l'utilisateur est connecté et qu'il y a des rôles autorisés
      if (user && allowedRoles.length > 0) {
        const userRole = user.role || "user"
        if (!allowedRoles.includes(userRole)) {
          router.push(redirectTo)
          return
        }
      }
    }
  }, [user, loading, allowedRoles, redirectTo, requireAuth, router])

  return { user, loading }
} 