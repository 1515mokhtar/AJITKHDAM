"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Utiliser useRef pour suivre la clé sans déclencher de re-rendus
  const keyRef = useRef(key);
  
  // Utiliser useRef pour suivre la valeur sans déclencher de re-rendus
  const valueRef = useRef<T>(initialValue);
  
  // État pour déclencher les re-rendus
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Vérifier si window est défini (pour éviter les erreurs SSR)
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      // Récupérer la valeur du localStorage
      const item = window.localStorage.getItem(key);
      // Analyser la valeur stockée ou retourner initialValue
      const parsedValue = item ? JSON.parse(item) : initialValue;
      // Mettre à jour la référence
      valueRef.current = parsedValue;
      return parsedValue;
    } catch (error) {
      console.error("Erreur lors de la récupération de la valeur du localStorage:", error);
      return initialValue;
    }
  });

  // Mettre à jour la référence lorsque storedValue change
  useEffect(() => {
    valueRef.current = storedValue;
  }, [storedValue]);

  // Fonction pour mettre à jour la valeur
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Permettre à la valeur d'être une fonction pour avoir la même API que useState
      const valueToStore = value instanceof Function ? value(valueRef.current) : value;
      
      // Sauvegarder dans localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(keyRef.current, JSON.stringify(valueToStore));
      }
      
      // Mettre à jour l'état pour déclencher un re-rendu
      setStoredValue(valueToStore);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la valeur dans le localStorage:", error);
    }
  }, []);

  return [storedValue, setValue] as const;
} 