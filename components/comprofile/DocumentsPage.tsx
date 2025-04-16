"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Image from "next/image"
import { Trash2 } from "lucide-react"

export function DocumentsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [logo, setLogo] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const loadCompanyLogo = async () => {
    if (!user?.uid) return

    try {
      const docRef = doc(db, "users", user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.company?.logo) {
          setLogo(data.company.logo)
          setPreviewUrl(data.company.logo)
        }
      }
    } catch (error) {
      console.error("Error loading company logo:", error)
      toast.error("Erreur lors du chargement du logo")
    }
  }

  useEffect(() => {
    loadCompanyLogo()
  }, [user])

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 5MB)")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setLogo(base64String)
      setPreviewUrl(base64String)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user?.uid || !logo) return

    setIsLoading(true)
    try {
      const docRef = doc(db, "users", user.uid)
      await updateDoc(docRef, {
        "company.logo": logo,
        updatedAt: new Date(),
      })
      toast.success("Logo mis à jour avec succès")
    } catch (error) {
      console.error("Error updating company logo:", error)
      toast.error("Erreur lors de la mise à jour du logo")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!user?.uid) return

    setIsLoading(true)
    try {
      const docRef = doc(db, "users", user.uid)
      await updateDoc(docRef, {
        "company.logo": null,
        updatedAt: new Date(),
      })
      setLogo(null)
      setPreviewUrl(null)
      toast.success("Logo supprimé avec succès")
    } catch (error) {
      console.error("Error removing company logo:", error)
      toast.error("Erreur lors de la suppression du logo")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="logo">Logo de l'entreprise</Label>
        <Input
          id="logo"
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          Format recommandé : PNG, JPG. Taille maximale : 5MB
        </p>
      </div>

      {previewUrl && (
        <div className="relative w-32 h-32">
          <Image
            src={previewUrl}
            alt="Logo preview"
            fill
            className="object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2"
            onClick={handleRemoveLogo}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Button type="submit" disabled={isLoading || !logo}>
        {isLoading ? "Mise à jour..." : "Mettre à jour le logo"}
      </Button>
    </form>
  )
} 