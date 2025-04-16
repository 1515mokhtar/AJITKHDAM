"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, User, getIdToken } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { useRouter } from "next/navigation"

interface AuthUser extends User {
  role?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Récupérer le token Firebase
          const token = await getIdToken(firebaseUser)
          
          // Stocker le token dans un cookie
          document.cookie = `firebase-auth-token=${token}; path=/; secure; samesite=strict`

          // Récupérer les informations supplémentaires de l'utilisateur depuis Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
          const userData = userDoc.data()

          // Étendre l'objet utilisateur avec les données de Firestore
          const extendedUser: AuthUser = {
            ...firebaseUser,
            role: userData?.role,
          }

          setUser(extendedUser)
          
          // Rediriger vers le dashboard si l'utilisateur est sur la page de connexion
          if (window.location.pathname === "/login") {
            router.push("/dashboard")
          }
        } catch (error) {
          console.error("Error during authentication:", error)
          setUser(null)
        }
      } else {
        // Supprimer le cookie si l'utilisateur se déconnecte
        document.cookie = "firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 