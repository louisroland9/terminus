## Framework & build

- **TanStack Start** `@tanstack/react-start` **1.168.61** (SSR + server functions) — monté depuis 1.168.32 pour corriger **CVE‑2026‑102989** (voir Sécurité).
- **TanStack Router** **1.170.42** (`@tanstack/router-plugin` 1.168.23), file-based routing.
- Vite 8.1.5, plugins : `tanstackStart({ server: { entry: "server" } })`, `nitro()`, `react()`, `tailwindcss()`, `tsconfigPaths()`.
- **Nitro** 3.0.260603-beta (via `nitro/vite`) — cible de déploiement **Vercel**.
- Override : `rolldown` → 1.2.1.

## Sécurité & dépendances transitoires

- **CVE‑2026‑102989** (GHSA‑qx66‑fv34‑fjm8, *critique*) : XSS réfléchie non authentifiée dans les réponses de server functions.
  - Plages vulnérables : `@tanstack/react-start` `>=1.143.12 <1.168.60`, `@tanstack/start-server-core` `>=1.143.12 <1.169.39`.
  - **Le correctif réel est dans `start-server-core`** (transitif) : monté `1.169.17 → 1.169.40`.
  - Corrigé par la montée de `react-start` en **1.168.61** (branche `fix/tanstack-start-xss`).
  - Ne **pas** utiliser le contournement `DANGEROUSLY_DEPLOY_VULNERABLE_TANSTACK_START_XSS` (variable d'env Vercel) : l'app expose une server function POST (surface exacte du CVE).
- Dépendance fragile : `luxon` est importé directement par `src/lib/horaires.server.ts` et déclaré dans `package.json` — un `node_modules` désynchronisé (luxon absent) fait échouer le build SSR. `bun install` corrige.