import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  type UserCredential,
  getAuth,
  onAuthStateChanged,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./config"
import { toast } from "react-hot-toast"
import { app } from "./firebase"

export type UserRole = "staff" | "company"

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

interface AuthResult {
  success: boolean
  user?: UserCredential["user"]
  error?: string
  isNewUser?: boolean
  googleData?: {
    name: string | null
    email: string | null
    photoURL: string | null
  }
}

export const auth = getAuth(app)

// Fonction utilitaire pour vérifier l'état de l'authentification
export const checkAuthState = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe()
        resolve(user)
      },
      reject
    )
  })
}

// Fonction pour obtenir le token d'authentification actuel
export const getCurrentUserToken = async () => {
  const user = auth.currentUser
  if (!user) return null
  
  try {
    const token = await user.getIdToken()
    return token
  } catch (error) {
    console.error("Erreur lors de la récupération du token:", error)
    return null
  }
}

/**
 * Vérifie si un utilisateur existe déjà dans Firestore
 */
export async function checkUserExists(email: string): Promise<boolean> {
  try {
    // Vérifier si l'email existe déjà dans Firestore
    const usersRef = doc(db, "userEmails", email.toLowerCase())
    const docSnap = await getDoc(usersRef)
    return docSnap.exists()
  } catch (error) {
    console.error("Erreur lors de la vérification de l'utilisateur:", error)
    return false
  }
}

/**
 * Crée un nouvel utilisateur avec email et mot de passe
 */
export async function signUp({ name, email, password, role, companyName }: SignUpData): Promise<AuthResult> {
  try {
    // Vérification stricte des données
    if (!name || name.trim().length < 2) {
      return { success: false, error: "Le nom doit contenir au moins 2 caractères." }
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Veuillez fournir une adresse email valide." }
    }

    if (!password || password.length < 8) {
      return { success: false, error: "Le mot de passe doit contenir au moins 8 caractères." }
    }

    if (role === "company" && (!companyName || companyName.trim().length < 2)) {
      return { success: false, error: "Le nom de l'entreprise est requis." }
    }

    // Vérifier si l'utilisateur existe déjà
    const userExists = await checkUserExists(email)
    if (userExists) {
      return { success: false, error: "Cette adresse email est déjà utilisée." }
    }

    // Créer l'utilisateur dans Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Mettre à jour le nom d'affichage
    await updateProfile(user, { displayName: name })

    // Créer un document utilisateur complet dans Firestore
    const userData = {
      uid: user.uid,
      name,
      email: email.toLowerCase(),
      role,
      ...(role === "company" && { companyName }),
      createdAt: serverTimestamp(),
      savedJobs: [],
      lastLogin: serverTimestamp(),
      profileComplete: false,
      authProvider: "email",
    }

    // Enregistrer les données utilisateur dans Firestore
    await setDoc(doc(db, "users", user.uid), userData)

    // Enregistrer l'email dans une collection séparée pour les recherches rapides
    await setDoc(doc(db, "userEmails", email.toLowerCase()), {
      uid: user.uid,
      createdAt: serverTimestamp(),
    })

    console.log("Utilisateur créé avec succès:", user.uid)

    return { success: true, user }
  } catch (error: any) {
    console.error("Erreur lors de l'inscription:", error)

    // Gérer les erreurs spécifiques de Firebase Auth
    let errorMessage = "Échec de la création du compte. Veuillez réessayer."

    if (error.code) {
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Cette adresse email est déjà utilisée. Veuillez utiliser une autre adresse ou vous connecter."
          break
        case "auth/weak-password":
          errorMessage = "Le mot de passe est trop faible. Veuillez utiliser au moins 8 caractères."
          break
        case "auth/invalid-email":
          errorMessage = "Format d'email invalide. Veuillez entrer une adresse email valide."
          break
        case "auth/network-request-failed":
          errorMessage = "Erreur réseau. Veuillez vérifier votre connexion internet et réessayer."
          break
        case "auth/too-many-requests":
          errorMessage = "Trop de tentatives. Veuillez réessayer plus tard."
          break
        case "auth/operation-not-allowed":
          errorMessage =
            "L'authentification par email/mot de passe n'est pas activée. Veuillez activer cette méthode dans la console Firebase: Authentication > Sign-in method > Email/Password > Enable."
          break
      }
    }

    return { success: false, error: errorMessage }
  }
}

/**
 * Connecte un utilisateur avec email et mot de passe
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    // Vérification stricte des données
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Veuillez fournir une adresse email valide." }
    }

    if (!password) {
      return { success: false, error: "Veuillez entrer votre mot de passe." }
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password)

    // Mettre à jour la dernière connexion
    await setDoc(
      doc(db, "users", userCredential.user.uid),
      {
        lastLogin: serverTimestamp(),
      },
      { merge: true },
    )

    return { success: true, user: userCredential.user }
  } catch (error: any) {
    console.error("Erreur lors de la connexion:", error)

    let errorMessage = "Échec de la connexion. Veuillez vérifier vos identifiants."

    if (error.code) {
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
          errorMessage = "Email ou mot de passe invalide. Veuillez réessayer."
          break
        case "auth/too-many-requests":
          errorMessage =
            "Trop de tentatives de connexion échouées. Veuillez réessayer plus tard ou réinitialiser votre mot de passe."
          break
        case "auth/user-disabled":
          errorMessage = "Ce compte a été désactivé. Veuillez contacter le support."
          break
        case "auth/network-request-failed":
          errorMessage = "Erreur réseau. Veuillez vérifier votre connexion internet et réessayer."
          break
      }
    }

    return { success: false, error: errorMessage }
  }
}

/**
 * Vérifie si un utilisateur Google existe déjà dans Firestore
 */
export async function checkGoogleUserExists(email: string): Promise<boolean> {
  if (!email) return false

  try {
    // Vérifier si l'email existe déjà dans Firestore
    const usersRef = doc(db, "userEmails", email.toLowerCase())
    const docSnap = await getDoc(usersRef)
    return docSnap.exists()
  } catch (error) {
    console.error("Erreur lors de la vérification de l'utilisateur Google:", error)
    return false
  }
}

/**
 * Connecte un utilisateur avec Google
 * Retourne isNewUser: true si l'utilisateur n'existe pas encore
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    // Créer un nouveau fournisseur d'authentification Google avec des paramètres personnalisés
    const provider = new GoogleAuthProvider()

    // Ajouter des scopes si nécessaire
    provider.addScope("email")
    provider.addScope("profile")

    // Définir des paramètres personnalisés
    provider.setCustomParameters({
      prompt: "select_account",
    })

    console.log("Démarrage du processus de connexion Google...")

    // Utiliser signInWithPopup avec le fournisseur configuré
    const userCredential = await signInWithPopup(auth, provider)

    // Obtenir l'utilisateur à partir des informations d'identification
    const user = userCredential.user
    console.log("Connexion Google réussie pour l'utilisateur:", user.email)

    // Vérifier si l'utilisateur existe déjà dans Firestore
    const userExists = await checkGoogleUserExists(user.email || "")

    if (!userExists) {
      console.log("Nouvel utilisateur Google, redirection vers l'inscription")
      // Retourner les informations pour l'inscription
      return {
        success: false,
        isNewUser: true,
        googleData: {
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        },
        error: "Vous devez d'abord vous inscrire !",
      }
    }

    // L'utilisateur existe, mettre à jour la dernière connexion
    const userDoc = await getDoc(doc(db, "users", user.uid))

    if (userDoc.exists()) {
      await setDoc(
        doc(db, "users", user.uid),
        {
          lastLogin: serverTimestamp(),
        },
        { merge: true },
      )
      console.log("Dernière connexion mise à jour pour l'utilisateur existant")
    } else {
      // Cas rare: l'email existe mais pas l'utilisateur avec cet UID
      console.log("Email trouvé mais UID différent, possible conflit d'authentification")
      return {
        success: false,
        error: "Un problème est survenu avec votre compte. Veuillez contacter le support.",
      }
    }

    return { success: true, user }
  } catch (error: any) {
    console.error("Erreur lors de la connexion Google:", error)
    console.error("Code d'erreur:", error.code)
    console.error("Message d'erreur:", error.message)

    let errorMessage = "Échec de la connexion avec Google. Veuillez réessayer."

    if (error.code) {
      switch (error.code) {
        case "auth/unauthorized-domain":
          errorMessage =
            "Ce domaine n'est pas autorisé pour l'authentification Google. Veuillez ajouter ce domaine à votre liste de domaines autorisés Firebase ou utiliser l'authentification par email/mot de passe."
          break
        case "auth/popup-closed-by-user":
          errorMessage = "La fenêtre de connexion a été fermée. Veuillez réessayer."
          break
        case "auth/popup-blocked":
          errorMessage =
            "La fenêtre de connexion a été bloquée par votre navigateur. Veuillez autoriser les popups pour ce site."
          break
        case "auth/cancelled-popup-request":
          errorMessage = "Plusieurs demandes de popup ont été détectées. Veuillez réessayer."
          break
        case "auth/network-request-failed":
          errorMessage = "Erreur réseau. Veuillez vérifier votre connexion internet et réessayer."
          break
        case "auth/operation-not-allowed":
          errorMessage = "La connexion Google n'est pas activée. Veuillez contacter l'administrateur."
          break
        case "auth/account-exists-with-different-credential":
          errorMessage =
            "Un compte existe déjà avec la même adresse email mais des identifiants de connexion différents."
          break
      }
    }

    // Afficher un toast avec le message d'erreur pour une meilleure visibilité
    toast.error(errorMessage)

    return { success: false, error: errorMessage }
  }
}

/**
 * Inscrit un nouvel utilisateur avec les données Google
 */
export async function registerWithGoogle(googleData: any, userData: GoogleSignUpData): Promise<AuthResult> {
  try {
    if (!googleData || !googleData.email) {
      return { success: false, error: "Données Google manquantes ou invalides." }
    }

    // Vérification stricte des données
    if (userData.role === "company" && (!userData.companyName || userData.companyName.trim().length < 2)) {
      return { success: false, error: "Le nom de l'entreprise est requis." }
    }

    // Vérifier si l'utilisateur existe déjà
    const userExists = await checkUserExists(googleData.email)
    if (userExists) {
      return { success: false, error: "Cette adresse email est déjà utilisée." }
    }

    // Créer un document utilisateur complet dans Firestore
    const userDocData = {
      uid: googleData.uid,
      name: googleData.name || "Utilisateur",
      email: googleData.email.toLowerCase(),
      role: userData.role,
      ...(userData.role === "company" && { companyName: userData.companyName }),
      createdAt: serverTimestamp(),
      savedJobs: [],
      lastLogin: serverTimestamp(),
      profileComplete: false,
      photoURL: googleData.photoURL || null,
      authProvider: "google",
    }

    // Enregistrer les données utilisateur dans Firestore
    await setDoc(doc(db, "users", googleData.uid), userDocData)

    // Enregistrer l'email dans une collection séparée pour les recherches rapides
    await setDoc(doc(db, "userEmails", googleData.email.toLowerCase()), {
      uid: googleData.uid,
      createdAt: serverTimestamp(),
    })

    console.log("Utilisateur Google enregistré avec succès:", googleData.uid)

    return { success: true }
  } catch (error: any) {
    console.error("Erreur lors de l'inscription avec Google:", error)
    return {
      success: false,
      error: "Échec de l'inscription avec Google. Veuillez réessayer.",
    }
  }
}

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Veuillez fournir une adresse email valide." }
    }

    await sendPasswordResetEmail(auth, email)
    return { success: true }
  } catch (error: any) {
    console.error("Erreur lors de la réinitialisation du mot de passe:", error)

    let errorMessage = "Échec de l'envoi de l'email de réinitialisation. Veuillez réessayer."

    if (error.code) {
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "Aucun compte trouvé avec cette adresse email."
          break
        case "auth/invalid-email":
          errorMessage = "Format d'email invalide. Veuillez entrer une adresse email valide."
          break
        case "auth/too-many-requests":
          errorMessage = "Trop de demandes. Veuillez réessayer plus tard."
          break
      }
    }

    return { success: false, error: errorMessage }
  }
}

