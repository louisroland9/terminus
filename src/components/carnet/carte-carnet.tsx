import { departementsDebloques, TOTAL_DEPARTEMENTS, type Carnet } from "@/lib/carnet";
import { GARES, type Gare } from "@/lib/trajet";

// Projection équirectangulaire corrigée à la latitude moyenne de la France.
const ECHELLE_LON = Math.cos((46.5 * Math.PI) / 180);
const LON_MIN = Math.min(...GARES.map((gare) => gare.lon));
const LON_MAX = Math.max(...GARES.map((gare) => gare.lon));
const LAT_MIN = Math.min(...GARES.map((gare) => gare.lat));
const LAT_MAX = Math.max(...GARES.map((gare) => gare.lat));
const MARGE = 0.2;
const VUE = [
  -MARGE,
  -MARGE,
  (LON_MAX - LON_MIN) * ECHELLE_LON + 2 * MARGE,
  LAT_MAX - LAT_MIN + 2 * MARGE,
].join(" ");

// Un seul tracé par couleur : chaque gare est un segment nul à bouts ronds.
const points = (gares: Gare[]) =>
  gares
    .map(
      (gare) =>
        `M${((gare.lon - LON_MIN) * ECHELLE_LON).toFixed(2)} ${(LAT_MAX - gare.lat).toFixed(2)}h0`,
    )
    .join("");
const FOND = points(GARES);

export function CarteCarnet({ carnet }: { carnet: Carnet }) {
  const visitees = points(carnet.gares.flatMap((id) => GARES[id] ?? []));
  const depts = departementsDebloques(carnet);

  return (
    <section
      aria-labelledby="titre-carnet"
      className="mx-auto mt-10 max-w-xl rounded-3xl brut bg-card p-6 text-center"
    >
      <h2 id="titre-carnet" className="font-display text-lg leading-tight">
        Ton carnet : {depts} département{depts > 1 ? "s" : ""} / {TOTAL_DEPARTEMENTS}
      </h2>
      <p className="mt-2 font-mono text-xs font-bold">
        {carnet.gares.length} gare{carnet.gares.length > 1 ? "s" : ""} au compteur ·{" "}
        {carnet.billets} billet{carnet.billets > 1 ? "s" : ""} tiré{carnet.billets > 1 ? "s" : ""}
      </p>
      <svg
        viewBox={VUE}
        role="img"
        aria-label="Carte de France des gares de ton carnet"
        className="mt-4 h-auto w-full"
        fill="none"
        strokeLinecap="round"
      >
        <path d={FOND} stroke="var(--muted)" strokeWidth="0.09" />
        <path d={visitees} stroke="var(--primary)" strokeWidth="0.18" />
      </svg>
    </section>
  );
}
