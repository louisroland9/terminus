import { useEffect, useState } from "react";
import {
  ajouterBillet,
  ecrireCarnet,
  lireCarnet,
  type Carnet,
  type TirageDuJour,
} from "@/lib/carnet";
import type { TrajetAllerRetour } from "@/lib/trajet";

export function useCarnet() {
  // `null` tant que le navigateur n'a pas été lu (rendu serveur compris).
  const [carnet, setCarnet] = useState<Carnet | null>(null);

  useEffect(() => setCarnet(lireCarnet()), []);

  const enregistrer = (trajet: TrajetAllerRetour, duJour?: TirageDuJour) => {
    const suivant = ajouterBillet(lireCarnet(), trajet, duJour);
    ecrireCarnet(suivant);
    setCarnet(suivant);
    return suivant;
  };

  return { carnet, enregistrer };
}
