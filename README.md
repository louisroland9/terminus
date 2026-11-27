# Terminus

Application web permettant de tirer un trajet TER aléatoire à partir d'une gare et de redécouvrir les lignes régionales françaises.

## Développement

Prérequis : [Bun](https://bun.sh/).

```sh
git clone <this-repository-url>
cd terminus
bun install
bun run dev
```

Commandes disponibles : `bun run build`, `bun run preview` et `bun run lint`.

## Partage et jeu

- Chaque tirage a un lien `/t/…` qui rejoue le même aller-retour jusqu'à l'échéance de retour.
- Le carnet de gares et la série du tirage du jour restent dans le navigateur (`localStorage`).
- Le tirage du jour donne la même destination à tout le monde pour une même gare et un même jour, tant que le flux GTFS ne change pas.

## Données horaires

Les propositions utilisent le [flux GTFS officiel SNCF](https://transport.data.gouv.fr/datasets/horaires-sncf), sous licence ODbL. Les horaires théoriques sont mis à jour par la SNCF quotidiennement; les retards en temps réel ne sont pas inclus.

Le GTFS est téléchargé et analysé côté serveur, puis conservé en cache 12 h. Le premier calcul d’une journée de service prend environ 20 secondes. Le déploiement doit fournir un runtime Node.js compatible et un répertoire temporaire accessible en écriture.

## Mesure d'audience

Le suivi Plausible est désactivé tant que `VITE_PLAUSIBLE_DOMAIN` n'est pas renseigné. Copie `.env.example` vers `.env` et indique le domaine enregistré dans Plausible ; renseigne la même variable dans l'environnement de production.

Les événements suivis sont `Random Journey Launched` (lancement d'un tirage libre après validation), `Daily Draw` (tirage du jour), `Share Clicked` (clic sur le bouton de partage), `Shared Link Opened` (affichage d'une page `/t/…`, rechargements compris) et `SNCF Connect Click` (clic sortant vers SNCF Connect). Ce dernier mesure un clic, pas un achat confirmé. Ajoute ces événements comme objectifs personnalisés dans Plausible pour consulter leurs compteurs.
