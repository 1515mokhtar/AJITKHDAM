import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import JobListings from "@/components/job-listings"

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background pt-16 pb-12">
        <div className="container flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
            Trouvez votre emploi idéal aujourd'hui
          </h1>
          <p className="mt-4 max-w-[700px] text-muted-foreground md:text-xl">
            Connectez-vous avec les meilleurs employeurs et découvrez des opportunités qui correspondent à vos
            compétences et objectifs de carrière.
          </p>
          <div className="mt-8 flex w-full max-w-md flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Rechercher des emplois..." className="w-full pl-8" />
            </div>
            <Button type="submit">Rechercher</Button>
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Offres d'emploi récentes</h2>
          <Link href="/jobs">
            <Button variant="ghost">Voir toutes les offres</Button>
          </Link>
        </div>
        <JobListings limit={6} />
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-16">
        <div className="container">
          <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">Comment ça marche</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mt-4 text-xl font-bold">Créez votre profil</h3>
              <p className="mt-2 text-muted-foreground">
                Inscrivez-vous et créez votre profil professionnel pour mettre en valeur vos compétences et votre
                expérience.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mt-4 text-xl font-bold">Découvrez des opportunités</h3>
              <p className="mt-2 text-muted-foreground">
                Parcourez les offres d'emploi qui correspondent à vos compétences et préférences.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mt-4 text-xl font-bold">Postulez facilement</h3>
              <p className="mt-2 text-muted-foreground">
                Soumettez vos candidatures avec votre profil et suivez l'état de vos candidatures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16">
        <div className="rounded-lg bg-muted p-8 text-center md:p-12">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Prêt à commencer votre recherche d'emploi ?</h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Créez un compte pour postuler à des emplois, enregistrer vos favoris et recevoir des recommandations
            personnalisées.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg">Créer un compte</Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline" size="lg">
                Parcourir les offres
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

