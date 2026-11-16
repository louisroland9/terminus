# 04 — Workflow Git (une branche par feature)

## Modèle de branches (3 niveaux)

```
main        ← production, déployée sur Vercel. PROTÉGÉE.
  ▲  (PR de develop uniquement)
develop     ← intégration, toujours verte. PROTÉGÉE.
  ▲  (PR d'une branche de travail)
feat/*  fix/*  chore/*  docs/*  refactor/*  perf/*  test/*
```

- `origin` : `git@github.com:louisroland9/terminus.git`, branche par défaut `main`.
- Une branche de travail **ne part jamais de `main`** : elle part toujours de `develop` à jour.
- `develop` se merge dans `main` par PR (release), `main` ne reçoit jamais de commit direct.

## Une branche par feature — obligatoire

**Aucun travail ne se fait sur `develop` ou `main`.** Chaque tâche = 1 branche courte, 1 objectif, 1 PR.

### Nommage

`<type>/<slug-kebab-case>` — types autorisés :

| Type | Usage |
| --- | --- |
| `feat` | nouvelle fonctionnalité visible |
| `fix` | correction de bug |
| `chore` | outillage, dépendances, build, déploiement |
| `docs` | documentation seule |
| `refactor` | refonte sans changement de comportement |
| `perf` | performance |
| `test` | tests (à n'introduire que sur demande explicite) |

- `slug` : court, descriptif, en anglais kebab-case (ex. `feat/return-deadline`, `fix/gtfs-cache-ttl`).
- Interdit : brancher sous `main`, `develop`, `master`, ou un type inconnu.

### Cycle de vie complet

```sh
git fetch origin --prune
git switch develop
git pull --ff-only origin develop
git switch -c feat/<slug>            # créer la branche de travail

# … implémentation + commits (voir conventions ci-dessous) …

bun run lint                          # obligatoire
bun run build                         # si build/SSR/route/server touchés
git push -u origin feat/<slug>        # première poussée : -u
# → Pull Request vers `develop` (jamais directement vers `main`)
```

Puis, **après fusion de la PR** (nettoyage, cf. section ci-dessous) :
```sh
git switch develop && git pull --ff-only origin develop
git worktree prune
git branch -d feat/<slug>             # -d (sûr) : refuse si non fusionnée
```

### Branches de travail actives

| Préfixe | Emplacement | Intégration |
| --- | --- | --- |
| `feat/*` | depuis `develop` | PR → `develop` |
| `fix/*` | depuis `develop` | PR → `develop` |
| `chore/*`, `docs/*` | depuis `develop` | PR → `develop` (ou direct si trivial et validé) |

## Convention de message de commit

```
<type>(<scope>): <description impérative, ≤ 72 caractères>
```

- `type` : identique au préfixe de branche (`feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`).
- `scope` : module concerné — `trajet`, `horaires`, `gtfs`, `ui`, `routes`, `harness`, `build`, `deps`.
- `description` : minuscule initiale, sans point final, à l'impératif (« ajoute », « corrige »).
- Corps optionnel : *pourquoi* (le contexte d'une décision), pas *comment* (le code le dit).
- Exemples valides : `feat(horaires): utilise le flux GTFS officiel SNCF`, `fix(ui): empêche les faux liens de gare`, `chore(harness): ajoute les règles Cline`.

## Règles & interdictions

- ❌ Commit direct sur `develop` ou `main`.
- ❌ `git push --force` sur une branche partagée ou sur `develop`/`main` (force-with-lease seulement sur une branche de feature personnelle).
- ❌ Réécrire l'historique existant (`rebase -i` sur des commits déjà poussés/publiés, `reset --hard` sur des branches partagées).
- ❌ Laisser un merge non résolu ou un working tree sale en fin de tâche.
- ❌ Mélanger plusieurs sujets dans un commit (« JS en 1 commit »).
- ✅ `--ff-only` pour tous les `pull` sur `develop`/`main` (pas de merge commit parasite).
- ✅ Vérifier `git status` avant et après chaque étape.
- ✅ Worktrees : `git worktree prune` si un dossier externe a été supprimé.

## Harnais versionné vs non versionné

| Chemin | Versionné ? | Branche de travail |
| --- | --- | --- |
| `.clinerules/*` | ✅ oui | `chore/harness` |
| `memory-bank/projectbrief.md`, `techContext.md`, `systemPatterns.md` | ✅ oui | `chore/harness` |
| `memory-bank/activeContext.md` | ❌ **non** (`.gitignore`) | — (local) |

Aucune règle du harnais (`memory-bank/`) **ne modifie** le code source : le harnais se modifie sur `chore/harness` uniquement.

## Déploiement

- **`main` → Vercel (production)**. Une feature visible n'est en prod qu'après fusion dans `develop` **puis** release PR `develop → main`.
- Les variables d'env runtime (Node compatible) inchangées — cf. `techContext.md`.