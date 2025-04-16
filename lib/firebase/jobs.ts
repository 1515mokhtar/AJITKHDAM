import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as limitQuery,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./config"
import type { Job } from "@/types"

// Récupérer toutes les offres d'emploi
export async function getAllJobs(limit?: number) {
  try {
    // Modification de la requête pour éviter l'erreur d'index
    // Au lieu de filtrer et trier en même temps, nous récupérons toutes les offres
    // et filtrons côté client
    let jobsQuery = query(collection(db, "jobs"), orderBy("postedAt", "desc"))

    if (limit) {
      jobsQuery = query(jobsQuery, limitQuery(limit))
    }

    const snapshot = await getDocs(jobsQuery)

    // Filtrer les offres publiques côté client
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((job) => job.isPublic !== false) as Job[] // Considère les offres sans isPublic comme publiques
  } catch (error) {
    console.error("Erreur lors de la récupération des offres d'emploi:", error)
    return []
  }
}

// Récupérer une offre d'emploi par ID
export async function getJobById(id: string, userId?: string) {
  try {
    const docRef = doc(db, "jobs", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const jobData = docSnap.data()

      // Vérifier si l'offre est publique ou si l'utilisateur est le propriétaire
      if (jobData.isPublic !== false || jobData.companyId === userId) {
        return {
          id: docSnap.id,
          ...jobData,
        } as Job
      } else {
        // L'offre est privée et l'utilisateur n'est pas le propriétaire
        return null
      }
    } else {
      return null
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'offre d'emploi:", error)
    return null
  }
}

// Récupérer les offres d'emploi d'un employeur (toutes, publiques et privées)
export async function getEmployerJobs(employerId: string) {
  try {
    const jobsQuery = query(collection(db, "jobs"), where("companyId", "==", employerId), orderBy("postedAt", "desc"))

    const snapshot = await getDocs(jobsQuery)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Job[]
  } catch (error) {
    console.error("Erreur lors de la récupération des offres d'emploi de l'employeur:", error)
    return []
  }
}

// Créer une nouvelle offre d'emploi
export async function createJob(jobData: any) {
  try {
    // S'assurer que isPublic est défini, par défaut à true si non spécifié
    const firestoreData = {
      ...jobData,
      isPublic: jobData.isPublic !== undefined ? jobData.isPublic : true,
      postedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "jobs"), firestoreData)
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error("Erreur lors de la création de l'offre d'emploi:", error)
    return { success: false, error: "Échec de la création de l'offre d'emploi. Veuillez réessayer." }
  }
}

// Mettre à jour une offre d'emploi existante
export async function updateJob(jobId: string, jobData: Partial<Job>) {
  try {
    const jobRef = doc(db, "jobs", jobId)
    await updateDoc(jobRef, jobData)
    return { success: true }
  } catch (error) {
    console.error("Error updating job:", error)
    return { success: false, error: "Failed to update job" }
  }
}

// Supprimer une offre d'emploi
export async function deleteJob(jobId: string) {
  try {
    await deleteDoc(doc(db, "jobs", jobId))
    return { success: true }
  } catch (error) {
    console.error("Erreur lors de la suppression de l'offre d'emploi:", error)
    return { success: false, error: "Échec de la suppression de l'offre d'emploi. Veuillez réessayer." }
  }
}

