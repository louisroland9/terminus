import { z } from "zod";
import { GARES, type Gare } from "./trajet";

/** Tout ce qu'il faut pour rejouer un tirage à l'identique. */
export type Billet = {
  origineId: number;
  destinationId: number;
  departLe: Date;
  retourAvant: Date;
};

const MINUTE_MS = 60_000;
// Le routeur ne cherche pas de retour au-delà de 7 jours.
const ECART_MAX_MINUTES = 8 * 24 * 60;
const LONGUEUR_CODE_MAX = 120;

const idGare = z
  .number()
  .int()
  .min(0)
  .max(GARES.length - 1);
const minutesEpoch = z.number().int().min(0).max(100_000_000);
const contenu = z
  .object({ o: idGare, d: idGare, t: minutesEpoch, r: minutesEpoch })
  .refine(({ t, r }) => r > t && r - t <= ECART_MAX_MINUTES);

export function encoderBillet(billet: Billet): string {
  const json = JSON.stringify({
    o: billet.origineId,
    d: billet.destinationId,
    t: Math.floor(billet.departLe.getTime() / MINUTE_MS),
    r: Math.floor(billet.retourAvant.getTime() / MINUTE_MS),
  });
  return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decoderBillet(code: string): Billet | null {
  if (code.length > LONGUEUR_CODE_MAX) return null;
  try {
    const json: unknown = JSON.parse(atob(code.replace(/-/g, "+").replace(/_/g, "/")));
    const resultat = contenu.safeParse(json);
    if (!resultat.success) return null;
    const { o, d, t, r } = resultat.data;
    return {
      origineId: o,
      destinationId: d,
      departLe: new Date(t * MINUTE_MS),
      retourAvant: new Date(r * MINUTE_MS),
    };
  } catch {
    return null;
  }
}

export const gareDuBillet = (id: number): Gare => GARES[id]!;
