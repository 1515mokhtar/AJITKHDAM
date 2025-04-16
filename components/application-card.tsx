import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Building } from "lucide-react"
import type { Application } from "@/types"

interface ApplicationCardProps {
  application: Application
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    interview: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  }

  const statusColor = statusColors[application.status as keyof typeof statusColors] || statusColors.pending

  // Vérifier si appliedAt existe et est correctement formaté
  const hasValidAppliedDate =
    application.appliedAt && typeof application.appliedAt === "object" && "seconds" in application.appliedAt

  // Formater la date seulement si elle est valide
  const appliedDate = hasValidAppliedDate
    ? new Date(application.appliedAt.seconds * 1000).toLocaleDateString()
    : "Date inconnue"

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold">{application.job?.title || "Offre d'emploi"}</h3>
          <div className="mt-1 flex items-center text-sm text-muted-foreground">
            <Building className="mr-1 h-4 w-4" />
            {application.job?.company?.name || "Entreprise"}
          </div>
          <div className="mt-1 flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-1 h-4 w-4" />
            Postulé le {appliedDate}
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <Badge className={statusColor}>
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </Badge>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/jobs/${application.jobId}`}>
          <Button variant="outline" size="sm">
            Voir l'offre
          </Button>
        </Link>
        <Link href={`/applications/${application.id}`}>
          <Button size="sm">Voir la candidature</Button>
        </Link>
      </div>
    </div>
  )
}

