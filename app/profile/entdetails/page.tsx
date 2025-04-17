"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "react-hot-toast"
import { Loader2, Upload, Building2, Users, Globe, Mail, Phone, Calendar, MapPin } from "lucide-react"
import Image from "next/image"
import { getFirestore } from "firebase/firestore"
import { doc, getDoc, updateDoc, serverTimestamp, writeBatch } from "firebase/firestore"
import { createClient } from "@supabase/supabase-js"

// Initialisation de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CompanyProfile {
  companyName: string
  employeeCount: string
  website: string
  hrEmail: string
  hrPhone: string
  foundingDate: string
  location: string
  urlLogo?: string | null
}

export default function EntrepriseDetailsPage() {
  const { user } = useAuth()
  const router = useRouter()
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [showLandingPage, setShowLandingPage] = useState(false)
  const [countdown, setCountdown] = useState(5)

  // État pour gérer le statut du profil
  const [profileStatus, setProfileStatus] = useState<{
    isComplete: boolean;
    message: string;
  }>({
    isComplete: false,
    message: "Profil à compléter"
  })

  // Fonction pour gérer le compte à rebours
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showLandingPage && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [showLandingPage, countdown])

  // Charger les données du profil au montage
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      try {
        const db = getFirestore()
        const profileRef = doc(db, "users", user.uid)
        const profileDoc = await getDoc(profileRef)

        if (profileDoc.exists()) {
          const data = profileDoc.data()
          const newProfile = {
            companyName: data.companyName || "",
            employeeCount: data.employeeCount || "",
            website: data.website || "",
            hrEmail: data.hrEmail || "",
            hrPhone: data.hrPhone || "",
            foundingDate: data.foundingDate || "",
            location: data.location || "",
            urlLogo: data.urlLogo || ""
          }
          setProfile(newProfile)
          // Mettre à jour l'image actuelle
          if (data.urlLogo) {
            setLogoPreview(profile.urlLogo || "" )
          }
          checkProfileCompletion(newProfile)
        }
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error)
        toast.error("Erreur lors du chargement du profil")
      }
    }

    loadProfile()
  }, [user])

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

  // Fonction pour supprimer l'ancien logo
  const deleteOldLogo = async (): Promise<boolean> => {
    if (!user) return false

    try {
      // Récupérer tous les fichiers du bucket
      const { data: files, error: listError } = await supabase
        .storage
        .from("company-logos")
        .list("", { limit: 100 })

      if (listError) {
        console.error("Erreur lors de la récupération des fichiers:", listError)
        toast.error("Erreur lors de la récupération des fichiers")
        return false
      }

      // Filtrer les fichiers qui commencent par l'UID
      const userFiles = files.filter(file => file.name.startsWith(user.uid))

      if (userFiles.length > 0) {
        const fileNamesToDelete = userFiles.map(file => file.name)
        
        const { error: deleteError } = await supabase
          .storage
          .from("company-logos")
          .remove(fileNamesToDelete)

        if (deleteError) {
          console.error("Erreur lors de la suppression de l'ancien logo:", deleteError)
          toast.error("Erreur lors de la suppression de l'ancien logo")
          return false
        }
      }
      return true
    } catch (error) {
      console.error("Erreur lors de la suppression de l'ancien logo:", error)
      toast.error("Erreur lors de la suppression de l'ancien logo")
      return false
    }
  }

  // Fonction pour uploader le nouveau logo
  const uploadNewLogo = async (file: File): Promise<string | null> => {
    if (!user) return null

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.uid}.${fileExt}`

      // Uploader le nouveau logo
      const { error: uploadError } = await supabase
        .storage
        .from("company-logos")
        .upload(fileName, file, {
          upsert: true,
          cacheControl: "3600"
        })

      if (uploadError) {
        console.error("Erreur lors de l'upload du nouveau logo:", uploadError)
        toast.error("Erreur lors de l'upload du nouveau logo")
        return null
      }

      // Obtenir l'URL publique du nouveau logo
      const { data: { publicUrl } } = supabase
        .storage
        .from("company-logos")
        .getPublicUrl(fileName)

      // Ajouter un timestamp pour éviter le cache
      const timestamp = new Date().getTime()
      return `${publicUrl}?t=${timestamp}`
    } catch (error) {
      console.error("Erreur lors de l'upload du logo:", error)
      toast.error("Une erreur est survenue lors de la mise à jour du logo")
      return null
    }
  }

  // Gérer le changement de logo
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

    // Afficher l'aperçu immédiatement
    const previewUrl = URL.createObjectURL(file)
    setLogoPreview(previewUrl)
    setSelectedFile(file)

    // Réinitialiser l'input file
    e.target.value = ""
  }

  // Gérer l'upload du logo sélectionné
  const handleLogoUpload = async () => {
    if (!selectedFile || !user) return

    setIsUploading(true)

    try {
      // 1. Supprimer l'ancien logo
      const oldLogoDeleted = await deleteOldLogo()
      if (!oldLogoDeleted) {
        throw new Error("Échec de la suppression de l'ancien logo")
      }

      // 2. Uploader le nouveau logo
      const newLogoUrl = await uploadNewLogo(selectedFile)
      if (!newLogoUrl) {
        throw new Error("Échec de l'upload du nouveau logo")
      }

      // 3. Mettre à jour les URLs dans Firebase
      const db = getFirestore()
      const batch = writeBatch(db)

      // Mise à jour dans users
      const userRef = doc(db, "users", user.uid)
      batch.update(userRef, {
        logoURL: newLogoUrl,
        updatedAt: serverTimestamp()
      })

      // Mise à jour dans comprofiles
      const comprofileRef = doc(db, "comprofiles", user.uid)
      batch.update(comprofileRef, {
        urlLogo: newLogoUrl,
        updatedAt: serverTimestamp()
      })

      // Exécuter les mises à jour
      await batch.commit()

      // 4. Mettre à jour l'état local
      setProfile(prev => ({ ...prev, urlLogo: newLogoUrl }))
      setLogoPreview(newLogoUrl)
      setSelectedFile(null)

      // 5. Nettoyer et afficher le succès
      localStorage.clear()
      toast.success("Logo mis à jour avec succès")

      // 6. Afficher la landing page et démarrer le compte à rebours
      setShowLandingPage(true)
      setCountdown(5)

      // 7. Rafraîchir la page après 5 secondes
      setTimeout(() => {
        window.location.reload()
      }, 5000)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du logo:", error)
      toast.error("Erreur lors de la mise à jour du logo")
      // Réinitialiser la prévisualisation en cas d'erreur
      setLogoPreview(profile.urlLogo || "")
    } finally {
      setIsUploading(false)
    }
  }

  // Vérifier si tous les champs requis sont remplis
  const checkRequiredFields = (data: CompanyProfile) => {
    const requiredFields = [
      data.companyName,
      data.employeeCount,
      data.foundingDate,
      data.website,
      data.hrEmail,
      data.hrPhone,
      data.location
    ]
    return requiredFields.every(value => value !== "" && value !== null)
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
      let logoUrl = profile.urlLogo

      // Upload du nouveau logo si un fichier a été sélectionné
      if (selectedFile) {
        const newLogoUrl = await uploadNewLogo(selectedFile)
        if (!newLogoUrl) {
          setIsLoading(false)
          return
        }
        logoUrl = newLogoUrl
        // Mettre à jour l'état du profil avec la nouvelle URL
        setProfile(prev => ({ ...prev, urlLogo: newLogoUrl }))
      }

      // Vérification des champs requis
      const isComplete = checkRequiredFields(profile)
      const profileStatus = isComplete ? "yes" : "no"

      if (!isComplete) {
        toast.error("Veuillez remplir tous les champs requis")
        setIsLoading(false)
        return
      }

      // Mise à jour de la collection comprofiles
      const comprofileRef = doc(db, "comprofiles", user.uid)
      await updateDoc(comprofileRef, {
        companyName: profile.companyName,
        employeeCount: profile.employeeCount,
        foundingDate: profile.foundingDate,
        urlLogo: logoUrl,
        website: profile.website,
        updatedAt: serverTimestamp(),
        profileComplete: isComplete,
        profileCompleted: profileStatus
      })

      // Mise à jour de la collection users
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        companyName: profile.companyName,
        employeeCount: profile.employeeCount,
        foundingDate: profile.foundingDate,
        name: profile.companyName,
        logoURL: logoUrl,
        updatedAt: serverTimestamp(),
        profileComplete: isComplete,
        profileCompleted: profileStatus
      })

      toast.success("Le profil a été mis à jour avec succès !")
      
      // Nettoyage du localStorage
      localStorage.clear()
      
      // Redirection après 1 seconde
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error)
      toast.error("Erreur : mise à jour Firebase échouée")
    } finally {
      setIsLoading(false)
      // Nettoyage du localStorage même en cas d'erreur
      localStorage.clear()
    }
  }

  // Fonction pour vérifier le statut du profil
  const checkProfileStatus = async () => {
    if (!user) return

    try {
      const db = getFirestore()
      const userRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        
        // Liste des champs obligatoires
        const requiredFields = [
          'companyName',
          'createdAt',
          'employeeCount',
          'foundingDate',
          'hrEmail',
          'hrPhone',
          'location',
          'urlLogo',
          'website'
        ]

        // Vérifier si tous les champs sont remplis
        const allFieldsFilled = requiredFields.every(field => 
          userData[field] && userData[field].toString().trim() !== ''
        )

        // Mettre à jour le statut dans Firebase
        await updateDoc(userRef, {
          profileComplete: allFieldsFilled,
          profileCompleted: allFieldsFilled ? "yes" : "no",
          updatedAt: serverTimestamp()
        })

        // Mettre à jour l'état local
        setProfileStatus({
          isComplete: allFieldsFilled,
          message: allFieldsFilled ? "Profil complet ✅" : "Profil à compléter ⚠️"
        })
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut du profil:", error)
    }
  }

  // Vérifier le statut du profil après le chargement des données
  useEffect(() => {
    const timer = setTimeout(() => {
      checkProfileStatus()
    }, 5000)

    return () => clearTimeout(timer)
  }, [user])

  // Vérifier le statut après chaque modification
  useEffect(() => {
    if (profile.companyName && 
        profile.employeeCount && 
        profile.foundingDate && 
        profile.website && 
        profile.hrEmail && 
        profile.hrPhone && 
        profile.location && 
        profile.urlLogo) {
      checkProfileStatus()
    }
  }, [profile])

  return (
    <div className="container py-8">
      {/* Landing Page Overlay */}
      {showLandingPage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="mb-4">
              <Image
                src={logoPreview}
                alt="Nouveau logo"
                width={100}
                height={100}
                className="mx-auto rounded-lg"
              />
            </div>
            <h2 className="text-xl font-bold mb-2">Logo mis à jour avec succès !</h2>
            <p className="text-gray-600 mb-4">
              La page va se rafraîchir automatiquement dans {countdown} secondes...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(countdown / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

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
                  {selectedFile && (
                    <Button
                      type="button"
                      onClick={handleLogoUpload}
                      disabled={isUploading}
                      className="mt-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mise à jour en cours...
                        </>
                      ) : (
                        "Mettre à jour le logo"
                      )}
                    </Button>
                  )}
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
  )
} 