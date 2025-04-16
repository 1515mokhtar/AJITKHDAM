'use client'

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { ProfileFormProvider } from "@/context/profile-context"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ProfileFormProvider initialProfile={undefined}>
          {children}
          <Toaster />
        </ProfileFormProvider>
      </ThemeProvider>
    </AuthProvider>
  )
} 