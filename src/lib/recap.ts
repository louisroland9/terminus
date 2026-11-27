import { duree, type Etape, type TrajetAllerRetour } from "./trajet";

export const numeroBillet = (numero: number) => String(numero).padStart(3, "0");

const trains = (etapes: Etape[]) =>
  etapes.flatMap((etape) => (etape.train ? ["🚃"] : [])).join("🔁");

const accord = (mot: string, nombre: number) => (nombre > 1 ? `${mot}s` : mot);

type Options = { numero?: number | undefined; departementsCarnet?: number | undefined };

/** Résumé court et visuel d'un billet, à coller n'importe où (le lien est ajouté au partage). */
export function recapBillet(trajet: TrajetAllerRetour, options: Options = {}): string {
  const depart = trajet.etapesAller[0]?.gare.nom ?? "";
  const arrivee = trajet.etapesAller.at(-1)?.gare.nom ?? "";
  const { departementsCarnet } = options;

  return [
    options.numero === undefined
      ? "TERMINUS 🎰"
      : `TERMINUS 🎰 billet n°${numeroBillet(options.numero)}`,
    `${depart} → ${arrivee}`,
    `${trains(trajet.etapesAller)} / ${trains(trajet.etapesRetour)}`,
    `${duree(trajet.duree)} · ${trajet.distance} km · ${trajet.depts.length} ${accord("dépt", trajet.depts.length)}`,
    ...(departementsCarnet === undefined
      ? []
      : [`🗺️ ${departementsCarnet} ${accord("dépt", departementsCarnet)} au carnet`]),
  ].join("\n");
}
