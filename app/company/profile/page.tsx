"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ComProfileForm } from "@/components/comprofile/ComProfileForm"

export default function CompanyProfilePage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkProfile = async () => {
      if (!user?.uid) return

      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        return
      }

      const userData = userSnap.data()
      
      // Si le profil est complet et que l'utilisateur n'est pas en train de le modifier
      if (userData.profileComplete && !router.query?.edit) {
        router.push("/company/dashboard")
      }
    }

    checkProfile()
  }, [user, router])

  if (!user) return null

  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profil de l'entreprise</h1>
          <p className="text-muted-foreground">
            Complétez votre profil pour pouvoir publier des offres d'emploi.
          </p>
        </div>
        <ComProfileForm />
      </div>
    </div>
  )
} 