"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getFirestore, doc, getDoc } from "firebase/firestore"
import Image from "next/image"
import { Building2 } from "lucide-react"

export function CompanyLogo() {
  const { user } = useAuth()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadLogo = async () => {
      if (!user || user.role !== "company") {
        setIsLoading(false)
        return
      }

      try {
        const db = getFirestore()
        const userRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          const data = userDoc.data()
          setLogoUrl(data.logoURL || null)
        }
      } catch (error) {
        console.error("Erreur lors du chargement du logo:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLogo()
  }, [user])

  if (isLoading || !user || user.role !== "company") {
    return null
  }

  return (
    <div className="relative h-8 w-8 rounded-full overflow-hidden border">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt="Logo de l'entreprise"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 32px, 32px"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  )
} 