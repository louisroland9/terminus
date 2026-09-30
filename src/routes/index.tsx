import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { GARES, chercher, duree, tirerAllerRetour, type Etape, type Gare, type TrajetAllerRetour } from "@/lib/trajet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Terminus — un trajet TER au pif depuis ta gare" },
      { name: "description", content: "Choisis une gare, tire un trajet TER aléatoire avec correspondances et redécouvre les lignes régionales de France." },
      { property: "og:title", content: "Terminus — un trajet TER au pif" },
      { property: "og:description", content: "Une gare, un tirage, une aventure régionale. Les petites lignes françaises n'attendent que toi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const MARQUEE = "PETITES LIGNES ★ GRANDES AVENTURES ★ TCHOU TCHOU ★ ZÉRO PLAN ★ 100% RÉGIONAL ★ ";

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
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    demain.setHours(20, 0, 0, 0);
    return { jour: valeurDate(demain), heure: valeurHeure(demain) };
  });
  const [erreurRetour, setErreurRetour] = useState("");
  const res = useMemo(() => chercher(q), [q]);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const choisir = (g: Gare) => { setGare(g); setQ(g.nom); setOpen(false); };

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
    if (!gare) choisir(g);
    setErreurRetour("");
    setRoule(true); setTrajet(null);
    let i = 0;
    timer.current = window.setInterval(() => {
      setFlash(GARES[Math.floor(Math.random() * GARES.length)]!.nom);
      if (++i > 18) {
        clearInterval(timer.current!);
        const proposition = tirerAllerRetour(g.id, departLe, retourAvant);
        setTrajet(proposition);
        if (!proposition) {
          setErreurRetour("Aucun aller-retour trouvé avant cette échéance. Essaie une heure ou une date plus tardive.");
        }
        setN((x) => x + 1);
        setRoule(false);
      }
    }, 70);
  };

  const gareDepart = trajet?.etapesAller[0]?.gare;

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* bandeau défilant */}
      <div className="border-b-[3px] bg-secondary py-2 text-secondary-foreground">
        <div className="flex w-max animate-marquee font-display text-sm tracking-wider">
          <span>{MARQUEE.repeat(4)}</span><span>{MARQUEE.repeat(4)}</span>
        </div>
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-6">
        <div className="brut -rotate-2 rounded-xl bg-card px-4 py-2 font-display text-lg">
          TERMINUS
        </div>
        <div className="hidden rotate-3 rounded-full brut bg-pop px-4 py-1.5 font-mono text-xs font-bold sm:block">
          {GARES.length.toLocaleString("fr-FR")} gares dans le chapeau
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24">
        <section className="relative pt-12 text-center">
          <div className="absolute left-2 top-6 hidden size-28 animate-spin-slow place-items-center rounded-full brut bg-accent font-display text-[11px] leading-tight md:grid">
            <span className="-rotate-12">AU<br />PIF<br />TOTAL</span>
          </div>
          <div className="absolute right-4 top-16 hidden animate-wobble text-7xl md:block" aria-hidden>🎲</div>
          <h1 className="font-display text-[clamp(2.6rem,9vw,7.5rem)] uppercase leading-[0.9] tracking-tight">
            Tu montes,
            <br />
            <span className="inline-block -rotate-2 rounded-2xl brut-lg bg-primary px-4 text-primary-foreground">on verra</span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-lg font-medium">
            Tape ta gare, appuie sur le gros bouton, et laisse le hasard t'embarquer de TER en TER à travers la France des petites lignes. 🐄🚂🥖
          </p>

          {/* recherche */}
          <div className="relative mx-auto mt-10 max-w-2xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl">📍</span>
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setGare(null); setOpen(true); setHl(0); }}
                  onFocus={() => setOpen(true)}
                  onBlur={() => setTimeout(() => setOpen(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") { e.preventDefault(); setHl((h) => Math.min(h + 1, res.length - 1)); }
                    if (e.key === "ArrowUp") { e.preventDefault(); setHl((h) => Math.max(h - 1, 0)); }
                    if (e.key === "Enter") { if (open && res[hl]) choisir(res[hl]); else tirer(); }
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
                          <span className="font-mono text-xs uppercase text-muted-foreground">{g.dept}</span>
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
                  onChange={(event) => { setRetour((value) => ({ ...value, jour: event.target.value })); setErreurRetour(""); }}
                  className="mt-1 w-full rounded-xl brut bg-card px-3 py-3 text-sm font-bold outline-none"
                />
              </label>
              <label className="font-mono text-xs font-bold uppercase">
                Avant
                <input
                  type="time"
                  value={retour.heure}
                  min={retour.jour === valeurDate(new Date()) ? valeurHeure(new Date()) : undefined}
                  onChange={(event) => { setRetour((value) => ({ ...value, heure: event.target.value })); setErreurRetour(""); }}
                  className="mt-1 w-full rounded-xl brut bg-card px-3 py-3 text-sm font-bold outline-none"
                />
              </label>
            </div>
            {erreurRetour && <p role="alert" className="mx-auto mt-4 max-w-md text-sm font-bold text-destructive">{erreurRetour}</p>}
            <p className="mt-2 text-center font-mono text-xs text-muted-foreground">Départ estimé dans 5 min · horaires fictifs</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["Morlaix", "Briançon", "Mende", "Carhaix", "Saint-Flour"].map((s) => (
                <button key={s} onClick={() => { const g = chercher(s, 1)[0]; if (g) choisir(g); }}
                  className="press rounded-full border-[3px] bg-card px-3 py-1 text-sm font-bold odd:rotate-2 even:-rotate-2">
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
              <p className="font-mono text-xs uppercase tracking-widest">Le chapeau magique cherche…</p>
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

          {trajet && gareDepart && !roule && (
            <div key={n} className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
              <div className="flex min-w-0 flex-col gap-6">
                <article className="animate-pop-in rounded-3xl brut-lg bg-card p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-foreground px-3 py-1 font-mono text-xs font-bold uppercase text-background">
                      Aller · billet n°{String(n).padStart(3, "0")}
                    </span>
                    <span className="-rotate-3 rounded-lg brut bg-pop px-3 py-1 font-display text-sm">
                      {trajet.etapesAller.length - 1} TER d'affilée
                    </span>
                  </div>
                  <ListeEtapes etapes={trajet.etapesAller} />
                </article>

                <article className="animate-pop-in rounded-3xl brut-lg bg-primary p-6 text-primary-foreground sm:p-8" style={{ animationDelay: "150ms" }}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-black/10 px-3 py-1 font-mono text-xs font-bold uppercase">
                      Retour · {trajet.etapesRetour.length - 1} TER
                    </span>
                    <span className="font-mono text-xs font-bold uppercase tracking-widest">
                      Au plus près de la deadline
                    </span>
                  </div>
                  <p className="mt-5 font-display text-2xl leading-tight">Retour à {gareDepart.nom}</p>
                  <p className="mt-2 font-mono text-xs">
                    Deadline : {trajet.dateLimiteRetour.toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="mt-3 rounded-lg bg-black/10 px-3 py-2 text-sm font-bold">
                    {trajet.possibilitesAvantRetour} trajet{trajet.possibilitesAvantRetour === 1 ? "" : "s"} simulé{trajet.possibilitesAvantRetour === 1 ? "" : "s"} arrive{trajet.possibilitesAvantRetour === 1 ? "" : "nt"} au plus tard à la deadline, dont celui-ci.
                  </p>
                  <div className="mt-6 border-t border-current/30 pt-6">
                    <ListeEtapes etapes={trajet.etapesRetour} retour />
                  </div>
                </article>
              </div>

              <aside className="flex flex-col gap-5">
                <div className="animate-pop-in -rotate-1 grid grid-cols-2 gap-3 rounded-3xl brut bg-card p-5" style={{ animationDelay: "250ms" }}>
                  <Stat label="Durée aller-retour" value={duree(trajet.duree)} />
                  <Stat label="Distance" value={`${trajet.distance} km`} />
                  <Stat label="Départements" value={String(trajet.depts.length)} />
                  <Stat label="CO₂ vs voiture" value="÷ 30 🌱" />
                </div>
                <button onClick={tirer} className="press rounded-2xl brut bg-accent py-4 font-display uppercase">
                  Relancer 🔄
                </button>
                <a
                  href="https://www.sncf-connect.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="press rounded-2xl brut bg-secondary py-4 text-center font-bold text-secondary-foreground"
                >
                  Vérifier les vrais horaires ↗
                </a>
              </aside>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t-[3px] bg-card px-5 py-6 text-center font-mono text-xs">
        Itinéraires imaginés au hasard sur de vraies gares — horaires fictifs, à confirmer avant de partir. Vive les petites lignes ! 🚂
      </footer>
    </div>
  );
}

function ListeEtapes({ etapes, retour = false }: { etapes: Etape[]; retour?: boolean }) {
  return (
    <ol className="space-y-0">
      {etapes.map((etape, index) => {
        const premiere = index === 0;
        const derniere = index === etapes.length - 1;
        const teinteSecondaire = retour ? "text-primary-foreground/70" : "text-muted-foreground";

        return (
          <li key={`${etape.gare.id}-${index}`} className="relative flex gap-4 pb-6 last:pb-0" style={{ animationDelay: `${index * 120}ms` }}>
            {!derniere && <span className="absolute left-[15px] top-8 bottom-0 w-[4px] bg-[repeating-linear-gradient(var(--foreground)_0_8px,transparent_8px_14px)]" />}
            <span className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-[3px] text-sm ${premiere ? "bg-pop" : derniere ? "bg-primary" : "bg-accent"}`}>
              {premiere ? (retour ? "↩" : "🏁") : derniere ? (retour ? "🏁" : "🎯") : "🔁"}
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xl font-bold leading-tight">{etape.gare.nom}</p>
                <p className="font-mono text-sm font-bold">
                  {etape.arrivee && <span>arr. {etape.arrivee}</span>}
                  {etape.arrivee && etape.depart && " · "}
                  {etape.depart && <span className={retour ? "text-primary-foreground" : "text-primary"}>dép. {etape.depart}</span>}
                </p>
              </div>
              <p className={`text-sm ${teinteSecondaire}`}>{etape.gare.dept}</p>
              {etape.attente && (
                <p className="mt-1 inline-block rounded bg-black/10 px-2 font-mono text-xs font-bold">
                  ☕ {etape.attente} min {etape.retour ? "de pause avant le retour" : "pour un café en gare"}
                </p>
              )}
              {etape.train && (
                <p className="mt-2 inline-block rounded-lg border-2 border-dashed px-2 py-0.5 font-mono text-xs font-bold">
                  🚃 {etape.train} · {etape.arrets} arrêt{etape.arrets! > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-lg">{value}</p>
    </div>
  );
}
