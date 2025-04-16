export interface Job {
  id: string
  title: string
  description: string
  type: string
  location: string
  company: {
    name: string
    logo: string
  }
  companyId: string
  contactInfo: string
  educationLevel: string
  isPublic: boolean
  salary: string
  availabilitySlots: Array<{
    date: string
    time: string
  }>
  createdAt: {
    seconds: number
    nanoseconds: number
  }
  postedAt: {
    seconds: number
    nanoseconds: number
  }
  deadline?: {
    seconds: number
    nanoseconds: number
  }
  status?: 'active' | 'expired' | 'closed'
} 