"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, User, getIdToken } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { useRouter, usePathname } from "next/navigation"

interface AuthUser extends User {
  role?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isChecking: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isChecking: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let isMounted = true
    setIsChecking(true)

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return

      try {
        if (firebaseUser) {
          // Récupérer le token Firebase
          const token = await getIdToken(firebaseUser)
          
          // Stocker le token dans un cookie
          document.cookie = `firebase-auth-token=${token}; path=/; secure; samesite=strict`

          // Récupérer les informations supplémentaires de l'utilisateur depuis Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
          const userData = userDoc.data()

          if (!isMounted) return

          // Étendre l'objet utilisateur avec les données de Firestore
          const extendedUser: AuthUser = {
            ...firebaseUser,
            role: userData?.role,
          }

          setUser(extendedUser)

          // Gérer les redirections en fonction du rôle
          if (pathname === "/login") {
            if (extendedUser.role === "chercheur") {
              router.push("/dashboard")
            }
          }
        } else {
          // Supprimer le cookie si l'utilisateur se déconnecte
          document.cookie = "firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
          setUser(null)
        }
      } catch (error) {
        console.error("Error during authentication:", error)
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
          setIsChecking(false)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [router, pathname])

  return (
    <AuthContext.Provider value={{ user, loading, isChecking }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 