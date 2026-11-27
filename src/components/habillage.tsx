import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { GARES } from "@/lib/trajet";

const MARQUEE = "PETITES LIGNES ★ GRANDES AVENTURES ★ TCHOU TCHOU ★ ZÉRO PLAN ★ 100% RÉGIONAL ★ ";

export function Habillage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* bandeau défilant */}
      <div className="border-b-[3px] bg-secondary py-2 text-secondary-foreground">
        <div className="flex w-max animate-marquee font-display text-sm tracking-wider">
          <span>{MARQUEE.repeat(4)}</span>
          <span>{MARQUEE.repeat(4)}</span>
        </div>
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-6">
        <Link to="/" className="brut -rotate-2 rounded-xl bg-card px-4 py-2 font-display text-lg">
          TERMINUS
        </Link>
        <div className="hidden rotate-3 rounded-full brut bg-pop px-4 py-1.5 font-mono text-xs font-bold sm:block">
          {GARES.length.toLocaleString("fr-FR")} gares dans le chapeau
        </div>
      </header>

      {children}

      <footer className="border-t-[3px] bg-card px-5 py-6 text-center font-mono text-xs">
        Horaires théoriques :{" "}
        <a
          className="underline"
          href="https://transport.data.gouv.fr/datasets/horaires-sncf"
          target="_blank"
          rel="noreferrer"
        >
          Open Data SNCF (ODbL)
        </a>{" "}
        — retards non inclus. Confirme les horaires sur SNCF Connect avant le départ. 🚂
      </footer>
    </div>
  );
}
