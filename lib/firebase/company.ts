import { db } from "./config"
import { doc, getDoc } from "firebase/firestore"

export async function isCompanyProfileComplete(userId: string): Promise<boolean> {
  try {
    const companyDoc = await getDoc(doc(db, "companies", userId))
    
    if (!companyDoc.exists()) {
      return false
    }

    const data = companyDoc.data()
    
    // Vérifier les champs requis
    const requiredFields = [
      "name",
      "description",
      "address",
      "phone",
      "email",
      "website",
      "logo"
    ]

    return requiredFields.every(field => {
      const value = data[field]
      return value !== undefined && value !== null && value !== ""
    })
  } catch (error) {
    console.error("Error checking company profile:", error)
    return false
  }
} 