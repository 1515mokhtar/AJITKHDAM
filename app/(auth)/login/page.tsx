"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn, signInWithGoogle, user, isChecking, resetPassword } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"

  // Rediriger si déjà connecté et que la vérification est terminée
  useEffect(() => {
    if (!isChecking && user) {
      router.push(redirect)
    }
  }, [user, router, redirect, isChecking])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!email.trim()) {
      newErrors.email = "L'email est requis"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format d'email invalide"
    }

    if (!password) {
      newErrors.password = "Le mot de passe est requis"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const success = await signIn(email, password)

      if (success) {
        router.push(redirect)
      }
    } catch (error: any) {
      console.error("Erreur inattendue lors de la connexion:", error)
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)

    try {
      console.log("Démarrage de la connexion Google depuis la page de connexion")
      const result = await signInWithGoogle()

      if (result.success) {
        console.log("Connexion Google réussie, redirection vers:", redirect)
        router.push(redirect)
      } else if (result.isNewUser) {
        // Rediriger vers la page d'inscription si c'est un nouvel utilisateur
        console.log("Nouvel utilisateur Google, redirection vers l'inscription")
        router.push("/register?provider=google")
      }
    } catch (error: any) {
      console.error("Erreur inattendue lors de la connexion Google:", error)
      setError("Échec de la connexion avec Google. Veuillez réessayer.")
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrors({ email: "Veuillez entrer votre adresse email" })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Veuillez entrer une adresse email valide" })
      return
    }

    setIsLoading(true)

    try {
      await resetPassword(email)
    } catch (error) {
      console.error("Erreur inattendue lors de la réinitialisation du mot de passe:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Afficher un état de chargement pendant la vérification de l'authentification
  if (isChecking) {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center py-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col items-center space-y-2 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Vérification de l'authentification...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center py-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Bienvenue</h1>
          <p className="text-sm text-muted-foreground">Entrez vos identifiants pour vous connecter à votre compte</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center justify-between">
              Email
              {errors.email && <span className="text-xs font-normal text-destructive">{errors.email}</span>}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="nom@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "border-destructive" : ""}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="flex items-center">
                Mot de passe
                {errors.password && (
                  <span className="ml-2 text-xs font-normal text-destructive">{errors.password}</span>
                )}
              </Label>
              <Button
                variant="link"
                className="px-0 text-xs font-normal"
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
              >
                Mot de passe oublié ?
              </Button>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? "border-destructive" : ""}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Ou continuer avec</span>
          </div>
        </div>

        <Button
          variant="outline"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full"
        >
          {googleLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion avec Google...
            </>
          ) : (
            "Google"
          )}
        </Button>

        <p className="px-8 text-center text-sm text-muted-foreground">
          Vous n&apos;avez pas de compte ?{" "}
          <Link
            href={`/register${redirect !== "/dashboard" ? `?redirect=${redirect}` : ""}`}
            className="underline underline-offset-4 hover:text-primary"
          >
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}

