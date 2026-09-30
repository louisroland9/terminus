import data from "@/data/gares.json";

export type Gare = { id: number; nom: string; dept: string; lat: number; lon: number };
export const GARES: Gare[] = (data.s as [string, string, number, number][]).map(
  ([nom, dept, lat, lon], id) => ({ id, nom, dept, lat, lon }),
);
const LIGNES = data.l as number[][];

const G = (i: number): Gare => GARES[i]!;
const voisinsLigne: number[][] = GARES.map(() => []);
LIGNES.forEach((l) =>
  l.forEach((g, i) => {
    if (i > 0) voisinsLigne[g]!.push(l[i - 1]!);
    if (i < l.length - 1) voisinsLigne[g]!.push(l[i + 1]!);
  }),
);

export function km(a: Gare, b: Gare) {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function voisins(g: number): number[] {
  const set = new Set(voisinsLigne[g]!);
  const proches = GARES.filter((x) => x.id !== g)
    .map((x) => [x.id, km(G(g), x)] as const)
    .filter(([, d]) => d < 45)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 4);
  proches.forEach(([id]) => set.add(id));
  return [...set];
}

export type Etape = { gare: Gare; arrivee?: string; depart?: string; train?: string; attente?: number | undefined; arrets?: number; retour?: boolean };
export type Trajet = {
  etapes: Etape[];
  duree: number;
  distance: number;
  depts: string[];
};
export type TrajetAllerRetour = Trajet & {
  etapesAller: Etape[];
  etapesRetour: Etape[];
  retourPrevu: Date;
  dateLimiteRetour: Date;
  possibilitesAvantRetour: number;
};

const fmt = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const duree = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

export function tirerTrajet(depart: number, heureDepart?: number): Trajet {
  const nbTrains = rnd(1, 4);
  const vus = new Set([depart]);
  let cur = depart;
  let t = heureDepart ?? rnd(6 * 60, 14 * 60);
  const t0 = t;
  let distance = 0;
  const etapes: Etape[] = [{ gare: G(depart) }];
  for (let k = 0; k < nbTrains; k++) {
    const hops = rnd(2, 7);
    let d = 0, arrets = 0, prev = cur;
    for (let h = 0; h < hops; h++) {
      const opts = voisins(cur).filter((v) => !vus.has(v));
      if (!opts.length) break;
      // préférer s'éloigner du point de départ
      opts.sort((a, b) => km(G(depart), G(b)) - km(G(depart), G(a)));
      const next = opts[Math.min(opts.length - 1, rnd(0, 1))]!;
      d += km(G(cur), G(next));
      vus.add(next); cur = next; arrets++;
    }
    if (cur === prev) break;
    const trajetMin = Math.round((d / 75) * 60 + arrets * 2) + 5;
    const last = etapes[etapes.length - 1]!;
    last.depart = fmt(t);
    last.train = `TER ${rnd(800, 899)}${rnd(10, 99)}`;
    last.arrets = arrets;
    t += trajetMin; distance += d;
    const attente = k < nbTrains - 1 ? rnd(6, 35) : undefined;
    etapes.push({ gare: G(cur), arrivee: fmt(t), attente });
    if (attente) t += attente;
  }
  const fin = etapes[etapes.length - 1]!;
  if (fin.attente) t -= fin.attente;
  etapes[etapes.length - 1]!.attente = undefined;
  const depts = [...new Set(etapes.map((e) => e.gare.dept))];
  return { etapes, duree: t - t0, distance: Math.round(distance), depts };
}

export function tirerAllerRetour(depart: number, departLe: Date, retourAvant: Date): TrajetAllerRetour | null {
  const minutesDisponibles = Math.floor((retourAvant.getTime() - departLe.getTime()) / 60_000);
  if (!Number.isFinite(minutesDisponibles) || minutesDisponibles <= 0) return null;

  const heureDepart = departLe.getHours() * 60 + departLe.getMinutes();
  const propositions = new Map<string, Omit<TrajetAllerRetour, "possibilitesAvantRetour">>();
  for (let essai = 0; essai < 60; essai++) {
    const aller = tirerTrajet(depart, heureDepart);
    if (aller.etapes.length < 2) continue;

    const etapes = aller.etapes.map((etape) => ({ ...etape }));
    let heureRetour = heureDepart + aller.duree + rnd(15, 35);
    const terminus = etapes[etapes.length - 1]!;
    terminus.attente = heureRetour - (heureDepart + aller.duree);
    terminus.retour = true;

    for (let i = aller.etapes.length - 2; i >= 0; i--) {
      const etapeAller = aller.etapes[i]!;
      const prochaineEtapeAller = aller.etapes[i + 1]!;
      const departAller = minutesDepuisMinuit(etapeAller.depart!);
      const arriveeAller = minutesDepuisMinuit(prochaineEtapeAller.arrivee!);
      const dureeSegment = (arriveeAller - departAller + 1440) % 1440;
      const etapeRetour = etapes[etapes.length - 1]!;

      etapeRetour.depart = fmt(heureRetour);
      etapeRetour.train = `TER ${rnd(800, 899)}${rnd(10, 99)}`;
      etapeRetour.arrets = etapeAller.arrets;
      heureRetour += dureeSegment;

      const attente = i > 0 ? rnd(6, 35) : undefined;
      etapes.push({ gare: etapeAller.gare, arrivee: fmt(heureRetour), attente });
      if (attente) heureRetour += attente;
    }

    const dureeTotale = heureRetour - heureDepart;
    if (dureeTotale > minutesDisponibles) continue;

    const depts = [...new Set(etapes.map((etape) => etape.gare.dept))];
    const indexTerminus = etapes.findIndex((etape) => etape.retour);
    const terminusRetour = etapes[indexTerminus]!;
    const terminusAller: Etape = { gare: terminusRetour.gare };
    if (terminusRetour.arrivee !== undefined) terminusAller.arrivee = terminusRetour.arrivee;
    const etapesAller = [
      ...etapes.slice(0, indexTerminus).map((etape) => ({ ...etape })),
      terminusAller,
    ];
    const etapesRetour = etapes.slice(indexTerminus).map((etape) => ({ ...etape }));
    const proposition: Omit<TrajetAllerRetour, "possibilitesAvantRetour"> = {
      etapes,
      etapesAller,
      etapesRetour,
      duree: dureeTotale,
      distance: aller.distance * 2,
      depts,
      retourPrevu: new Date(departLe.getTime() + dureeTotale * 60_000),
      dateLimiteRetour: retourAvant,
    };
    const signature = etapes
      .map((etape) => `${etape.gare.id}:${etape.depart ?? ""}:${etape.arrivee ?? ""}`)
      .join("|");
    propositions.set(signature, proposition);
  }

  if (!propositions.size) return null;

  const options = [...propositions.values()];
  const meilleurRetour = options.reduce((meilleur, option) =>
    option.retourPrevu!.getTime() > meilleur.retourPrevu!.getTime() ? option : meilleur,
  );

  return { ...meilleurRetour, possibilitesAvantRetour: options.length };
}

function minutesDepuisMinuit(heure: string): number {
  const [heures, minutes] = heure.split(":").map(Number);
  return heures! * 60 + minutes!;
}

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[-']/g, " ");
const INDEX = GARES.map((g) => norm(g.nom));
export function chercher(q: string, n = 7): Gare[] {
  const nq = norm(q.trim());
  if (!nq) return [];
  const debut: Gare[] = [], dedans: Gare[] = [];
  INDEX.forEach((s, i) => {
    if (s.startsWith(nq)) debut.push(G(i));
    else if (s.includes(nq)) dedans.push(G(i));
  });
  return [...debut, ...dedans].slice(0, n);
}
