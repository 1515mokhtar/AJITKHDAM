import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Vérification initiale
    setMatches(media.matches);

    // Écouteur d'événements pour les changements
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Ajout de l'écouteur
    media.addEventListener('change', listener);

    // Nettoyage
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
} 