# Tech context

## Runtime & outillage

- **Bun 1.4.2** (binaire local versionné dans `.tools/bun/bin/bun`, `.tools/` ignoré par Git).
- `bunfig.toml` : `saveTextLockfile = true`, `minimumReleaseAge = 86400` (garde supply‑chain 24 h).
- Gestionnaire de paquets : Bun (lockfile `bun.lock`).

## Framework & build

- **TanStack Start** `@tanstack/react-start` 1.168.32 (SSR + server functions).
- **TanStack Router** 1.170.18 (`@tanstack/router-plugin` 1.168.23), file-based routing.
- **Vite** 8.1.5, plugins : `tanstackStart({ server: { entry: "server" } })`, `nitro()`, `react()`, `tailwindcss()`, `tsconfigPaths()`.
- **Nitro** 3.0.260603-beta (via `nitro/vite`) — cible de déploiement **Vercel**.
- Override : `rolldown` → 1.2.1.

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