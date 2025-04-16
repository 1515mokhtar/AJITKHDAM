"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getFirestore, doc, getDoc } from "firebase/firestore"
import { User } from "lucide-react"
import Image from "next/image"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface CompanyLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12"
}

export default function CompanyLogo({ className = "", size = "md" }: CompanyLogoProps) {
  const { user } = useAuth()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (!user || user.role !== "company") {
        setIsLoading(false)
        return
      }

      try {
        const db = getFirestore()
        const profileRef = doc(db, "comprofiles", user.uid)
        const profileDoc = await getDoc(profileRef)

        if (profileDoc.exists()) {
          const data = profileDoc.data()
          setLogoUrl(data.urlLogo || null)
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du logo:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompanyLogo()
  }, [user])

  // Si l'utilisateur n'est pas une entreprise, on affiche l'icône par défaut
  if (!user || user.role !== "company") {
    return (
      <Avatar className={`${sizes[size]} ${className}`}>
        <AvatarFallback>
          <User className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
    )
  }

  // Pendant le chargement ou si pas de logo, on affiche l'icône par défaut
  if (isLoading || !logoUrl) {
    return (
      <Avatar className={`${sizes[size]} ${className}`}>
        <AvatarFallback>
          <User className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
    )
  }

  // Afficher le logo de l'entreprise
  return (
    <Avatar className={`${sizes[size]} ${className}`}>
      <AvatarImage src={logoUrl} alt="Logo entreprise" />
      <AvatarFallback>
        <User className="h-5 w-5" />
      </AvatarFallback>
    </Avatar>
  )
} 