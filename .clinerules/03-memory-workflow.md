# 03 — Protocole mémoire (obligatoire)

## Avant CHAQUE tâche

1. Lire `memory-bank/projectbrief.md`, `memory-bank/techContext.md`, `memory-bank/systemPatterns.md`.
2. Lire `memory-bank/activeContext.md` s'il existe pour connaître l'état de travail en cours.
3. S'appuyer sur ces fichiers **en priorité** plutôt que de re-supposer l'architecture.

## Pendant la tâche

- Vérifier toute affirmation technique dans le code réel (ne pas se fier à la mémoire seule).
- Respecter `.clinerules/02-architecture-conventions.md` (frontière `.server.ts`, TS strict, nommage FR).

## Après CHAQUE changement majeur

Mettre à jour la mémoire concernée, de façon **concise** :

| Situation | Fichier à mettre à jour |
| --- | --- |
| Nouvel objectif, périmètre, fonctionnalité livrée | `projectbrief.md` |
| Nouvelle dépendance, script, version, contrainte runtime | `techContext.md` |
| Nouveau pattern, dossier, décision d'architecture | `systemPatterns.md` |
| État courant, tâche en cours, prochaines étapes | `activeContext.md` (non versionné) |

## Règles

- `activeContext.md` est **ignoré par Git** (contexte local/privé) : peut y être plus détaillé, mais rester bref.
- Pas de duplication : un fait va dans **un seul** fichier, le plus pertinent.
- Supprimer les informations devenues fausses (pas d'accumulation historique).
- Toute modification des règles (`.clinerules/*`) doit être **signalée dans `activeContext.md`** et se faire sur la branche `chore/harness` (cf. `.clinerules/04-git-workflow.md`).