import type { ReactNode } from "react";
import { BoutonPartager } from "@/components/billet/bouton-partager";
import { ListeEtapes } from "@/components/billet/liste-etapes";
import { Stat } from "@/components/billet/stat";
import { suivreEvenement } from "@/lib/analytics";
import type { Billet } from "@/lib/billet";
import { numeroBillet } from "@/lib/recap";
import { co2EviteKg, duree, type TrajetAllerRetour } from "@/lib/trajet";

type Props = {
  trajet: TrajetAllerRetour;
  billet: Billet;
  numero?: number;
  departementsCarnet?: number | undefined;
  action: ReactNode;
};

export function ResultatBillet({ trajet, billet, numero, departementsCarnet, action }: Props) {
  const gareDepart = trajet.etapesAller[0]?.gare;
  const deadlineFormatee = trajet.dateLimiteRetour.toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const autresTrajetsAvantDeadline = Math.max(0, trajet.possibilitesAvantRetour - 1);
  if (!gareDepart) return null;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
      <div className="flex min-w-0 flex-col gap-6">
        <article className="animate-pop-in rounded-3xl brut-lg bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-foreground px-3 py-1 font-mono text-xs font-bold uppercase text-background">
              Aller · {numero === undefined ? "billet partagé" : `billet n°${numeroBillet(numero)}`}
            </span>
            <span className="-rotate-3 rounded-lg brut bg-pop px-3 py-1 font-display text-sm">
              {trajet.etapesAller.filter((etape) => etape.train).length} TER d'affilée
            </span>
          </div>
          <ListeEtapes etapes={trajet.etapesAller} />
        </article>

        <article
          className="animate-pop-in rounded-3xl brut-lg bg-primary p-6 text-primary-foreground sm:p-8"
          style={{ animationDelay: "150ms" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-black/10 px-3 py-1 font-mono text-xs font-bold uppercase">
              Retour · {trajet.etapesRetour.filter((etape) => etape.train).length} TER
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-widest">
              Au plus près de la deadline
            </span>
          </div>
          <p className="mt-5 font-display text-2xl leading-tight">Retour à {gareDepart.nom}</p>
          <p className="mt-2 font-mono text-xs">Dernier trajet avant {deadlineFormatee}</p>
          <p className="mt-3 rounded-lg bg-black/10 px-3 py-2 text-sm font-bold">
            {autresTrajetsAvantDeadline} autres trajets arrivent avant {deadlineFormatee}
          </p>
          <div className="mt-6 border-t border-current/30 pt-6">
            <ListeEtapes etapes={trajet.etapesRetour} retour />
          </div>
        </article>
      </div>

      <aside className="flex flex-col gap-5">
        <div
          className="animate-pop-in -rotate-1 grid grid-cols-2 gap-3 rounded-3xl brut bg-card p-5"
          style={{ animationDelay: "250ms" }}
        >
          <Stat label="Durée aller-retour" value={duree(trajet.duree)} />
          <Stat label="Distance" value={`${trajet.distance} km`} />
          <Stat label="Départements" value={String(trajet.depts.length)} />
          <Stat
            label="CO₂ évité vs voiture solo"
            value={`≈ ${co2EviteKg(trajet.distance)} kg 🌱`}
          />
        </div>
        <BoutonPartager
          billet={billet}
          trajet={trajet}
          numero={numero}
          departementsCarnet={departementsCarnet}
        />
        {action}
        <a
          href="https://www.sncf-connect.com/"
          target="_blank"
          rel="noreferrer"
          onClick={() => suivreEvenement("SNCF Connect Click")}
          className="press rounded-2xl brut bg-secondary py-4 text-center font-bold text-secondary-foreground"
        >
          Vérifier sur SNCF Connect ↗
        </a>
      </aside>
    </div>
  );
}
