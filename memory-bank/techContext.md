# Tech context

## Runtime & outillage

- **Bun 1.4.2** (binaire local versionné dans `.tools/bun/bin/bun`, `.tools/` ignoré par Git).
- `bunfig.toml` : `saveTextLockfile = true`, `minimumReleaseAge = 86400` (garde supply‑chain 24 h).
- Gestionnaire de paquets : Bun (lockfile `bun.lock`).

## Framework & build

- **TanStack Start** `@tanstack/react-start` **1.168.61** (SSR + server functions) — monté depuis 1.168.32 pour corriger **CVE‑2026‑102989** (voir Sécurité).
- **TanStack Router** **1.170.42** (`@tanstack/router-plugin` 1.168.23), file-based routing.
- **Vite** 8.1.5, plugins : `tanstackStart({ server: { entry: "server" } })`, `nitro()`, `react()`, `tailwindcss()`, `tsconfigPaths()`.
- **Nitro** 3.0.260603-beta (via `nitro/vite`) — cible de déploiement **Vercel**.
- Override : `rolldown` → 1.2.1.

## Sécurité & dépendances transitoires

- **CVE‑2026‑102989** (GHSA‑qx66‑fv34‑fjm8, *critique*) : XSS réfléchie non authentifiée dans les réponses de server functions.
  - Plages vulnérables : `@tanstack/react-start` `>=1.143.12 <1.168.60`, `@tanstack/start-server-core` `>=1.143.12 <1.169.39`.
  - **Le correctif réel est dans `start-server-core`** (transitif) : monté `1.169.17 → 1.169.40`.
  - Corrigé par la montée de `react-start` en **1.168.61** (branche `fix/tanstack-start-xss`, fusionnée dans `develop`).
  - Ne **pas** utiliser le contournement `DANGEROUSLY_DEPLOY_VULNERABLE_TANSTACK_START_XSS` : l'app expose une server function POST (surface exacte du CVE).
- Dépendance fragile : `luxon` est importé directement par `src/lib/horaires.server.ts` et déclaré dans `package.json` — un `node_modules` désynchronisé (luxon absent) fait échouer le build SSR. `bun install` corrige.

## UI

- **React** 19.2 + **react-dom** 19.2.
- **Tailwind CSS** 4.2.1 + `@tailwindcss/vite` 4.3.3 ; `tw-animate-css`.
- **shadcn/ui** (style *new-york*, base slate, alias `@/components`, `@/lib`, `@/hooks`, icônes lucide).
- Radix UI (accordéon, dialog, select, menu, tooltip, etc.), `class-variance-authority`, `clsx`, `tailwind-merge`.
- Autres : `cmdk`, `sonner`, `vaul`, `recharts`, `embla-carousel-react`, `react-day-picker`, `react-resizable-panels`, `react-hook-form` + `@hookform/resolvers`, `input-otp`.
- Polices Google : Rubik Mono One, Space Grotesk, JetBrains Mono.

## Data & domaine

- **@tanstack/react-query** 5.101.
- **zod** 3.25 — validation des entrées de server functions.
- **minotor** 11.5.0 — parseur GTFS (`GtfsParser`, `standardGtfsProfile`, `StraightLineTransferGenerator`) + routeur (`Router`, `Query`, `RangeQuery`).
- **luxon** 3.7 — dates/heures, fuseau `Europe/Paris`. `date-fns` présent.

## TypeScript & qualité

- TypeScript 5.8 : `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `moduleResolution: Bundler`, alias `@/*`.
- ESLint 9 (flat config) : `@eslint/js`, typescript-eslint recommended, react-hooks, react-refresh, prettier recommandé.
- Prettier 3 : `printWidth 100`, `semi true`, **double quotes**, `trailingComma all`. Ignore : `routeTree.gen.ts`, lockfiles.

## Commandes

| Usage | Commande |
| --- | --- |
| Dev (SSR + HMR) | `bun run dev` (`vite dev`) |
| Build prod | `bun run build` (`vite build`) |
| Build dev | `bun run build:dev` |
| Preview | `bun run preview` |
| Lint | `bun run lint` (`eslint .`) |
| Format | `bun run format` (`prettier --write .`) |

> Aucun test runner configuré.

## Contraintes de déploiement

- Runtime **Node.js compatible** requis.
- **Répertoire temporaire inscriptible** obligatoire (`mkdtemp` pour le GTFS).
- GTFS mis en cache **12 h** ; premier calcul d'une journée ≈ **20 s**.
- Aucune variable d'environnement requise côté app (pas de `.env.example`).