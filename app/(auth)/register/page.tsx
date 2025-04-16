"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "@/context/auth-context"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { UserRole } from "@/lib/firebase/auth"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<UserRole>("staff")
  const [companyName, setCompanyName] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { createUser, signInWithGoogle, registerWithGoogle, user, googleData, clearGoogleData } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"
  const provider = searchParams.get("provider")

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user) {
      router.push(redirect)
    }
  }, [user, router, redirect])

  // Pré-remplir les champs si nous avons des données Google
  useEffect(() => {
    if (googleData) {
      if (googleData.name) setName(googleData.name)
      if (googleData.email) setEmail(googleData.email)
    }
  }, [googleData])

  // Vérifier si nous venons de la page de connexion avec Google
  useEffect(() => {
    if (provider === "google" && !googleData) {
      // Rediriger vers la page de connexion pour obtenir les données Google
      router.push("/login")
    }
  }, [provider, googleData, router])

  const validateForm = (isGoogleSignUp: boolean): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Le nom est requis"
    }

    if (!isGoogleSignUp) {
      if (!email.trim()) {
        newErrors.email = "L'email est requis"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = "Format d'email invalide"
      }

      if (!password) {
        newErrors.password = "Le mot de passe est requis"
      } else if (password.length < 8) {
        newErrors.password = "Le mot de passe doit contenir au moins 8 caractères"
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas"
      }
    }

    if (role === "company" && !companyName.trim()) {
      newErrors.companyName = "Le nom de l'entreprise est requis"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm(false)) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Vérifier si Firebase est correctement configuré
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        setError("La configuration Firebase est incomplète. Veuillez vérifier vos variables d'environnement.")
        setIsLoading(false)
        return
      }

      const success = await createUser({
        name,
        email,
        password,
        role,
        ...(role === "company" && { companyName }),
      })

      if (success) {
        // Le toast de succès est déjà affiché dans le contexte d'authentification
        // Attendre un moment pour s'assurer que l'utilisateur voit le message de succès
        setTimeout(() => {
          router.push(redirect)
        }, 1000)
      }
    } catch (error: any) {
      console.error("Erreur inattendue lors de l'inscription:", error)
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    if (!googleData) {
      setGoogleLoading(true)
      setError(null)

      try {
        console.log("Démarrage de la connexion Google depuis la page d'inscription")
        const result = await signInWithGoogle()

        if (result.success) {
          console.log("Connexion Google réussie, redirection vers:", redirect)
          router.push(redirect)
        } else if (!result.isNewUser) {
          setError("Une erreur s'est produite lors de la connexion avec Google. Veuillez réessayer.")
        }
      } catch (error: any) {
        console.error("Erreur inattendue lors de la connexion Google:", error)
        setError("Échec de la connexion avec Google. Veuillez réessayer.")
      } finally {
        setGoogleLoading(false)
      }
    } else {
      // Nous avons déjà les données Google, procéder à l'inscription
      if (!validateForm(true)) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const success = await registerWithGoogle({
          role,
          ...(role === "company" && { companyName }),
        })

        if (success) {
          // Rediriger vers le tableau de bord après une inscription réussie
          setTimeout(() => {
            router.push(redirect)
          }, 1000)
        }
      } catch (error: any) {
        console.error("Erreur inattendue lors de l'inscription avec Google:", error)
        setError("Une erreur s'est produite lors de l'inscription avec Google. Veuillez réessayer.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center py-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Créer un compte</h1>
          <p className="text-sm text-muted-foreground">
            {googleData
              ? "Complétez votre profil pour finaliser votre inscription avec Google"
              : "Entrez vos informations pour créer un compte"}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {googleData ? (
          // Formulaire pour l'inscription avec Google
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleGoogleSignUp()
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center justify-between">
                Nom complet
                {errors.name && <span className="text-xs font-normal text-destructive">{errors.name}</span>}
              </Label>
              <Input
                id="name"
                placeholder="Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? "border-destructive" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center justify-between">
                Email
              </Label>
              <Input id="email" type="email" value={email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">L'email est fourni par Google et ne peut pas être modifié</p>
            </div>

            <div className="space-y-2">
              <Label>Type de compte</Label>
              <RadioGroup
                defaultValue="staff"
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                className="flex"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="staff" id="staff" />
                  <Label htmlFor="staff" className="cursor-pointer">
                    Chercheur d'emploi
                  </Label>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <RadioGroupItem value="company" id="company" />
                  <Label htmlFor="company" className="cursor-pointer">
                    Employeur
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {role === "company" && (
              <div className="space-y-2">
                <Label htmlFor="companyName" className="flex items-center justify-between">
                  Nom de l'entreprise
                  {errors.companyName && (
                    <span className="text-xs font-normal text-destructive">{errors.companyName}</span>
                  )}
                </Label>
                <Input
                  id="companyName"
                  placeholder="Acme Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={errors.companyName ? "border-destructive" : ""}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  clearGoogleData()
                  router.push("/login")
                }}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inscription en cours...
                  </>
                ) : (
                  "Terminer l'inscription"
                )}
              </Button>
            </div>
          </form>
        ) : (
          // Formulaire d'inscription standard
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center justify-between">
                  Nom complet
                  {errors.name && <span className="text-xs font-normal text-destructive">{errors.name}</span>}
                </Label>
                <Input
                  id="name"
                  placeholder="Jean Dupont"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? "border-destructive" : ""}
                />
              </div>

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
                <Label htmlFor="password" className="flex items-center justify-between">
                  Mot de passe
                  {errors.password && <span className="text-xs font-normal text-destructive">{errors.password}</span>}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? "border-destructive" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center justify-between">
                  Confirmer le mot de passe
                  {errors.confirmPassword && (
                    <span className="text-xs font-normal text-destructive">{errors.confirmPassword}</span>
                  )}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label>Type de compte</Label>
                <RadioGroup
                  defaultValue="staff"
                  value={role}
                  onValueChange={(value) => setRole(value as UserRole)}
                  className="flex"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="staff" id="staff" />
                    <Label htmlFor="staff" className="cursor-pointer">
                      Chercheur d'emploi
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <RadioGroupItem value="company" id="company" />
                    <Label htmlFor="company" className="cursor-pointer">
                      Employeur
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {role === "company" && (
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="flex items-center justify-between">
                    Nom de l'entreprise
                    {errors.companyName && (
                      <span className="text-xs font-normal text-destructive">{errors.companyName}</span>
                    )}
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Acme Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={errors.companyName ? "border-destructive" : ""}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création du compte...
                  </>
                ) : (
                  "Créer un compte"
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
              onClick={handleGoogleSignUp}
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
          </>
        )}

        <p className="px-8 text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{" "}
          <Link
            href={`/login${redirect !== "/dashboard" ? `?redirect=${redirect}` : ""}`}
            className="underline underline-offset-4 hover:text-primary"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

