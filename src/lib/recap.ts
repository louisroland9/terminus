import { duree, type Etape, type TrajetAllerRetour } from "./trajet";

const numeroBillet = (numero: number) => String(numero).padStart(3, "0");

const trains = (etapes: Etape[]) =>
  etapes.flatMap((etape) => (etape.train ? ["🚃"] : [])).join("🔁");

const accord = (mot: string, nombre: number) => (nombre > 1 ? `${mot}s` : mot);

export type RecapDuJour = { numero: number; serie: number };

type Options = {
  numero?: number | undefined;
  departementsCarnet?: number | undefined;
  duJour?: RecapDuJour | undefined;
};

export function titreBillet({ numero, duJour }: Options) {
  if (duJour) return `Terminus du jour #${duJour.numero}`;
  return numero === undefined ? "billet partagé" : `billet n°${numeroBillet(numero)}`;
}

/** Résumé court et visuel d'un billet, à coller n'importe où (le lien est ajouté au partage). */
export function recapBillet(trajet: TrajetAllerRetour, options: Options = {}): string {
  const depart = trajet.etapesAller[0]?.gare.nom ?? "";
  const arrivee = trajet.etapesAller.at(-1)?.gare.nom ?? "";
  const { numero, departementsCarnet, duJour } = options;

  return [
    numero === undefined && !duJour ? "TERMINUS 🎰" : `TERMINUS 🎰 ${titreBillet(options)}`,
    `${depart} → ${arrivee}`,
    `${trains(trajet.etapesAller)} / ${trains(trajet.etapesRetour)}`,
    `${duree(trajet.duree)} · ${trajet.distance} km · ${trajet.depts.length} ${accord("dépt", trajet.depts.length)}`,
    ...(departementsCarnet === undefined
      ? []
      : [`🗺️ ${departementsCarnet} ${accord("dépt", departementsCarnet)} au carnet`]),
    ...(duJour ? [`🔥 ${duJour.serie} ${accord("jour", duJour.serie)} d'affilée`] : []),
  ].join("\n");
}
