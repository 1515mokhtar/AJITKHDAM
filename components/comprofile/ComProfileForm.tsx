"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EntrepriseForm } from "./EntrepriseForm"
import { DocumentsPage } from "./DocumentsPage"

export function ComProfileForm() {
  const [activeTab, setActiveTab] = useState("info")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="info">Informations</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
      <TabsContent value="info" className="space-y-4">
        <EntrepriseForm />
      </TabsContent>
      <TabsContent value="documents" className="space-y-4">
        <DocumentsPage />
      </TabsContent>
    </Tabs>
  )
} 