"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { LoginForm } from "@/components/auth/login-form"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Fonction pour gérer la redirection en fonction du rôle
    const handleRoleBasedRedirect = async (uid: string) => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid))
        const userData = userDoc.data()

        if (!userData) {
          setIsLoading(false)
          return
        }

        const role = userData.role
        const redirectPath = searchParams.get("redirect") || getDefaultRedirectPath(role)
        
        // Éviter les redirections multiples
        if (!hasRedirected) {
          setHasRedirected(true)
          router.push(redirectPath)
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du rôle:", error)
        setIsLoading(false)
      }
    }

    // Fonction pour déterminer le chemin de redirection par défaut
    const getDefaultRedirectPath = (role: string) => {
      switch (role) {
        case "chercheur":
          return "/profile"
        case "staff":
          return "/admin"
        case "company":
          return "/profile/entdetails"
        default:
          return "/login"
      }
    }

    // Observer les changements d'état d'authentification
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await handleRoleBasedRedirect(user.uid)
      } else {
        setIsLoading(false)
      }
    })

    // Nettoyer l'abonnement
    return () => unsubscribe()
  }, [router, searchParams, hasRedirected])

  // Afficher un loader pendant l'initialisation
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  // Afficher le formulaire de connexion une fois l'initialisation terminée
  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          Job Finder
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Trouvez le job de vos rêves avec notre plateforme de recherche d'emploi.&rdquo;
            </p>
            <footer className="text-sm">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Connectez-vous à votre compte
            </h1>
            <p className="text-sm text-muted-foreground">
              Entrez vos identifiants pour accéder à votre compte
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

