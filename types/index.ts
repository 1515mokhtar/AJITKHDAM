import type { Timestamp } from "firebase/firestore"

export interface Job {
  id: string
  title: string
  type: string
  location?: string
  description?: string
  salary?: string
  companyId: string
  company: {
    name: string
    logo?: string
  }
  postedAt: Timestamp
  updatedAt?: Timestamp
  isPublic: boolean // Nouvelle propriété pour la visibilité
}

export interface Application {
  id: string
  jobId: string
  userId: string
  answers: string[]
  interviewPref: {
    type: string
    slots: string[]
  }
  cvUrl: string
  status: string
  appliedAt: Timestamp
  job?: Job
  user?: {
    name: string
    email: string
  }
}

