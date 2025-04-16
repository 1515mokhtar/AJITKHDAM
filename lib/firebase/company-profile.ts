import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { app } from "./firebase"

interface CompanyProfile {
  companyName: string
  employeeCount: string
  website: string
  hrEmail: string
  hrPhone: string
  foundingDate: string
  location: string
  logo: string
  updatedAt?: string
  uid?: string
}

export const saveCompanyProfile = async (
  userId: string,
  profileData: CompanyProfile,
  logoFile: File | null
): Promise<void> => {
  try {
    // 1. Upload du logo si présent
    let logoUrl = profileData.logo
    if (logoFile) {
      const storage = getStorage(app)
      const logoRef = ref(storage, `company-logos/${userId}-${Date.now()}`)
      await uploadBytes(logoRef, logoFile)
      logoUrl = await getDownloadURL(logoRef)
    }

    // 2. Préparer les données
    const dataToSave = {
      ...profileData,
      logo: logoUrl,
      updatedAt: new Date().toISOString(),
      uid: userId
    }

    // 3. Sauvegarder dans Firestore
    const db = getFirestore(app)
    const profileRef = doc(db, "comprofiles", userId)
    await setDoc(profileRef, dataToSave)
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du profil:", error)
    throw error
  }
}

export const getCompanyProfile = async (userId: string): Promise<CompanyProfile | null> => {
  try {
    const db = getFirestore(app)
    const profileRef = doc(db, "comprofiles", userId)
    const profileDoc = await getDoc(profileRef)
    
    if (profileDoc.exists()) {
      return profileDoc.data() as CompanyProfile
    }
    
    return null
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error)
    throw error
  }
} 