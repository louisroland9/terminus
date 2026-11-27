type Plausible = ((evenement: string) => void) & { q?: unknown[] };

declare global {
  interface ImportMetaEnv {
    readonly VITE_PLAUSIBLE_DOMAIN?: string;
  }
  interface Window {
    plausible?: Plausible;
  }
}

/** Charge Plausible une seule fois ; sans effet côté serveur ou sans domaine configuré. */
export function initAnalytics() {
  const domaine = import.meta.env.VITE_PLAUSIBLE_DOMAIN?.trim();
  if (!domaine || typeof document === "undefined") return;
  if (document.querySelector("script[data-terminus-analytics]")) return;

  // File d'attente rejouée par le script Plausible une fois chargé.
  const attente: Plausible = (evenement) => attente.q?.push([evenement]);
  attente.q = [];
  window.plausible = window.plausible ?? attente;

  const script = document.createElement("script");
  script.defer = true;
  script.setAttribute("data-domain", domaine);
  script.setAttribute("data-terminus-analytics", "true");
  script.src = "https://plausible.io/js/script.js";
  document.head.append(script);
}

export function suivreEvenement(evenement: string) {
  // L'effet d'une page peut s'exécuter avant celui de la racine.
  initAnalytics();
  if (typeof window !== "undefined") window.plausible?.(evenement);
}
