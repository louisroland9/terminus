// « Terminus du jour » : fenêtre et graine communes à toutes les personnes qui jouent un même jour.
const FUSEAU = "Europe/Paris";
const PREMIER_JOUR = "2026-11-27";
const HEURE_DEPART = 8;
const HEURE_RETOUR = 22;
const JOUR_MS = 24 * 60 * 60 * 1000;

export const LIBELLE_FENETRE = `Départ dès ${HEURE_DEPART} h, retour avant ${HEURE_RETOUR} h (heure de Paris)`;

/** Date du jour à Paris, au format AAAA-MM-JJ. */
export const jourParis = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSEAU,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

/** Instant correspondant à une heure pile à Paris (hors créneau du changement d'heure). */
function instantParis(jour: string, heure: number): Date {
  const utc = Date.parse(`${jour}T${String(heure).padStart(2, "0")}:00:00Z`);
  const heureParis = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: FUSEAU,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(utc),
  );
  // Paris est en avance sur UTC ; le modulo couvre le passage à minuit (22 h UTC = 0 h en été).
  const decalage = (heureParis - heure + 24) % 24;
  return new Date(utc - decalage * 60 * 60 * 1000);
}

export const fenetreDuJour = (jour: string) => ({
  departLe: instantParis(jour, HEURE_DEPART),
  retourAvant: instantParis(jour, HEURE_RETOUR),
});

export const graineDuJour = (jour: string, gareId: number) => `${jour}:${gareId}`;

export const numeroDuJour = (jour: string) =>
  Math.round((Date.parse(jour) - Date.parse(PREMIER_JOUR)) / JOUR_MS) + 1;

export const veille = (jour: string) =>
  new Date(Date.parse(jour) - JOUR_MS).toISOString().slice(0, 10);
