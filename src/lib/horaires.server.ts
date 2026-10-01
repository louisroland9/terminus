import { DateTime } from "luxon";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  Query,
  RangeQuery,
  Router,
  type Route,
  type Stop,
  type StopsIndex,
  type Timetable,
} from "minotor";
import { GtfsParser, standardGtfsProfile, StraightLineTransferGenerator } from "minotor/parser";

import { GARES, km, type Etape, type Gare, type TrajetAllerRetour } from "./trajet";

const GTFS_URL =
  "https://eu.ftp.opendatasoft.com/sncf/plandata/Export_OpenData_SNCF_GTFS_NewTripId.zip";
const FUSEAU_HORAIRE = "Europe/Paris";
const CORRESPONDANCE_METRES_MAX = 800;
const MIN_DISTANCE_TRAJET_KM = 20;
const MAX_DESTINATIONS_TENTEES = 30;
const MAX_JOURS_RETOUR = 7;
const CACHE_HORAIRES_MS = 12 * 60 * 60 * 1000;
const modesTrain = new Set([3]);

type DemandeTrajet = { gareDepartId: number; departLe: string; retourAvant: string };

type GareGtfs = { gare: Gare; station: Stop; quais: Stop[] };
type ContexteGtfs = {
  jour: string;
  jourDebut: DateTime;
  horaires: Timetable;
  arrets: StopsIndex;
  routeur: Router;
  gares: GareGtfs[];
  gareParId: Map<number, GareGtfs>;
  gareParStationGtfs: Map<number, Gare>;
};
type RoutePlanifiee = { route: Route; contexte: ContexteGtfs; arrivee: DateTime };
type EntreeCache<T> = { expireA: number; promesse: Promise<T> };

let fichierGtfsCache: EntreeCache<string> | undefined;
const contextes = new Map<string, EntreeCache<ContexteGtfs>>();

const normaliser = (nom: string) =>
  nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bst\b/g, "saint")
    .replace(/\bste\b/g, "sainte")
    .replace(/[^a-z0-9]/g, "");

async function obtenirFichierGtfs(): Promise<string> {
  const maintenant = Date.now();
  if (fichierGtfsCache && fichierGtfsCache.expireA > maintenant) {
    return fichierGtfsCache.promesse;
  }

  const precedent = fichierGtfsCache;
  if (precedent) {
    contextes.clear();
    void precedent.promesse
      .then((chemin) => rm(dirname(chemin), { recursive: true, force: true }))
      .catch(() => undefined);
  }

  const promesse = (async () => {
    const dossier = await mkdtemp(join(tmpdir(), "terminus-gtfs-"));
    const chemin = join(dossier, "sncf-gtfs.zip");
    const reponse = await fetch(GTFS_URL, { signal: AbortSignal.timeout(30_000) });
    if (!reponse.ok) throw new Error(`Flux GTFS SNCF indisponible (${reponse.status}).`);
    await writeFile(chemin, new Uint8Array(await reponse.arrayBuffer()));
    return chemin;
  })().catch((erreur: unknown) => {
    if (fichierGtfsCache?.promesse === promesse) fichierGtfsCache = undefined;
    throw erreur;
  });

  fichierGtfsCache = { expireA: maintenant + CACHE_HORAIRES_MS, promesse };
  return promesse;
}

function garesActives(arrets: StopsIndex, horaires: Timetable, jour: DateTime) {
  const stations = [...arrets].filter((arret) => arret.locationType === "STATION");
  const actives = stations.flatMap((station) => {
    const quais = station.children
      .map((id) => arrets.findStopById(id))
      .filter(
        (quai): quai is Stop =>
          quai !== undefined &&
          quai.sourceStopId?.startsWith("StopPoint:OCETrain TER-") === true &&
          horaires.isActive(quai.id),
      );
    return quais.length ? [{ station, quais }] : [];
  });

  const parNom = new Map<string, typeof actives>();
  for (const info of actives) {
    const cle = normaliser(info.station.name);
    const memeNom = parNom.get(cle) ?? [];
    memeNom.push(info);
    parNom.set(cle, memeNom);
  }

  const gares: GareGtfs[] = [];
  const gareParId = new Map<number, GareGtfs>();
  const gareParStationGtfs = new Map<number, Gare>();
  const distanceKm = (gare: Gare, station: Stop) =>
    station.lat === undefined || station.lon === undefined
      ? Number.POSITIVE_INFINITY
      : km(gare, { ...gare, lat: station.lat, lon: station.lon });

  for (const gare of GARES) {
    const cle = normaliser(gare.nom);
    let candidates = parNom.get(cle) ?? [];
    if (!candidates.length) {
      candidates = actives.filter(
        ({ station }) =>
          station.lat !== undefined &&
          station.lon !== undefined &&
          Math.abs(station.lat - gare.lat) < 0.004 &&
          Math.abs(station.lon - gare.lon) < 0.006 &&
          distanceKm(gare, station) <= 0.3,
      );
    }
    const match = candidates
      .map((candidate) => ({ ...candidate, distance: distanceKm(gare, candidate.station) }))
      .filter(({ distance }) => distance <= 0.5)
      .sort((a, b) => a.distance - b.distance)[0];
    if (
      !match ||
      gareParId.has(gare.id) ||
      gares.some((candidate) => candidate.station.id === match.station.id)
    )
      continue;

    const candidate = { gare, station: match.station, quais: match.quais };
    gares.push(candidate);
    gareParId.set(gare.id, candidate);
    gareParStationGtfs.set(match.station.id, gare);
  }

  return { gares, gareParId, gareParStationGtfs };
}

async function obtenirContexte(jour: DateTime): Promise<ContexteGtfs> {
  const cleJour = jour.setZone(FUSEAU_HORAIRE).toISODate();
  if (!cleJour) throw new Error("Date de service invalide.");
  const cache = contextes.get(cleJour);
  if (cache && cache.expireA > Date.now()) return cache.promesse;
  if (cache) contextes.delete(cleJour);

  const chargement = (async () => {
    const fichier = await obtenirFichierGtfs();
    const serviceDate = DateTime.fromISO(cleJour, { zone: FUSEAU_HORAIRE }).startOf("day");
    const dateGtfs = new Date(
      Date.UTC(serviceDate.year, serviceDate.month - 1, serviceDate.day, 12),
    );
    const parseur = new GtfsParser(
      fichier,
      standardGtfsProfile,
      new StraightLineTransferGenerator({
        maxDistanceMeters: CORRESPONDANCE_METRES_MAX,
        walkingSpeedKmh: 4,
        detourFactor: 1.25,
        changePenaltyMinutes: 2,
      }),
    );
    const horaires = await parseur.parseTimetable(dateGtfs);
    const arrets = await parseur.parseStops();
    const { gares, gareParId, gareParStationGtfs } = garesActives(arrets, horaires, serviceDate);

    return {
      jour: cleJour,
      jourDebut: serviceDate,
      horaires,
      arrets,
      routeur: new Router(horaires, arrets),
      gares,
      gareParId,
      gareParStationGtfs,
    };
  })().catch((erreur: unknown) => {
    if (contextes.get(cleJour)?.promesse === chargement) contextes.delete(cleJour);
    throw erreur;
  });

  contextes.set(cleJour, { expireA: Date.now() + CACHE_HORAIRES_MS, promesse: chargement });
  return chargement;
}

function garePourArret(arret: Stop, contexte: ContexteGtfs): Gare {
  const station =
    arret.locationType === "STATION"
      ? arret
      : arret.parent !== undefined
        ? (contexte.arrets.findStopById(arret.parent) ?? arret)
        : arret;
  const connue = contexte.gareParStationGtfs.get(station.id);
  if (connue) return connue;

  const nomNormalise = normaliser(station.name);
  const parNom = GARES.find((gare) => normaliser(gare.nom) === nomNormalise);
  if (parNom) return parNom;

  const lat = station.lat ?? arret.lat ?? 0;
  const lon = station.lon ?? arret.lon ?? 0;
  const proche = GARES.map((gare) => ({ gare, distance: km(gare, { ...gare, lat, lon }) }))
    .filter(({ distance }) => distance <= 0.5)
    .sort((a, b) => a.distance - b.distance)[0]?.gare;
  if (proche) return proche;

  return { id: GARES.length + station.id, nom: station.name, dept: "", lat, lon };
}

function dateHeure(jour: DateTime, minutes: number): DateTime {
  return jour.startOf("day").plus({ minutes });
}

function estUnTrajetTer(route: Route): boolean {
  return route.legs.every(
    (leg) =>
      !("departureTime" in leg) ||
      (leg.from.sourceStopId?.startsWith("StopPoint:OCETrain TER-") === true &&
        leg.to.sourceStopId?.startsWith("StopPoint:OCETrain TER-") === true),
  );
}

function formaterHeure(jour: DateTime, minutes: number): string {
  return dateHeure(jour, minutes).toFormat("HH:mm");
}

function construireEtapes(route: Route, contexte: ContexteGtfs, retour: boolean): Etape[] {
  const etapes: Etape[] = [];
  const ajouter = (gare: Gare): Etape => {
    const derniere = etapes[etapes.length - 1];
    if (derniere?.gare.id === gare.id) return derniere;
    const etape: Etape = { gare, ...(retour && { retour: true }) };
    etapes.push(etape);
    return etape;
  };

  for (const leg of route.legs) {
    const gareOrigine = garePourArret(leg.from, contexte);
    const gareDestination = garePourArret(leg.to, contexte);

    if ("departureTime" in leg) {
      const origine = ajouter(gareOrigine);
      origine.depart = formaterHeure(contexte.jourDebut, leg.departureTime);
      origine.train = leg.route.name ? `Ligne ${leg.route.name}` : "Train SNCF";
      const destination = ajouter(gareDestination);
      destination.arrivee = formaterHeure(contexte.jourDebut, leg.arrivalTime);
      continue;
    }

    const origine = ajouter(gareOrigine);
    const minutes = "duration" in leg ? leg.duration : (leg.minTransferTime ?? 0);
    if (gareOrigine.id !== gareDestination.id) {
      origine.marcheVers = gareDestination.nom;
      origine.marcheMinutes = minutes;
      ajouter(gareDestination);
    } else if (minutes > 0) {
      origine.attente = minutes;
    }
  }

  return etapes;
}

function melanger<T>(valeurs: T[]): T[] {
  const resultat = [...valeurs];
  for (let index = resultat.length - 1; index > 0; index--) {
    const autre = Math.floor(Math.random() * (index + 1));
    [resultat[index], resultat[autre]] = [resultat[autre]!, resultat[index]!];
  }
  return resultat;
}

async function chercherRetours(
  destination: GareGtfs,
  origine: GareGtfs,
  departApres: DateTime,
  deadline: DateTime,
): Promise<RoutePlanifiee[]> {
  const debut = departApres.startOf("day");
  const dernierJour = deadline.startOf("day");
  if (dernierJour.diff(debut, "days").days > MAX_JOURS_RETOUR) return [];

  const candidats = new Map<string, RoutePlanifiee>();
  for (let jour = debut; jour <= dernierJour; jour = jour.plus({ days: 1 })) {
    const contexte = await obtenirContexte(jour);
    const debutMinutes = Math.max(0, Math.ceil(departApres.diff(jour, "minutes").minutes));
    const finMinutes = Math.min(1439, Math.floor(deadline.diff(jour, "minutes").minutes));
    if (debutMinutes > finMinutes) continue;

    const resultat = contexte.routeur.rangeRoute(
      new RangeQuery.Builder()
        .from(destination.station.id)
        .to(origine.station.id)
        .departureTime(debutMinutes)
        .lastDepartureTime(finMinutes)
        .maxTransfers(4)
        .transportModes(modesTrain)
        .build(),
    );

    for (const route of resultat.getRoutes().filter(estUnTrajetTer)) {
      const arrivee = dateHeure(jour, route.arrivalTime());
      if (arrivee > deadline || arrivee <= departApres) continue;
      const signature = route.legs
        .map(
          (leg) =>
            `${leg.from.sourceStopId ?? leg.from.id}>${leg.to.sourceStopId ?? leg.to.id}:${"departureTime" in leg ? leg.departureTime : "walk"}`,
        )
        .join("|");
      candidats.set(signature, { route, contexte, arrivee });
    }
  }

  return [...candidats.values()];
}

export async function genererTrajetAvecHorairesReels(
  input: DemandeTrajet,
): Promise<TrajetAllerRetour | null> {
  const departLe = DateTime.fromISO(input.departLe, { setZone: true }).setZone(FUSEAU_HORAIRE);
  const retourAvant = DateTime.fromISO(input.retourAvant, { setZone: true }).setZone(
    FUSEAU_HORAIRE,
  );
  if (!departLe.isValid || !retourAvant.isValid || retourAvant <= departLe) return null;

  const contexteAller = await obtenirContexte(departLe);
  const origine = contexteAller.gareParId.get(input.gareDepartId);
  if (!origine) return null;

  const minutesDisponibles = Math.floor(retourAvant.diff(departLe, "minutes").minutes);
  const rayonMaxKm = Math.min(350, minutesDisponibles * 1.1);
  const destinations = melanger(
    contexteAller.gares.filter((candidate) => {
      if (candidate.gare.id === origine.gare.id) return false;
      const distance = km(origine.gare, candidate.gare);
      return distance >= MIN_DISTANCE_TRAJET_KM && distance <= rayonMaxKm;
    }),
  ).slice(0, MAX_DESTINATIONS_TENTEES);

  for (const destination of destinations) {
    const resultatAller = contexteAller.routeur.route(
      new Query.Builder()
        .from(origine.station.id)
        .to(destination.station.id)
        .departureTime(departLe.diff(contexteAller.jourDebut, "minutes").minutes)
        .maxTransfers(4)
        .maxInitialWaitingTime(180)
        .maxDuration(minutesDisponibles)
        .transportModes(modesTrain)
        .build(),
    );
    const routeAller = resultatAller.bestRoute();
    if (!routeAller || !estUnTrajetTer(routeAller)) continue;

    const departAller = dateHeure(contexteAller.jourDebut, routeAller.departureTime());
    const arriveeAller = dateHeure(contexteAller.jourDebut, routeAller.arrivalTime());
    if (arriveeAller.plus({ minutes: 10 }) >= retourAvant) continue;

    const retours = await chercherRetours(
      destination,
      origine,
      arriveeAller.plus({ minutes: 10 }),
      retourAvant,
    );
    if (!retours.length) continue;
    const meilleurRetour = retours.reduce((meilleur, candidat) =>
      candidat.arrivee > meilleur.arrivee ? candidat : meilleur,
    );

    const etapesAller = construireEtapes(routeAller, contexteAller, false);
    const etapesRetour = construireEtapes(meilleurRetour.route, meilleurRetour.contexte, true);
    const etapes = [...etapesAller, ...etapesRetour.slice(1)];
    const distanceAller = routeAller.legs.reduce(
      (total, leg) =>
        "departureTime" in leg
          ? total + km(garePourArret(leg.from, contexteAller), garePourArret(leg.to, contexteAller))
          : total,
      0,
    );
    const distanceRetour = meilleurRetour.route.legs.reduce(
      (total, leg) =>
        "departureTime" in leg
          ? total +
            km(
              garePourArret(leg.from, meilleurRetour.contexte),
              garePourArret(leg.to, meilleurRetour.contexte),
            )
          : total,
      0,
    );
    const depts = [...new Set(etapes.map((etape) => etape.gare.dept).filter(Boolean))];

    return {
      etapes,
      etapesAller,
      etapesRetour,
      duree: Math.round(meilleurRetour.arrivee.diff(departAller, "minutes").minutes),
      distance: Math.round(distanceAller + distanceRetour),
      depts,
      retourPrevu: meilleurRetour.arrivee.toJSDate(),
      dateLimiteRetour: retourAvant.toJSDate(),
      possibilitesAvantRetour: retours.length,
    };
  }

  return null;
}
