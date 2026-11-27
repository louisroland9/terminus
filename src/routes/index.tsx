import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ResultatBillet } from "@/components/billet/resultat-billet";
import { Habillage } from "@/components/habillage";
import { suivreEvenement } from "@/lib/analytics";
import { proposerTrajetAvecHorairesReels } from "@/lib/horaires";
import { GARES, chercher, type Gare, type TrajetAllerRetour } from "@/lib/trajet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Terminus — un trajet TER au pif depuis ta gare" },
      {
        name: "description",
        content:
          "Choisis une gare, tire un trajet TER aléatoire avec correspondances et redécouvre les lignes régionales de France.",
      },
      { property: "og:title", content: "Terminus — un trajet TER au pif" },
      {
        property: "og:description",
        content:
          "Une gare, un tirage, une aventure régionale. Les petites lignes françaises n'attendent que toi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const valeurDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const valeurHeure = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

function Index() {
  const [q, setQ] = useState("");
  const [gare, setGare] = useState<Gare | null>(null);
  const [open, setOpen] = useState(false);
  const [hl, setHl] = useState(0);
  const [trajet, setTrajet] = useState<TrajetAllerRetour | null>(null);
  const [roule, setRoule] = useState(false);
  const [flash, setFlash] = useState("");
  const [n, setN] = useState(0);
  const [retour, setRetour] = useState(() => {
    const deadline = new Date(Date.now() + 4 * 60 * 60 * 1000);
    if (deadline.getMinutes() || deadline.getSeconds() || deadline.getMilliseconds()) {
      deadline.setHours(deadline.getHours() + 1);
    }
    deadline.setMinutes(0, 0, 0);
    return { jour: valeurDate(deadline), heure: valeurHeure(deadline) };
  });
  const [erreurRetour, setErreurRetour] = useState("");
  const res = useMemo(() => chercher(q), [q]);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const choisir = (g: Gare) => {
    setGare(g);
    setQ(g.nom);
    setOpen(false);
  };

  const tirer = () => {
    const g = gare ?? res[0];
    if (!g) return;
    const departLe = new Date();
    departLe.setSeconds(0, 0);
    departLe.setMinutes(departLe.getMinutes() + 5);
    const retourAvant = new Date(`${retour.jour}T${retour.heure}`);
    if (Number.isNaN(retourAvant.getTime()) || retourAvant <= departLe) {
      setErreurRetour("Choisis une échéance située après le départ estimé.");
      return;
    }
    suivreEvenement("Random Journey Launched");
    if (!gare) choisir(g);
    setErreurRetour("");
    setRoule(true);
    setTrajet(null);
    let i = 0;
    timer.current = window.setInterval(() => {
      setFlash(GARES[Math.floor(Math.random() * GARES.length)]!.nom);
      if (++i > 18) {
        clearInterval(timer.current!);
        setFlash("Recherche des horaires SNCF réels…");
        void proposerTrajetAvecHorairesReels({
          data: {
            gareDepartId: g.id,
            departLe: departLe.toISOString(),
            retourAvant: retourAvant.toISOString(),
          },
        })
          .then((proposition) => {
            setTrajet(proposition);
            if (!proposition) {
              setErreurRetour("Aucun aller-retour SNCF trouvé pour cette gare avant la deadline.");
            }
            setN((x) => x + 1);
          })
          .catch((error: unknown) => {
            console.error(error);
            setErreurRetour("Impossible de charger les horaires SNCF. Réessaie dans un instant.");
          })
          .finally(() => setRoule(false));
      }
    }, 70);
  };

  return (
    <Habillage>
      <main className="mx-auto max-w-6xl px-5 pb-24">
        <section className="relative pt-12 text-center">
          <div className="absolute left-2 top-6 hidden size-28 animate-spin-slow place-items-center rounded-full brut bg-accent font-display text-[11px] leading-tight md:grid">
            <span className="-rotate-12">
              AU
              <br />
              PIF
              <br />
              TOTAL
            </span>
          </div>
          <div
            className="absolute right-4 top-16 hidden animate-wobble text-7xl md:block"
            aria-hidden
          >
            🎲
          </div>
          <h1
            className="font-display text-[clamp(2.6rem,9vw,7.5rem)] uppercase leading-[0.9] tracking-tight"
            style={{ wordSpacing: "-0.3em" }}
          >
            Tu montes,
            <br />
            <span className="inline-block -rotate-2 rounded-2xl brut-lg bg-primary px-4 text-primary-foreground">
              on verra
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-lg font-medium">
            Tape ta gare, appuie sur le gros bouton, et laisse le hasard t'embarquer de TER en TER à
            travers la France des petites lignes. 🐄🚂🥖
          </p>

          {/* recherche */}
          <div className="relative mx-auto mt-10 max-w-2xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl">
                  📍
                </span>
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setGare(null);
                    setOpen(true);
                    setHl(0);
                  }}
                  onFocus={() => setOpen(true)}
                  onBlur={() => setTimeout(() => setOpen(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHl((h) => Math.min(h + 1, res.length - 1));
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHl((h) => Math.max(h - 1, 0));
                    }
                    if (e.key === "Enter") {
                      if (open && res[hl]) choisir(res[hl]);
                      else tirer();
                    }
                  }}
                  placeholder="Ta gare de départ… (ex : Morlaix)"
                  aria-label="Gare de départ"
                  className="w-full rounded-2xl brut bg-card py-5 pl-14 pr-4 text-xl font-bold outline-none placeholder:font-medium placeholder:text-muted-foreground focus:bg-card"
                />
                {open && res.length > 0 && (
                  <ul className="absolute z-30 mt-3 w-full overflow-hidden rounded-2xl brut bg-card text-left">
                    {res.map((g, i) => (
                      <li key={g.id}>
                        <button
                          onMouseDown={() => choisir(g)}
                          onMouseEnter={() => setHl(i)}
                          className={`flex w-full items-center justify-between px-5 py-3 text-left font-bold ${i === hl ? "bg-background" : ""}`}
                        >
                          <span>🚉 {g.nom}</span>
                          <span className="font-mono text-xs uppercase text-muted-foreground">
                            {g.dept}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={tirer}
                disabled={roule || (!gare && !res.length)}
                className={`press rounded-2xl brut bg-primary px-7 py-5 font-display text-lg uppercase text-primary-foreground disabled:opacity-50 ${roule ? "animate-shake" : ""}`}
              >
                {roule ? "Ça tourne…" : "Tirer ! 🎰"}
              </button>
            </div>
            <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-3 text-left">
              <label className="font-mono text-xs font-bold uppercase">
                Être rentré le
                <input
                  type="date"
                  value={retour.jour}
                  min={valeurDate(new Date())}
                  onChange={(event) => {
                    setRetour((value) => ({ ...value, jour: event.target.value }));
                    setErreurRetour("");
                  }}
                  className="mt-1 w-full rounded-xl brut bg-card px-3 py-3 text-sm font-bold outline-none"
                />
              </label>
              <label className="font-mono text-xs font-bold uppercase">
                Avant
                <input
                  type="time"
                  value={retour.heure}
                  min={retour.jour === valeurDate(new Date()) ? valeurHeure(new Date()) : undefined}
                  onChange={(event) => {
                    setRetour((value) => ({ ...value, heure: event.target.value }));
                    setErreurRetour("");
                  }}
                  className="mt-1 w-full rounded-xl brut bg-card px-3 py-3 text-sm font-bold outline-none"
                />
              </label>
            </div>
            {erreurRetour && (
              <p role="alert" className="mx-auto mt-4 max-w-md text-sm font-bold text-destructive">
                {erreurRetour}
              </p>
            )}
            <p className="mt-2 text-center font-mono text-xs text-muted-foreground">
              Prochain TER disponible · horaires théoriques SNCF, retards non inclus
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["Morlaix", "Briançon", "Mende", "Carhaix", "Saint-Flour"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    const g = chercher(s, 1)[0];
                    if (g) choisir(g);
                  }}
                  className="press rounded-full border-[3px] bg-card px-3 py-1 text-sm font-bold odd:rotate-2 even:-rotate-2"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* résultat */}
        <section className="mt-16 min-h-[200px]">
          {roule && (
            <div className="mx-auto max-w-xl rounded-3xl brut-lg bg-secondary p-8 text-center text-secondary-foreground">
              <p className="font-mono text-xs uppercase tracking-widest">
                Le chapeau magique cherche…
              </p>
              <p className="mt-3 truncate font-display text-3xl">{flash}</p>
            </div>
          )}

          {!roule && !trajet && (
            <div className="relative mx-auto h-24 max-w-3xl overflow-hidden">
              <div className="absolute bottom-2 left-0 right-0 border-b-[3px] border-dashed" />
              <div className="absolute bottom-4 animate-ride whitespace-nowrap text-5xl">
                <span className="inline-block animate-chug">🚂🚃🚃🚃</span>
              </div>
            </div>
          )}

          {trajet && !roule && (
            <ResultatBillet key={n} trajet={trajet} numero={n} onRelancer={tirer} />
          )}
        </section>
      </main>
    </Habillage>
  );
}
