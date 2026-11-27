# System patterns

## Organisation

```
src/
  routes/__root.tsx      # layout racine unique (html/head/meta, QueryClientProvider, <Outlet />)
  routes/index.tsx       # route `/` : formulaire de tirage et résultat
  routes/t.$code.tsx     # billet partagé : meta OG en SSR, trajet calculé côté client
  components/habillage.tsx, choix-mode.tsx
  components/billet/*    # affichage du résultat et partage
  components/carnet/*    # carte SVG des gares visitées
  server.ts              # entrée serveur (Nitro/h3) : normalise les 500 « swallowed »
  start.ts               # middleware erreur + csrfMiddleware (réinstallé explicitement)
  router.tsx             # getRouter() : QueryClient + createRouter(routeTree)
  styles.css             # Tailwind 4 CSS-first (tokens oklch, @utility, animations)
  lib/
    trajet.ts            # domaine PUR client : Gare/Etape/Trajet, km(), chercher(), GARES
    horaires.ts          # server function (createServerFn POST + zod)
    horaires.server.ts   # cœur serveur GTFS (cache, parseur, routeur)
    billet.ts            # encodage base64url d'un tirage (validé par zod)
    quotidien.ts         # fenêtre, graine et numéro du tirage du jour
    hasard.ts            # PRNG semé + mélange
    carnet.ts, recap.ts  # carnet localStorage, texte de partage
    seo.ts, partage.ts, analytics.ts
    error-capture.ts     # capture out-of-band des Error + wrapper console.error
    error-page.ts        # rendu HTML d'erreur 500
    utils.ts             # cn()
  hooks/use-mobile.tsx, use-carnet.ts
  components/ui/*        # shadcn (non édité)
  data/gares.json        # gares au format compact
```

## Pattern frontière client/serveur

1. Le composant de route appelle une **server function** (`proposerTrajetAvecHorairesReels`).
2. Cette fonction valide l'entrée avec **zod**, puis **importe dynamiquement** `./horaires.server` au moment de l'exécution serveur.
3. Ce découplage garantit que le code Node n'est jamais embarqué dans le bundle client.

## Flux de génération d'un trajet aller‑retour

`genererTrajetAvecHorairesReels(input)` :
1. Conversion des dates en `Europe/Paris` (luxon), validation `retourAvant > departLe`.
2. `obtenirContexte(departLe)` → contexte GTFS du jour (cache 12 h).
3. Sélection de **destinations** : 20 km ≤ d ≤ `min(350 km, minutes disponibles × 1,1)`. Trois cas : `destinationId` imposée (billet partagé), `graine` (tirage du jour, toutes les candidates dans un ordre reproductible), sinon aléatoire avec 30 tentatives max.
4. `Router.route(Query)` sur l'aller (train = mode `3`, ≤ 4 correspondances) ; vérifie que le trajet est bien un TER.
5. `chercherRetours(...)` : `Router.rangeRoute(RangeQuery)` sur ≤ 7 jours, dédoublonnage par signature de legs.
6. Choix du retour le plus tardif, assemblage des étapes (`construireEtapes`), calcul durée/distance/dépts.

## Billet et URL

- Après un tirage sur `/`, l'URL affiche `/t/$code` par **masquage de route** (`navigate({ mask, unmaskOnReload })`) ; `state.billet` force la mise à jour de l'historique.
- `/t/$code` appelle la server function via `useQuery` (jamais en SSR), pour que les robots d'aperçu n'attendent pas le GTFS.
- Les URL absolues des meta viennent de la requête (`createIsomorphicFn` dans `seo.ts`, `x-forwarded-host` pris en compte).

## Pattern de cache

- Cache **basé sur des promesses** partagées : `Map<cle, { expireA: number; promesse: Promise<T> }>`.
- Une entrée expirée est supprimée ; un échec supprime l'entrée correspondante (pas de mise en cache d'erreurs).
- Fichier GTFS : 1 seule promesse de téléchargement (`fichierGtfsCache`), dossier temporaire `mkdtemp`, ancien dossier supprimé en arrière‑plan.
- Contexte par jour de service : `contextes: Map<cleJour, EntreeCache<ContexteGtfs>>`.

## Correspondance gares ↔ GTFS

- Normalisation des noms (suppression accents, `st/ste → saint/sainte`, alphanumérique uniquement).
- Appariement par nom normalisé, sinon par proximité géographique (tolérance lat/lon + distance ≤ 0,3 km), filtre final ≤ 0,5 km.
- Seuls les quais `StopPoint:OCETrain TER-*` actifs sont retenus.

## Gestion d'erreur

- h3 sérialise les throw non gérés en `{"status":500,"unhandled":true,"message":"HTTPError"}` **sans stack**.
- `error-capture.ts` intercepte `console.error` + events `error`/`unhandledrejection` pour garder l'Error originale (TTL 5 s).
- `server.ts` détecte ce corps et renvoie `renderErrorPage()` (HTML).
- `start.ts` : middleware d'erreur → page 500 + `csrfMiddleware` (scope `serverFn`).

## UI

- Tokens couleurs **oklch** dans `styles.css` (`--background` jaune fluo, `--primary` rouge tomate, `--secondary` bleu nuit, `--accent` rose, `--pop` turquoise…).
- Utilitaires CSS custom : `brut`, `brut-lg`, `press` ; animations `animate-marquee`, `animate-wobble`, `animate-chug`, `animate-ride`, `animate-pop-in`, `animate-spin-slow`, `animate-shake`.
- Composants UI shadcn consommés via `@/components/ui/*` et `cn()`. Composants applicatifs dans `components/` (hors `ui/`).

## Conventions

- Domaine et UI en **français** ; API framework en anglais.
- Fichiers serveur suffixés `.server.ts` (jamais `server-only`).
- `routeTree.gen.ts` généré : jamais édité.

## Workflow Git

- Modèle 3 niveaux : **`main`** (production Vercel, protégée) ← **`develop`** (intégration) ← **branches de travail**.
- **Une branche par feature** : `<type>/<slug>` (`feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`), créée depuis `develop` à jour.
- Intégration par **Pull Request vers `develop`** ; release = PR `develop → main`. Aucun commit direct sur `main`/`develop`.
- Commits : `type(scope): description` (scope = module : `trajet`, `horaires`, `gtfs`, `ui`, `routes`, `harness`, `build`, `deps`).
- Nettoyage après fusion : `git worktree prune`, `git branch -d`, `git push origin --delete` (distantes fusionnées, sur validation).
- Détail complet : `.clinerules/04-git-workflow.md`.