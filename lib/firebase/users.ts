import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { db } from "./config"
import { getJobById } from "./jobs"
import type { Job } from "@/types"

export async function getSavedJobs(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))

    if (!userDoc.exists()) {
      return []
    }

    const userData = userDoc.data()
    const savedJobIds = userData.savedJobs || []

    if (savedJobIds.length === 0) {
      return []
    }

    const jobs = await Promise.all(
      savedJobIds.map(async (jobId: string) => {
        const job = await getJobById(jobId)
        return job
      }),
    )

    return jobs.filter(Boolean) as Job[]
  } catch (error) {
    console.error("Error getting saved jobs:", error)
    return []
  }
}

export async function saveJob(userId: string, jobId: string) {
  try {
    await updateDoc(doc(db, "users", userId), {
      savedJobs: arrayUnion(jobId),
    })
    return true
  } catch (error) {
    console.error("Error saving job:", error)
    return false
  }
}

export async function unsaveJob(userId: string, jobId: string) {
  try {
    await updateDoc(doc(db, "users", userId), {
      savedJobs: arrayRemove(jobId),
    })
    return true
  } catch (error) {
    console.error("Error unsaving job:", error)
    return false
  }
}

