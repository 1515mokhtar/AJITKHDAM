export type Formation = {
  titre: string;
  etablissement: string;
  ville: string;
  pays: string;
  dateDebut: string;
  dateFin: string;
};

export type ProfilChercheur = {
  telephone: string;
  ville: string;
  pays: string;
  adresse: string;
  liens?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  formations: {
    titre: string;
    etablissement: string;
    ville: string;
    pays: string;
    dateDebut: string;
    dateFin: string;
  }[];
  cv?: string;
  photoProfil?: string;
};

export type Filiale = {
  nom: string;
  ville: string;
  pays: string;
};

export type ProfilEntreprise = {
  nom: string;
  typeEntreprise: 'startup' | 'grand groupe' | 'multinationale' | 'internationale';
  ville: string;
  pays: string;
  dateFondation: string;
  nombreEmployes: number;
  nombreRecrutementsAnnee: number;
  description: string;
  contactRH: {
    email: string;
    telephone: string;
  };
  siteWeb?: string;
  linkedin?: string;
  logo?: string;
  filiales?: {
    nom: string;
    ville: string;
    pays: string;
  }[];
};

export type Profil = {
  id: string;
  userId: string;
  role: 'chercheur' | 'company';
  chercheur?: ProfilChercheur;
  entreprise?: ProfilEntreprise;
  createdAt: string;
  updatedAt: string;
}; 