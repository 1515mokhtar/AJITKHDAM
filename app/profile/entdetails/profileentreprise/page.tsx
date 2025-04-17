"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import {
  Building2,
  Users,
  Globe,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit,
  Save,
  X,
  Upload,
  AlertCircle,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CompanyProfile {
  companyName: string
  employeeCount: string
  website: string
  hrEmail: string
  hrPhone: string
  foundingDate: string
  location: string
  urlLogo: string
  description?: string
  industry?: string
  createdAt: string
  updatedAt: string
}

export default function CompanyProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [editedProfile, setEditedProfile] = useState<CompanyProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const db = getFirestore()
        // Assuming the user ID is the document ID in the comprofiles collection
        const profileRef = doc(db, "comprofiles", user.uid)
        const profileSnap = await getDoc(profileRef)

        if (profileSnap.exists()) {
          const data = profileSnap.data() as CompanyProfile
          setProfile(data)
          setEditedProfile(data)
        } else {
          // Create a default profile if none exists
          const defaultProfile: CompanyProfile = {
            companyName: "",
            employeeCount: "0",
            website: "",
            hrEmail: "",
            hrPhone: "",
            foundingDate: new Date().toISOString().split("T")[0],
            location: "",
            urlLogo: "",
            description: "",
            industry: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          setProfile(defaultProfile)
          setEditedProfile(defaultProfile)
          setIsEditing(true)
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du profil:", error)
        toast.error("Erreur lors de la récupération du profil")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setEditedProfile(profile)
      setLogoPreview(null)
      setLogoFile(null)
    }
    setIsEditing(!isEditing)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editedProfile) return

    setEditedProfile({
      ...editedProfile,
      [e.target.name]: e.target.value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    if (!editedProfile) return

    setEditedProfile({
      ...editedProfile,
      [name]: value,
    })
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!user || !editedProfile) return

    setIsSaving(true)
    try {
      const db = getFirestore()
      const profileRef = doc(db, "comprofiles", user.uid)

      const updatedProfile = {
        ...editedProfile,
        updatedAt: new Date().toISOString(),
      }

      // Upload logo if changed
      if (logoFile) {
        const storage = getStorage()
        const logoRef = ref(storage, `company-logos/${user.uid}/${logoFile.name}`)
        await uploadBytes(logoRef, logoFile)
        const logoUrl = await getDownloadURL(logoRef)
        updatedProfile.urlLogo = logoUrl
      }

      await updateDoc(profileRef, updatedProfile)

      setProfile(updatedProfile)
      setIsEditing(false)
      setLogoPreview(null)
      setLogoFile(null)
      toast.success("Profil mis à jour avec succès")
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error)
      toast.error("Erreur lors de la mise à jour du profil")
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch (e) {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Impossible de charger le profil. Veuillez réessayer plus tard.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Profil de l&apos;entreprise</h1>
          <p className="text-muted-foreground">Gérez les informations de votre entreprise</p>
        </div>
        <Button onClick={handleEditToggle} variant={isEditing ? "outline" : "default"}>
          {isEditing ? (
            <>
              <X className="mr-2 h-4 w-4" /> Annuler
            </>
          ) : (
            <>
              <Edit className="mr-2 h-4 w-4" /> Modifier le profil
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Header Card with Logo and Basic Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {/* Company Logo */}
              <div className="relative">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {logoPreview || editedProfile?.urlLogo ? (
                    <Image
                      src={logoPreview || editedProfile?.urlLogo || "/placeholder.svg"}
                      alt={`Logo ${editedProfile?.companyName}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Building2 className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
                {isEditing && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute bottom-2 right-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 text-center md:text-left">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={editedProfile?.companyName || ""}
                        onChange={handleInputChange}
                        placeholder="Nom de votre entreprise"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="industry">Secteur d&apos;activité</Label>
                        <Select
                          value={editedProfile?.industry || ""}
                          onValueChange={(value) => handleSelectChange("industry", value)}
                        >
                          <SelectTrigger id="industry">
                            <SelectValue placeholder="Sélectionner un secteur" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">Technologie</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="healthcare">Santé</SelectItem>
                            <SelectItem value="education">Éducation</SelectItem>
                            <SelectItem value="retail">Commerce</SelectItem>
                            <SelectItem value="manufacturing">Industrie</SelectItem>
                            <SelectItem value="services">Services</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employeeCount">Nombre d&apos;employés</Label>
                        <Select
                          value={editedProfile?.employeeCount || ""}
                          onValueChange={(value) => handleSelectChange("employeeCount", value)}
                        >
                          <SelectTrigger id="employeeCount">
                            <SelectValue placeholder="Sélectionner une taille" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 employés</SelectItem>
                            <SelectItem value="11-50">11-50 employés</SelectItem>
                            <SelectItem value="51-200">51-200 employés</SelectItem>
                            <SelectItem value="201-500">201-500 employés</SelectItem>
                            <SelectItem value="501-1000">501-1000 employés</SelectItem>
                            <SelectItem value="1000+">Plus de 1000 employés</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold">{profile.companyName || "Nom de l'entreprise non défini"}</h2>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 justify-center md:justify-start">
                      {profile.industry && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{profile.industry}</span>
                        </div>
                      )}
                      {profile.employeeCount && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{profile.employeeCount} employés</span>
                        </div>
                      )}
                      {profile.location && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                    </div>
                    {profile.description && <p className="mt-4 text-muted-foreground">{profile.description}</p>}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Information Tab */}
          <TabsContent value="info" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>Les informations générales de votre entreprise</CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={editedProfile?.description || ""}
                        onChange={handleInputChange}
                        placeholder="Décrivez votre entreprise en quelques phrases"
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="website">Site web</Label>
                        <Input
                          id="website"
                          name="website"
                          value={editedProfile?.website || ""}
                          onChange={handleInputChange}
                          placeholder="www.example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="foundingDate">Date de création</Label>
                        <Input
                          id="foundingDate"
                          name="foundingDate"
                          type="date"
                          value={editedProfile?.foundingDate || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Adresse</Label>
                      <Input
                        id="location"
                        name="location"
                        value={editedProfile?.location || ""}
                        onChange={handleInputChange}
                        placeholder="123 Rue Exemple, 75000 Paris, France"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {profile.description && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                        <p>{profile.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {profile.website && (
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-muted-foreground">Site web</h3>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {profile.website}
                            </a>
                          </div>
                        </div>
                      )}
                      {profile.foundingDate && (
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-muted-foreground">Date de création</h3>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(profile.foundingDate)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {profile.location && (
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Adresse</h3>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{profile.location}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations de contact</CardTitle>
                <CardDescription>Les coordonnées de contact de votre entreprise</CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hrEmail">Email RH</Label>
                        <Input
                          id="hrEmail"
                          name="hrEmail"
                          type="email"
                          value={editedProfile?.hrEmail || ""}
                          onChange={handleInputChange}
                          placeholder="rh@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hrPhone">Téléphone RH</Label>
                        <Input
                          id="hrPhone"
                          name="hrPhone"
                          value={editedProfile?.hrPhone || ""}
                          onChange={handleInputChange}
                          placeholder="+33 1 23 45 67 89"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {profile.hrEmail && (
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-muted-foreground">Email RH</h3>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${profile.hrEmail}`} className="text-primary hover:underline">
                              {profile.hrEmail}
                            </a>
                          </div>
                        </div>
                      )}
                      {profile.hrPhone && (
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-muted-foreground">Téléphone RH</h3>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${profile.hrPhone}`} className="text-primary hover:underline">
                              {profile.hrPhone}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        {isEditing && (
          <div className="flex justify-end mt-4">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-sm text-muted-foreground text-center mt-4">
          Dernière mise à jour: {formatDate(profile.updatedAt)}
        </div>
      </div>
    </div>
  )
}
