import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/firebase/config"
import { isCompanyProfileComplete } from "./lib/firebase/company"

// Liste des routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ["/login", "/register", "/forgot-password", "/sign-in"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Si c'est une route publique, on laisse passer
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Vérifier si l'utilisateur est authentifié
  const token = request.cookies.get("firebase-auth-token")?.value

  if (!token) {
    // Si pas de token, rediriger vers la page de connexion
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    // Vérifier le token Firebase
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Si l'utilisateur est une entreprise, vérifier si son profil est complet
    if (pathname.startsWith("/company") && !pathname.startsWith("/company/profile")) {
      const isProfileComplete = await isCompanyProfileComplete(userId)
      
      if (!isProfileComplete) {
        return NextResponse.redirect(new URL("/company/profile", request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    // Si le token est invalide, rediriger vers la page de connexion
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

// Configurer les chemins qui déclenchent le middleware
export const config = {
  matcher: [
    "/dashboard",
    "/company/:path*",
    "/jobs/post",
    "/profile",
    "/mes-offres",
  ]
} 