import { z } from "zod";
import { veille } from "./quotidien";
import { GARES, type TrajetAllerRetour } from "./trajet";

// Carnet de voyage conservé uniquement dans le navigateur.
const CLE = "terminus:carnet";

const schema = z.object({
  billets: z.number().int().min(0),
  gares: z.array(z.number().int().min(0)),
  // Dernier jour joué en « tirage du jour », gares de départ jouées ce jour-là et série en cours.
  quotidien: z
    .object({
      jour: z.string(),
      gares: z.array(z.number().int().min(0)),
      serie: z.number().int().min(1),
    })
    .optional(),
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

export type TirageDuJour = { jour: string; gareId: number };

function noterTirageDuJour(
  precedent: Carnet["quotidien"],
  { jour, gareId }: TirageDuJour,
): NonNullable<Carnet["quotidien"]> {
  if (precedent?.jour === jour) {
    return { ...precedent, gares: [...new Set([...precedent.gares, gareId])] };
  }
  const serie = precedent?.jour === veille(jour) ? precedent.serie + 1 : 1;
  return { jour, gares: [gareId], serie };
}

export function ajouterBillet(
  carnet: Carnet,
  trajet: TrajetAllerRetour,
  duJour?: TirageDuJour,
): Carnet {
  // Les arrêts hors de la liste locale ont un identifiant qui dépend du flux GTFS : on les ignore.
  const atteintes = trajet.etapes.map((etape) => etape.gare.id).filter((id) => id < GARES.length);
  // Revoir son tirage du jour ne compte pas comme un nouveau billet.
  const dejaTire =
    duJour !== undefined &&
    carnet.quotidien?.jour === duJour.jour &&
    carnet.quotidien.gares.includes(duJour.gareId);
  const quotidien = duJour ? noterTirageDuJour(carnet.quotidien, duJour) : carnet.quotidien;

  return {
    billets: carnet.billets + (dejaTire ? 0 : 1),
    gares: [...new Set([...carnet.gares, ...atteintes])],
    ...(quotidien && { quotidien }),
  };
}

/** Série encore vivante : le dernier tirage du jour date d'aujourd'hui ou d'hier. */
export function serieEnCours(carnet: Carnet, aujourdhui: string): number {
  const { quotidien } = carnet;
  if (!quotidien) return 0;
  return quotidien.jour === aujourdhui || quotidien.jour === veille(aujourdhui)
    ? quotidien.serie
    : 0;
}

export const departementsDebloques = (carnet: Carnet) =>
  new Set(carnet.gares.flatMap((id) => GARES[id]?.dept ?? [])).size;
