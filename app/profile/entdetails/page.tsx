"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Upload, Building2, Users, Globe, Mail, Phone, Calendar, MapPin } from "lucide-react"
import Image from "next/image"
import { saveCompanyProfile, getCompanyProfile } from "@/lib/firebase/company-profile"
import { supabase } from "@/lib/supabase"
import { getFirestore } from "firebase/firestore"
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { RouteProtector } from "@/components/auth/route-protector"

interface CompanyProfile {
  companyName: string
  employeeCount: string
  website: string
  hrEmail: string
  hrPhone: string
  foundingDate: string
  location: string
  urlLogo?: string
}

export default function EntrepriseDetailsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isProfileComplete, setIsProfileComplete] = useState(false)
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: "",
    employeeCount: "",
    website: "",
    hrEmail: "",
    hrPhone: "",
    foundingDate: "",
    location: "",
    urlLogo: ""
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")

  // Vérifier l'accès et charger les données
  useEffect(() => {
    const checkAccessAndLoadData = async () => {
      try {
        // Attendre un peu pour montrer le message de vérification
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (!user) {
          router.push("/login?redirect=/profile/entdetails")
          return
        }

        if (user.role !== "company") {
          router.push("/dashboard")
          return
        }

        // Charger les données du profil
        const profileData = await getCompanyProfile(user.uid)
        if (profileData) {
          setProfile(profileData)
          setLogoPreview(profileData.logo)
          checkProfileCompletion(profileData)
        }
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error)
        toast.error("Erreur lors du chargement du profil")
      } finally {
        setIsChecking(false)
      }
    }

    checkAccessAndLoadData()
  }, [user, router])

  // Vérifier si le profil est complet
  const checkProfileCompletion = (data: CompanyProfile) => {
    const isComplete = Object.values(data).every(value => value !== "" && value !== null)
    setIsProfileComplete(isComplete)
  }

  // Gérer le changement des champs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile(prev => {
      const newProfile = { ...prev, [name]: value }
      checkProfileCompletion(newProfile)
      return newProfile
    })
  }

  // Gérer l'upload du logo
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type et la taille du fichier
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB")
      return
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  // Sauvegarder le profil
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("Vous devez être connecté pour soumettre le formulaire")
      return
    }

    setIsLoading(true)
    const db = getFirestore()

    try {
      // Référence au document de l'utilisateur
      const userRef = doc(db, "users", user.uid)

      // Sauvegarde des données du profil
      const profileRef = doc(db, "comprofiles", user.uid)
      await setDoc(profileRef, {
        ...profile,
        updatedAt: serverTimestamp()
      })

      // Mise à jour du statut de complétion dans la collection users
      await updateDoc(userRef, {
        profileComplete: true,
        profileCompleted: "yes"
      })

      toast.success("Profil mis à jour avec succès")
      router.push("/dashboard")
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error)
      
      // En cas d'erreur, on met à jour le statut de complétion comme incomplet
      try {
        const userRef = doc(db, "users", user.uid)
        await updateDoc(userRef, {
          profileComplete: false,
          profileCompleted: "no"
        })
      } catch (updateError) {
        console.error("Erreur lors de la mise à jour du statut de complétion:", updateError)
      }

      toast.error("Erreur lors de la mise à jour du profil")
    } finally {
      setIsLoading(false)
    }
  }

  // Page de chargement
  if (isChecking) {
    return (
      <div className="container max-w-xl mx-auto py-20">
        <div className="flex flex-col items-center justify-center p-8 text-center bg-background rounded-lg border">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <h2 className="text-2xl font-bold mb-2">Vérification en cours...</h2>
          <p className="text-muted-foreground">
            Nous vérifions vos autorisations d'accès au profil entreprise.
          </p>
        </div>
      </div>
    )
  }

  return (
    <RouteProtector allowedRoles={["company"]}>
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Profil Entreprise</CardTitle>
            <CardDescription>
              {isProfileComplete 
                ? "Gérez les informations de votre entreprise"
                : "Complétez votre profil entreprise pour commencer à publier des offres"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo de l'entreprise */}
              <div className="space-y-2">
                <Label>Logo de l'entreprise</Label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
                    {logoPreview ? (
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Format: PNG, JPG, GIF. Max 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations de l'entreprise */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l'entreprise</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={profile.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeCount">Nombre d'employés</Label>
                  <Input
                    id="employeeCount"
                    name="employeeCount"
                    value={profile.employeeCount}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Site web</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={profile.website}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hrEmail">Email RH</Label>
                  <Input
                    id="hrEmail"
                    name="hrEmail"
                    type="email"
                    value={profile.hrEmail}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hrPhone">Téléphone RH</Label>
                  <Input
                    id="hrPhone"
                    name="hrPhone"
                    type="tel"
                    value={profile.hrPhone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foundingDate">Date de création</Label>
                  <Input
                    id="foundingDate"
                    name="foundingDate"
                    type="date"
                    value={profile.foundingDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="location">Localisation</Label>
                  <Input
                    id="location"
                    name="location"
                    value={profile.location}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer le profil"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </RouteProtector>
  )
} 