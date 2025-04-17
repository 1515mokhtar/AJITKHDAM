"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Loader2 } from "lucide-react"

interface RouteProtectorProps {
  children: React.ReactNode
}

export function RouteProtector({ children }: RouteProtectorProps) {
  const { user, isChecking } = useAuth()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    if (isChecking) return
    if (hasRedirected) return

    if (!user) {
      setHasRedirected(true)
      router.push("/login")
      return
    }

    // Redirection basée sur le rôle
    if (user.role === "chercheur") {
      setHasRedirected(true)
      router.push("https://ajitkhdam.vercel.app/profile/details")
    }
  }, [user, isChecking, router, hasRedirected])

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

  return <>{children}</>
} 