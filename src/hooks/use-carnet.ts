import { useEffect, useState } from "react";
import { ajouterBillet, ecrireCarnet, lireCarnet, type Carnet } from "@/lib/carnet";
import type { TrajetAllerRetour } from "@/lib/trajet";

export function useCarnet() {
  // `null` tant que le navigateur n'a pas été lu (rendu serveur compris).
  const [carnet, setCarnet] = useState<Carnet | null>(null);

  useEffect(() => setCarnet(lireCarnet()), []);

  const enregistrer = (trajet: TrajetAllerRetour) => {
    const suivant = ajouterBillet(lireCarnet(), trajet);
    ecrireCarnet(suivant);
    setCarnet(suivant);
    return suivant;
  };

  return { carnet, enregistrer };
}
