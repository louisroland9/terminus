# Project brief — Terminus

## Objectif

Application web ludique : depuis une gare choisie, **tirer au hasard un trajet TER aller‑retour** (avec correspondances) pour redécouvrir les lignes régionales françaises.

## Périmètre fonctionnel

- Autocomplétion de la gare de départ (recherche insensible aux accents, priorité préfixe).
- Choix d'une **échéance de retour** (date + heure, par défaut +4 h arrondi).
- Génération d'un **aller‑retour** dont les horaires proviennent du **GTFS officiel SNCF**.
- Affichage d'une timeline d'étapes : heures d'arrivée/départ, correspondances, trajets à pied, n° de ligne.
- Statistiques : durée totale, distance cumulée, départements traversés, nombre d'options de retour avant l'échéance.
- Lien de vérification vers SNCF Connect + mention licence ODbL.
- **Billet partageable** : `/t/$code` rejoue le même aller-retour jusqu'à l'échéance de retour, avec aperçu social (`public/og.png`).
- **Récap emoji** copié au partage et **carnet local** (gares, départements, carte de France).
- **Tirage du jour** : même gare + même jour = même destination (08:00 → 22:00, heure de Paris), avec série de jours.
- Mesure d'audience Plausible, désactivée sans domaine configuré.

## Source de données

- Flux **GTFS SNCF officiel** (`https://eu.ftp.opendatasoft.com/sncf/plandata/Export_OpenData_SNCF_GTFS_NewTripId.zip`), licence **ODbL**.
- Horaires **théoriques** uniquement.
- Liste locale des gares : `src/data/gares.json`.

## Hors périmètre

- Temps réel (retards, suppressions) — **non inclus**.
- Réservation / paiement.
- Backend persistant : pas de base de données, tout est calculé côté serveur à la demande.

## Contraintes produit

- Ton « brutaliste », fun, 100 % français.
- Confirmer les horaires sur SNCF Connect avant le départ (rappel affiché en pied de page).

## Conventions de contribution

- **Une branche par feature** depuis `develop` (`<type>/<slug>`), intégration par PR vers `develop`.
- `main` = production (Vercel), reçoit uniquement des releases depuis `develop`.
- Commits `type(scope): description` ; voir `.clinerules/04-git-workflow.md`.