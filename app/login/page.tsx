"use client"

import { LoginRedirect } from "@/components/auth/LoginRedirect"
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <div className="container flex h-[calc(100vh-4rem)] items-center justify-center">
      <LoginRedirect />
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Connexion</h1>
          <p className="text-muted-foreground">
            Entrez vos identifiants pour vous connecter
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
} 