import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import { isCompanyProfileComplete } from "./lib/firebase/company"

export async function middleware(request: NextRequest) {
  const { userId, sessionClaims } = getAuth(request)
  const role = sessionClaims?.role as string | undefined

  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  // Si l'utilisateur a le rôle "company"
  if (role === "company") {
    // Ne pas vérifier le profil sur la page de profil elle-même
    if (!request.nextUrl.pathname.startsWith("/company/profile")) {
      const isProfileComplete = await isCompanyProfileComplete(userId)
      
      // Si le profil n'est pas complet, rediriger vers la page de profil
      if (!isProfileComplete) {
        return NextResponse.redirect(new URL("/company/profile", request.url))
      }
    }
  }

  return NextResponse.next()
}

// Configurer les chemins qui déclenchent le middleware
export const config = {
  matcher: [
    "/company/:path*",
    "/jobs/post",
  ]
} 