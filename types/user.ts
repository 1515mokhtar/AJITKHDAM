export interface User {
  id: string
  email: string
  role: "company" | "candidate"
  firstName?: string
  lastName?: string
  company?: {
    name: string
    description: string
    website?: string
    industry: string
    size: string
    logo?: string
    address: {
      street: string
      city: string
      postalCode: string
      country: string
    }
  }
  profileComplete?: boolean
  createdAt: {
    seconds: number
    nanoseconds: number
  }
  updatedAt: {
    seconds: number
    nanoseconds: number
  }
} 