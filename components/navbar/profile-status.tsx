"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getFirestore, doc, getDoc } from "firebase/firestore"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export function ProfileStatus() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isComplete, setIsComplete] = useState(false)

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
          setIsComplete(isComplete)
        } else {
          setIsComplete(false)
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

  // Ne pas afficher le composant si l'utilisateur n'est pas une entreprise
  if (isLoading || !user) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {isComplete ? (
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
  )
} 