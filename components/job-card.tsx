"use client"

import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { MapPin, Building2, Clock, Briefcase, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Job } from "@/types"

interface JobCardProps {
  job: Job
}

export default function JobCard({ job }: JobCardProps) {
  const {
    id,
    title,
    description,
    type,
    location,
    company,
    salary,
    createdAt,
  } = job

  // Vérifie si le logo est une URL valide
  const isValidLogoUrl = company.logo && (
    company.logo.startsWith('http://') || 
    company.logo.startsWith('https://') || 
    company.logo.startsWith('/uploads/')
  )

  return (
    <div className="rounded-lg border p-4 hover:border-primary/50 transition-colors">
      <div className="flex gap-4">
        {/* Logo de l'entreprise */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border">
          {isValidLogoUrl ? (
            <Image
              src={company.logo}
              alt={`${company.name} logo`}
              className="object-cover"
              fill
              sizes="48px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Informations principales */}
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold leading-none">{title}</h3>
          <p className="text-sm text-muted-foreground">{company.name}</p>
          
          {/* Métadonnées */}
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              <span>{type}</span>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              <span>{salary}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {formatDistanceToNow(new Date(createdAt.seconds * 1000), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>
          </div>

          {/* Description avec limite de lignes */}
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>

          {/* Boutons d'action */}
          <div className="mt-4 flex gap-2">
            <Button asChild>
              <Link href={`/apply/${id}`}>
                Postuler
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/jobs/${id}`}>
                Détails
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

