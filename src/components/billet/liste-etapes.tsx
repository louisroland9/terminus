import type { Etape } from "@/lib/trajet";

export function ListeEtapes({ etapes, retour = false }: { etapes: Etape[]; retour?: boolean }) {
  return (
    <ol className="space-y-0">
      {etapes.map((etape, index) => {
        const premiere = index === 0;
        const derniere = index === etapes.length - 1;
        const teinteSecondaire = retour ? "text-primary-foreground/70" : "text-muted-foreground";

        return (
          <li
            key={`${etape.gare.id}-${index}`}
            className="relative flex gap-4 pb-6 last:pb-0"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            {!derniere && (
              <span className="absolute left-[15px] top-8 bottom-0 w-[4px] bg-[repeating-linear-gradient(var(--foreground)_0_8px,transparent_8px_14px)]" />
            )}
            <span
              className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-[3px] text-sm ${premiere ? "bg-pop" : derniere ? "bg-primary" : "bg-accent"}`}
            >
              {premiere ? (retour ? "↩" : "🏁") : derniere ? (retour ? "🏁" : "🎯") : "🔁"}
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xl font-bold leading-tight">{etape.gare.nom}</p>
                <p className="font-mono text-sm font-bold">
                  {etape.arrivee && <span>arr. {etape.arrivee}</span>}
                  {etape.arrivee && etape.depart && " · "}
                  {etape.depart && (
                    <span className={retour ? "text-primary-foreground" : "text-primary"}>
                      dép. {etape.depart}
                    </span>
                  )}
                </p>
              </div>
              <p className={`text-sm ${teinteSecondaire}`}>{etape.gare.dept}</p>
              {etape.attente && (
                <p className="mt-1 inline-block rounded bg-black/10 px-2 font-mono text-xs font-bold">
                  ☕ {etape.attente} min de correspondance
                </p>
              )}
              {etape.marcheVers && etape.marcheMinutes !== undefined && (
                <p className="mt-1 inline-block rounded bg-black/10 px-2 font-mono text-xs font-bold">
                  🚶 {etape.marcheMinutes} min à pied jusqu'à {etape.marcheVers}
                </p>
              )}
              {etape.train && (
                <p className="mt-2 inline-block rounded-lg border-2 border-dashed px-2 py-0.5 font-mono text-xs font-bold">
                  🚃 {etape.train}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
