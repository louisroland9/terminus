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

## Données horaires

Les propositions utilisent le [flux GTFS officiel SNCF](https://transport.data.gouv.fr/datasets/horaires-sncf), sous licence ODbL. Les horaires théoriques sont mis à jour par la SNCF quotidiennement; les retards en temps réel ne sont pas inclus.

Le GTFS est téléchargé et analysé côté serveur, puis conservé en cache 12 h. Le premier calcul d’une journée de service prend environ 20 secondes. Le déploiement doit fournir un runtime Node.js compatible et un répertoire temporaire accessible en écriture.
