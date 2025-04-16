import { collection, doc, getDoc, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./config"
import type { Application } from "@/types"

export async function getUserApplications(userId: string) {
  try {
    // Modification de la requête pour éviter l'erreur d'index
    // Au lieu de filtrer et trier en même temps, nous récupérons toutes les candidatures de l'utilisateur
    // et trions côté client
    const applicationsQuery = query(collection(db, "applications"), where("userId", "==", userId))

    const snapshot = await getDocs(applicationsQuery)

    const applications = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data()

        // Get job details
        const jobDoc = await getDoc(doc(db, "jobs", data.jobId))
        const job = jobDoc.exists() ? { id: jobDoc.id, ...jobDoc.data() } : null

        return {
          id: docSnap.id,
          ...data,
          job,
        }
      }),
    )

    // Tri côté client par date de candidature (du plus récent au plus ancien)
    return applications.sort((a, b) => b.appliedAt.seconds - a.appliedAt.seconds) as Application[]
  } catch (error) {
    console.error("Error getting user applications:", error)
    return []
  }
}

export async function getJobApplications(jobId: string) {
  try {
    // Modification similaire pour cette fonction également
    const applicationsQuery = query(collection(db, "applications"), where("jobId", "==", jobId))

    const snapshot = await getDocs(applicationsQuery)

    const applications = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data()

        // Get user details
        const userDoc = await getDoc(doc(db, "users", data.userId))
        const user = userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null

        return {
          id: docSnap.id,
          ...data,
          user,
        }
      }),
    )

    // Tri côté client par date de candidature (du plus récent au plus ancien)
    return applications.sort((a, b) => b.appliedAt.seconds - a.appliedAt.seconds) as Application[]
  } catch (error) {
    console.error("Error getting job applications:", error)
    return []
  }
}

export async function createApplication(applicationData: any) {
  try {
    const firestoreData = {
      ...applicationData,
      appliedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "applications"), firestoreData)
    return docRef.id
  } catch (error) {
    console.error("Error creating application:", error)
    throw error
  }
}

