import { z } from "zod";
import { GARES, type TrajetAllerRetour } from "./trajet";

// Carnet de voyage conservé uniquement dans le navigateur.
const CLE = "terminus:carnet";

const schema = z.object({
  billets: z.number().int().min(0),
  gares: z.array(z.number().int().min(0)),
});
export type Carnet = z.infer<typeof schema>;

export const CARNET_VIDE: Carnet = { billets: 0, gares: [] };

export const TOTAL_DEPARTEMENTS = new Set(GARES.map((gare) => gare.dept)).size;

export function lireCarnet(): Carnet {
  try {
    const resultat = schema.safeParse(JSON.parse(localStorage.getItem(CLE) ?? "null"));
    return resultat.success ? resultat.data : CARNET_VIDE;
  } catch {
    return CARNET_VIDE;
  }
}

export function ecrireCarnet(carnet: Carnet) {
  try {
    localStorage.setItem(CLE, JSON.stringify(carnet));
  } catch (erreur) {
    // Stockage plein ou interdit : le tirage reste utilisable sans carnet.
    console.warn("Carnet non enregistré", erreur);
  }
}

export function ajouterBillet(carnet: Carnet, trajet: TrajetAllerRetour): Carnet {
  // Les arrêts hors de la liste locale ont un identifiant qui dépend du flux GTFS : on les ignore.
  const atteintes = trajet.etapes.map((etape) => etape.gare.id).filter((id) => id < GARES.length);
  return {
    billets: carnet.billets + 1,
    gares: [...new Set([...carnet.gares, ...atteintes])],
  };
}

export const departementsDebloques = (carnet: Carnet) =>
  new Set(carnet.gares.flatMap((id) => GARES[id]?.dept ?? [])).size;
