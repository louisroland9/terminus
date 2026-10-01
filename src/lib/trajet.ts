import data from "@/data/gares.json";

export type Gare = { id: number; nom: string; dept: string; lat: number; lon: number };
export const GARES: Gare[] = (data.s as [string, string, number, number][]).map(
  ([nom, dept, lat, lon], id) => ({ id, nom, dept, lat, lon }),
);

const G = (id: number): Gare => GARES[id]!;

export function km(a: Gare, b: Gare) {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type Etape = {
  gare: Gare;
  arrivee?: string;
  depart?: string;
  train?: string;
  attente?: number;
  marcheVers?: string;
  marcheMinutes?: number;
  retour?: boolean;
};
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

export const duree = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;

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
