# 02 — Architecture & conventions

## Stack (versions observées)

Bun 1.4 · React 19 · TanStack Start 1.168 / Router 1.170 / Query 5 · Vite 8 · Nitro 3 (`nitro/vite`) · Tailwind 4.2 (`@tailwindcss/vite` 4.3) · TypeScript 5.8 · zod 3 · minotor 11.5 · luxon 4 · ESLint 9 (flat) · Prettier 3.

## Structure réelle (plate — ne pas inventer de dossiers)

```
src/
  routes/__root.tsx      # SEUL layout racine : <html lang="fr">, head/meta, QueryClientProvider, <Outlet />
  routes/index.tsx       # page unique `/` (UI complète)
  lib/trajet.ts          # domaine client PUR : types Gare/Etape/Trajet, km(), chercher(), GARES (data/gares.json)
  lib/horaires.ts        # server function createServerFn(POST) + validateur zod, import dynamique du .server
  lib/horaires.server.ts # cœur serveur : téléchargement + cache GTFS 12 h, minotor parseur/routeur
  lib/error-capture.ts   # capture out-of-band des Error (contourne le swallow h3)
  lib/error-page.ts      # page HTML d'erreur autonome
  lib/utils.ts           # cn() = twMerge(clsx(...))
  server.ts              # entrée serveur Nitro/h3 : normalise les 500 « swallowed »
  start.ts               # middleware d'erreur + csrfMiddleware (réinstallé explicitement)
  styles.css             # Tailwind 4 : @import, @theme, tokens oklch, @utility brut/press, animations
  data/gares.json        # liste compacte des gares { s: [nom, dept, lat, lon][] }
  hooks/use-mobile.tsx   # pattern shadcn
  components/ui/*        # shadcn — NE PAS ÉDITER
```

## Frontière client / serveur

- Tout code utilisant `node:*`, secrets ou accès réseau **doit** vivre dans un fichier **`*.server.ts`**.
- Interdit : `import "server-only"` (règle ESLint `no-restricted-imports`). Utiliser le suffixe `.server.ts` ou `@tanstack/react-start/server-only`.
- La frontière se franchit via une **server function** dans un fichier client :

```ts
// src/lib/xxx.ts  (client-safe)
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({ /* ... */ });

export const actionX = createServerFn({ method: "POST" })
  .validator(schema)
  .handler(async ({ data }) => {
    const { implX } = await import("./xxx.server"); // import dynamique obligatoire
    return implX(data);
  });
```

## Règles TypeScript (tsconfig strict)

- `noUncheckedIndexedAccess` → après `arr[i]` / accès indexé, utiliser `!` ou un guard explicite.
- `exactOptionalPropertyTypes` → pour une prop optionnelle conditionnelle, utiliser le spread : `...(cond && { cle: valeur })`, pas `cle: undefined`.
- `noPropertyAccessFromIndexSignature` → indexer avec `obj["cle"]`.
- `noImplicitReturns` / `noImplicitOverride` / `noFallthroughCasesInSwitch` → respecter strictement.
- Discriminants d'union (legs minotor) : garder avec `"departureTime" in leg`, `"duration" in leg`.
- `verbatimModuleSyntax: false` : `import type` autorisé mais non obligatoire.
- Alias d'import : `@/*` → `./src/*`. Ne pas utiliser de chemins relatifs profonds quand l'alias existe.

## Conventions de nommage & code

- **Domaine métier en français** : `trajet`, `gare`, `horaires`, `chercherRetours`, `genererTrajetAvecHorairesReels`, `construireEtapes`.
- **Noms framework/libs en anglais** : `Route`, `createServerFn`, `useMemo`, `QueryClient`.
- Petites fonctions utilitaires pures dans `lib/`, composants locaux dans le fichier de route.
- UI shadcn : importer depuis `@/components/ui/*`, styliser avec `cn(...)`.
- Pas de `console.log` en production ; erreurs via `console.error` (capturées par `error-capture.ts`).
- Prettier : `printWidth 100`, `semi: true`, **double quotes**, `trailingComma: "all"`. Respecter l'auto-format.

## Routing (TanStack Start, file-based)

- Un fichier `.tsx` par route dans `src/routes/`. **Un seul** layout racine : `__root.tsx`.
- Interdit : `src/pages/`, `app/layout.tsx`, `routes/_app/index.tsx` (conventions Next/Remix).
- Dynamique `$id`, optionnel `{-$param}`, splat `$` (lu via `_splat`). **Ne jamais** éditer `routeTree.gen.ts`.

## Serveur / erreurs / sécurité

- `src/start.ts` **réinstalle** `csrfMiddleware` (filtré sur `handlerType === "serverFn"`) : le garder, sinon les server functions sont exposées au CSRF.
- Les erreurs serveur non‑HTTP doivent produire `renderErrorPage()` — ne pas casser le middleware d'erreur ni `normalizeCatastrophicSsrResponse` de `server.ts`.
- Contraintes runtime : **Node.js compatible**, **répertoire temporaire inscriptible** (`mkdtemp`), cache GTFS **12 h**, 1<sup>er</sup> calcul ~20 s.
- Le cache utilise des **promesses partagées** (`Map<string, { expireA; promesse }>`) : préférer ce pattern, éviter les caches mutex/état global simple.

## UI / Tailwind 4

- Tokens couleurs en **oklch** définis dans `styles.css` (jamais en dur dans les composants).
- Utilitaires custom à réutiliser : `brut`, `brut-lg`, `press`, `animate-marquee|wobble|chug|ride|pop-in|spin-slow|shake`.
- Polices : `font-display` (Rubik Mono One), `font-sans` (Space Grotesk), `font-mono` (JetBrains Mono).

## Git & commandes

- Workflow complet : **`.clinerules/04-git-workflow.md`** (une branche par feature, `main ← develop ← feat/*`, commits `type(scope): …`).
- Règle : **jamais** de commit direct sur `main`/`develop` ; branche de travail créée depuis `develop`.
- Branche active de développement : `develop`. Ne pas réécrire l'historique ; `pull --ff-only`.
- Scripts : `bun run dev | build | build:dev | preview | lint | format`.
- Avant de conclure une tâche : `bun run lint` (et `bun run build` si le changement touche le build/SSR).
- Pas de framework de test configuré : ne pas en installer sans demande explicite.