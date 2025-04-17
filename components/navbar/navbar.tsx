"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { CompanyLogo } from "./company-logo"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { getFirestore, doc, getDoc } from "firebase/firestore"

export function Navbar() {
  const { user, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isProfileComplete, setIsProfileComplete] = useState(false)

  // Fonction pour vérifier le statut du profil
  const checkProfileStatus = async () => {
    if (!user) return

    try {
      const db = getFirestore()
      const userRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        
        // Vérifier si l'utilisateur a le rôle "company"
        if (userData.role === "company") {
          // Vérifier les champs profileComplete et profileCompleted
          const isComplete = userData.profileComplete === true && userData.profileCompleted === "yes"
          setIsProfileComplete(isComplete)
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut du profil:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Vérifier le statut du profil après le chargement des données
  useEffect(() => {
    const timer = setTimeout(() => {
      checkProfileStatus()
    }, 5000)

    return () => clearTimeout(timer)
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">AJITKHDAM</span>
          </Link>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <>
              {user.role === "company" && <CompanyLogo />}
              {user.role === "company" && !isLoading && (
                <div className="flex items-center gap-2">
                  {isProfileComplete ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-500">Profil complété ✅</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-500">Profil à compléter ⚠️</span>
                    </>
                  )}
                </div>
              )}
              <Button variant="ghost" onClick={handleSignOut}>
                Déconnexion
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
} 