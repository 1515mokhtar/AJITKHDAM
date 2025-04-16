"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/context/auth-context"
import { Menu, User, LogOut, Briefcase, BookmarkIcon, Plus, Bell, UserCircle, CheckCircle2, AlertCircle } from "lucide-react"
import { ModeToggle } from "./mode-toggle"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useProfileForm } from "@/context/profile-context"
import { useTheme } from "next-themes"
import { getFirestore, doc, getDoc } from "firebase/firestore"
import CompanyLogo from "@/components/company-logo"

export default function Navbar() {
  const pathname = usePathname()
  const { user, signOut, profile } = useAuth()
  const { formData, updateFormData } = useProfileForm()
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileComplete, setIsProfileComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  const routes = [
    {
      href: "/",
      label: "Accueil",
      active: pathname === "/",
    },
    {
      href: "/jobs",
      label: "Offres d'emploi",
      active: pathname === "/jobs",
    },
  ]

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!user) {
        setIsProfileComplete(false)
        setIsLoading(false)
        return
      }

      try {
        const db = getFirestore()
        const profileRef = doc(db, "profiles", user.uid)
        const profileDoc = await getDoc(profileRef)
        const profileData = profileDoc.data()
        
        setIsProfileComplete(profileData?.profileCompleted === 'yes')
        setUserRole(profileData?.role || user.role || null)
      } catch (error) {
        console.error("Erreur lors de la vérification du statut du profil:", error)
        setIsProfileComplete(false)
        setUserRole(user.role || null)
      } finally {
        setIsLoading(false)
      }
    }

    checkProfileStatus()
  }, [user])

  // Déterminer le lien du profil en fonction du rôle de l'utilisateur
  const getProfileLink = () => {
    if (userRole === "company") {
      return "/profile/entdetails"
    }
    return isProfileComplete ? "/profile/details" : "/profile"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Briefcase className="h-5 w-5" />
          <span>
            {" "}
            <span className="text-blue-400">Aji</span>Tkhdam
          </span>
        </Link>
        <nav className="hidden gap-6 md:flex md:ml-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                route.active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {route.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2">
          <ModeToggle />
          {user ? (
            <>
              <Link 
                href={getProfileLink()}
                className={cn(
                  "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  isProfileComplete 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                )}
              >
                {isProfileComplete ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Profil complet</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span>Profil à compléter</span>
                  </>
                )}
              </Link>

              <Button
                variant="ghost"
                size="icon"
                className="relative"
                asChild
              >
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                    3
                  </span>
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    {user.role === "company" ? (
                      <CompanyLogo />
                    ) : (
                      <Avatar className="h-8 w-8">
                        {profile?.chercheur?.photoProfil ? (
                          <AvatarImage src={profile.chercheur.photoProfil} alt="Photo de profil" />
                        ) : null}
                        <AvatarFallback>
                          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="font-medium">{user.name || user.email}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {user.role === "chercheur" && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Tableau de bord</Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "staff" && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard?tab=saved">
                        <BookmarkIcon className="mr-2 h-4 w-4" /> Offres sauvegardées
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "company" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/mes-offres">
                          <Briefcase className="mr-2 h-4 w-4" /> Mes offres
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/publier-offre">
                          <Plus className="mr-2 h-4 w-4" /> Publier une offre
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link
                      href={getProfileLink()}
                      className={cn(
                        'text-sm font-medium transition-colors hover:text-primary relative',
                        pathname === '/profile' || pathname === '/profile/details' || pathname === '/profile/entdetails'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      <div className="flex items-center">
                        <UserCircle className="w-4 h-4 mr-1" />
                        {isProfileComplete ? "Mon Profil" : "Complétez votre profil"}
                        {!isProfileComplete && (
                          <Badge variant="destructive" className="ml-2">
                            À compléter
                          </Badge>
                        )}
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex md:gap-2">
              <Link href="/login">
                <Button variant="ghost">Se connecter</Button>
              </Link>
              <Link href="/register">
                <Button>S'inscrire</Button>
              </Link>
            </div>
          )}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      route.active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {route.label}
                  </Link>
                ))}
                {!user ? (
                  <>
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full">
                        Se connecter
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsOpen(false)}>
                      <Button className="w-full">S'inscrire</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      href={getProfileLink()}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isProfileComplete 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                      )}
                    >
                      {isProfileComplete ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Profil complet</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          <span>Profil à compléter</span>
                        </>
                      )}
                    </Link>
                    <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <UserCircle className="mr-2 h-4 w-4" /> Tableau de bord
                      </Button>
                    </Link>
                    {user.role === "staff" && (
                      <Link href="/dashboard?tab=saved" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <BookmarkIcon className="mr-2 h-4 w-4" /> Offres sauvegardées
                        </Button>
                      </Link>
                    )}
                    {user.role === "company" && (
                      <>
                        <Link href="/mes-offres" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start">
                            <Briefcase className="mr-2 h-4 w-4" /> Mes offres
                          </Button>
                        </Link>
                        <Link href="/publier-offre" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start">
                            <Plus className="mr-2 h-4 w-4" /> Publier une offre
                          </Button>
                        </Link>
                      </>
                    )}
                    <Button variant="ghost" className="w-full justify-start" onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

