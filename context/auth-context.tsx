"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "firebase/auth"
import { doc, getDoc, updateDoc, serverTimestamp, setDoc, getFirestore } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/config"
import { signUp, signIn, signInWithGoogle, resetPassword, registerWithGoogle, type UserRole } from "@/lib/firebase/auth"
import { toast } from "react-hot-toast"

interface User {
  uid: string
  email: string | null
  name?: string
  role?: UserRole
  companyName?: string
  companyLogo?: string
  cvUrl?: string
  photoURL?: string
  authProvider?: string
}

interface SignUpData {
  name: string
  email: string
  password: string
  role: UserRole
  companyName?: string
}

interface GoogleSignUpData {
  role: UserRole
  companyName?: string
}

interface GoogleData {
  uid: string
  name: string | null
  email: string | null
  photoURL: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isChecking: boolean
  error: string | null
  googleData: GoogleData | null
  profile: any | null
  isProfileComplete: boolean
  createUser: (data: SignUpData) => Promise<boolean>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  registerWithGoogle: (userData: GoogleSignUpData) => Promise<boolean>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<boolean>
  clearGoogleData: () => void
  updateProfileCompletion: (userId: string, isComplete: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export { AuthContext };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [googleData, setGoogleData] = useState<GoogleData | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [isProfileComplete, setIsProfileComplete] = useState(false)
  const isInitialized = useRef(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsChecking(true)
      if (firebaseUser) {
        try {
          console.log("Utilisateur authentifié:", firebaseUser.email)

          // Mettre à jour la dernière connexion
          try {
            await updateDoc(doc(db, "users", firebaseUser.uid), {
              lastLogin: serverTimestamp(),
            })
          } catch (error) {
            console.log("Impossible de mettre à jour la dernière connexion, l'utilisateur est peut-être nouveau")
          }

          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

          if (userDoc.exists()) {
            console.log("Document utilisateur trouvé dans Firestore")
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL || undefined,
              role: userData.role || "chercheur", // Assurer qu'un rôle par défaut est défini
              ...(userData as Omit<User, "uid" | "email" | "photoURL" | "role">),
            })
            
            // Récupérer le profil si nécessaire
            if (userData.role) {
              try {
                const profileDoc = await getDoc(doc(db, "profiles", firebaseUser.uid))
                if (profileDoc.exists()) {
                  setProfile(profileDoc.data())
                  setIsProfileComplete(profileDoc.data().profileCompleted === "yes")
                }
              } catch (error) {
                console.error("Erreur lors de la récupération du profil:", error)
              }
            }
          } else {
            // L'utilisateur existe dans Auth mais pas dans Firestore
            console.log("L'utilisateur existe dans Auth mais pas dans Firestore, création du document")
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || "Utilisateur",
              role: "chercheur", // Rôle par défaut
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              savedJobs: [],
              photoURL: firebaseUser.photoURL || null,
              authProvider: firebaseUser.providerData[0]?.providerId === "google.com" ? "google" : "email",
              profileCompleted: "no",
            }

            await setDoc(doc(db, "users", firebaseUser.uid), userData)

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || undefined,
              photoURL: firebaseUser.photoURL || undefined,
              role: "chercheur", // Rôle par défaut
              authProvider: firebaseUser.providerData[0]?.providerId === "google.com" ? "google" : "email",
              profileCompleted: "no",
            })
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des données utilisateur:", error)
          // Définir les informations utilisateur de base si la récupération Firestore échoue
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || undefined,
            photoURL: firebaseUser.photoURL || undefined,
            authProvider: firebaseUser.providerData[0]?.providerId === "google.com" ? "google" : "email",
            profileCompleted: "no",
          })
        }
      } else {
        console.log("Aucun utilisateur authentifié")
        setUser(null)
        setProfile(null)
        setIsProfileComplete(false)
      }
      setLoading(false)
      setIsChecking(false)
    })

    return () => unsubscribe()
  }, [])

  const createUser = async (data: SignUpData): Promise<boolean> => {
    const result = await signUp(data)

    if (result.success) {
      toast.success("Compte créé avec succès ! Redirection vers le tableau de bord...", {
        duration: 5000,
        icon: "✅",
      })
      return true
    } else {
      // Vérifier si c'est l'erreur d'authentification non activée
      if (result.error && result.error.includes("L'authentification par email/mot de passe n'est pas activée")) {
        toast.error(result.error, { duration: 10000 }) // Durée plus longue pour ce message important
      } else {
        toast.error(result.error || "Échec de la création du compte")
      }
      return false
    }
  }

  const handleSignIn = async (email: string, password: string): Promise<void> => {
    try {
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      setError("Erreur de connexion. Vérifiez vos identifiants.")
      throw error
    }
  }

  const handleSignInWithGoogle = async (): Promise<void> => {
    try {
      setError(null)
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      await createUserInFirestore(userCredential.user)
      toast.success("Connexion avec Google réussie")
    } catch (error) {
      setError("Erreur lors de la connexion avec Google.")
      throw error
    }
  }

  const handleRegisterWithGoogle = async (userData: GoogleSignUpData): Promise<boolean> => {
    if (!googleData) {
      toast.error("Données Google manquantes. Veuillez réessayer la connexion avec Google.")
      return false
    }

    const result = await registerWithGoogle(googleData, userData)

    if (result.success) {
      toast.success("Inscription réussie avec Google ! Redirection vers le tableau de bord...")
      // Effacer les données Google après une inscription réussie
      setGoogleData(null)
      return true
    } else {
      toast.error(result.error || "Échec de l'inscription avec Google")
      return false
    }
  }

  const clearGoogleData = () => {
    setGoogleData(null)
  }

  const handleResetPassword = async (email: string): Promise<boolean> => {
    const result = await resetPassword(email)

    if (result.success) {
      toast.success("Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.")
      return true
    } else {
      toast.error(result.error || "Échec de l'envoi de l'email de réinitialisation")
      return false
    }
  }

  const handleSignOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth)
      toast.success("Déconnexion réussie")
      setUser(null)
      setProfile(null)
      setIsProfileComplete(false)
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      toast.error("Échec de la déconnexion")
    }
  }

  const createUserInFirestore = async (user: User) => {
    const db = getFirestore();
    const userRef = doc(db, "users", user.uid);
    
    // Vérifier si l'utilisateur existe déjà
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Créer un nouveau document utilisateur
      await setDoc(userRef, {
        email: user.email,
        createdAt: new Date().toISOString(),
        profileCompleted: "no",
        role: "chercheur", // Rôle par défaut
      });
      
      // Créer un document de profil vide
      const profileRef = doc(db, "profiles", user.uid);
      await setDoc(profileRef, {
        chercheur: {
          telephone: "",
          ville: "",
          pays: "",
          adresse: "",
          formations: [],
          liens: {},
          cv: "",
          photoProfil: "",
          updatedAt: new Date().toISOString(),
        },
        profileCompleted: "no",
      });
    }
  };

  const loadUserProfile = async (user: User) => {
    const db = getFirestore();
    const profileRef = doc(db, "profiles", user.uid);
    const profileDoc = await getDoc(profileRef);
    
    if (profileDoc.exists()) {
      const profileData = profileDoc.data();
      setProfile(profileData);
      setIsProfileComplete(profileData.profileCompleted === "yes");
    } else {
      setProfile(null);
      setIsProfileComplete(false);
    }
  };

  const updateProfileCompletion = async (userId: string, isComplete: boolean) => {
    const db = getFirestore();
    const userRef = doc(db, "users", userId);
    const profileRef = doc(db, "profiles", userId);
    
    const newStatus = isComplete ? "yes" : "no";
    
    // Mettre à jour dans users
    await updateDoc(userRef, {
      profileCompleted: newStatus,
    });
    
    // Mettre à jour dans profiles
    await updateDoc(profileRef, {
      profileCompleted: newStatus,
    });
    
    // Mettre à jour l'état local
    setIsProfileComplete(isComplete);
  };

  const value = {
    user,
    loading,
    isChecking,
    error,
    googleData,
    profile,
    isProfileComplete,
    createUser,
    signIn: handleSignIn,
    signInWithGoogle: handleSignInWithGoogle,
    registerWithGoogle: handleRegisterWithGoogle,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    clearGoogleData,
    updateProfileCompletion
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

