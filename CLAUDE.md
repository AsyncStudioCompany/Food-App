# Mijote — contexte pour Claude

App mobile de recettes anti-gaspillage (PWA, en français, au tutoiement). L'utilisateur remplit son frigo avec les quantités et les dates de péremption. L'app lui propose d'abord les recettes faisables tout de suite, puis celles où il manque 1 ou 2 ingrédients. Elle respecte son régime et ses allergies, et met en avant ses cuisines préférées. Il peut aimer des recettes, les ranger dans des listes, et demander à une **IA d'inventer une recette** à partir de son frigo.

- Spécification produit : [`docs/CONTEXTE.md`](docs/CONTEXTE.md).
- **Direction artistique : [`docs/design/mijote/`](docs/design/mijote/README.md)** (handoff « 2a · Soir », haute fidélité). Couleurs, typo, rayons, espacements, textes et interactions sont **définitifs** : on les reproduit à l'identique, on n'invente pas de variante. `MijoteApp.dc.html` contient le prototype complet (seul le thème `soir` compte). Pour un nouvel écran, on réutilise les briques existantes (pastilles, lignes, cartes, bottom sheets, tuile en pointillés).

## Stack

- React 19 + TypeScript + Vite, React Router, CSS pur (`src/styles.css`, variables du thème en haut du fichier). Pas de Tailwind, **pas de bibliothèque d'icônes** : cœurs, coches, loupe et « + » sont dessinés en CSS ou en texte.
- Polices Geist et Geist Mono via `@fontsource` (hors ligne).
- PWA : `vite-plugin-pwa` ; les photos TheMealDB sont mises en cache.
- IA : API Claude (`@anthropic-ai/sdk`, sortie structurée zod) côté serveur uniquement, dans `server/recipeAI.ts`. Servie sur `/api/generate-recipe` par Vite en dev et par une fonction Netlify en production (`netlify/functions/generate-recipe.mts`). Une variante Supabase existe (`supabase/functions/generate-recipe`).
- Usage actuel : **en local sur le Mac** (`Mijote.command` ou `npm start`), l'iPhone passe par le Wi-Fi. Netlify est prêt pour plus tard. Voir [`docs/INSTALLATION.md`](docs/INSTALLATION.md). La clé `ANTHROPIC_API_KEY` ne doit jamais arriver côté client.
- Tests : Vitest + Testing Library. Lint : oxlint.

## Conventions

- Interface **en français, au tutoiement** ; code, noms de variables et commits **en anglais**.
- Mobile d'abord : largeur de référence 390 px, utilisable à 360 px. Cibles tactiles : 40 px minimum (boutons ronds), CTA de 52 à 56 px.
- La logique métier vit dans `src/domain/` en fonctions pures testées, sans appel réseau. Ce code est partagé avec le serveur Deno, donc **ses imports gardent l'extension `.ts`**, tout comme `src/data/catalog.ts`.
- Les ingrédients sont référencés par leur **identifiant du catalogue** (`src/data/catalog.ts`), jamais par du texte libre. Les recettes générées par l'IA aussi : le schéma de sortie limite les identifiants au catalogue.
- Recettes importées de TheMealDB : `src/data/mealdb.ts` (id `m<idMeal>`, vraie photo, `pantry`, `source`). Candidats listés par `scripts/mealdb-candidates.mjs`, puis traduits et vérifiés à la main. L'IA se coupe dans le Profil (`prefs.ai`).
- Quantités en unité de base (`g`, `cl`, `pc`) ; conversions dans `src/domain/units.ts`. Statut par ingrédient : `ok` / `partial` / `missing`.
- Régime et allergies = **filtres stricts** ; cuisines préférées et aliments qui périment bientôt = **bonus de tri** (score dans `src/domain/matching.ts`).
- Zones de sécurité : `var(--safe-top)` / `var(--safe-bottom)` / `var(--top)`, jamais `env()` directement.
- Les bottom sheets se rendent **hors** du conteneur qui défile (sinon ils suivent le défilement).
- Animations : keyframes `mj-*` de `styles.css`, coupées par `prefers-reduced-motion`.

## Arborescence

```
src/
  domain/      # types + logique pure : unités, péremption, régime, matching/score, recherche, étapes, IA (validation)
  data/        # catalogue d'ingrédients et de recettes
  state/       # store persistant (localStorage), photos TheMealDB, client IA, listes
  ui/          # briques de la DA : cœur, en-tête, cartes, sheet, barre d'onglets, illustrations animées
  screens/     # Frigo, Recettes (résultats), Fiche, Chercher, Listes, Profil, sheets, « Bon appétit ! »
server/        # génération de recettes par l'IA (partagé dev / Netlify / Supabase)
netlify/       # fonction Netlify /api/generate-recipe
supabase/      # fonction Edge generate-recipe (variante)
docs/design/   # handoff de design (référence visuelle)
```

## Commandes

- `npm run dev` : serveur de dev, avec l'API IA si `ANTHROPIC_API_KEY` est dans `.env.local` (voir `.env.example`)
- `npm start` : build + serveur local sur le port 4173, ouvert au réseau local (c'est ce que lance `Mijote.command`)
- `npm run build` : typecheck + build PWA
- `npm test` : tests unitaires et parcours (Vitest)
- `npm run lint` : oxlint + typecheck
