# Mijote — contexte pour Claude

App mobile de recettes anti-gaspillage (PWA, en français, au tutoiement). L'utilisateur remplit son frigo avec les quantités et les dates de péremption. L'app lui propose d'abord les recettes faisables tout de suite, puis celles où il manque 1 ou 2 ingrédients. Elle respecte son régime et ses allergies, et met en avant ses cuisines préférées. Il peut aimer des recettes, les ranger dans des listes, et demander à une **IA d'inventer une recette** à partir de son frigo.

- Spécification produit : [`docs/CONTEXTE.md`](docs/CONTEXTE.md).
- **Direction artistique : [`docs/design/mijote/`](docs/design/mijote/README.md)** (handoff « 2a · Soir », haute fidélité). Couleurs, typo, rayons, espacements, textes et interactions sont **définitifs** : on les reproduit à l'identique, on n'invente pas de variante. `MijoteApp.dc.html` contient le prototype complet (seul le thème `soir` compte). Pour un nouvel écran, on réutilise les briques existantes (pastilles, lignes, cartes, bottom sheets, tuile en pointillés).

## Stack

- React 19 + TypeScript + Vite, React Router, CSS pur (`src/styles.css`, variables du thème en haut du fichier). Pas de Tailwind, **pas de bibliothèque d'icônes** : cœurs, coches, loupe et « + » sont dessinés en CSS ou en texte.
- Polices Geist et Geist Mono via `@fontsource` (hors ligne).
- PWA : `vite-plugin-pwa` ; les photos TheMealDB sont mises en cache.
- IA : API Claude (`@anthropic-ai/sdk`, sortie structurée zod) côté serveur uniquement, dans `server/recipeAI.ts`. Servie sur `/api/generate-recipe` par le serveur Vite local (`npm run dev` / `npm start`). Pour une mise en ligne, la fonction Supabase `supabase/functions/generate-recipe` réutilise le même code.
- Usage actuel : **en local sur le Mac** (`Mijote.command` ou `npm start`), l'iPhone passe par le Wi-Fi. Pas d'hébergement pour l'instant. Voir [`docs/INSTALLATION.md`](docs/INSTALLATION.md). La clé `ANTHROPIC_API_KEY` ne doit jamais arriver côté client.
- Comptes : Supabase Auth + table `vaults` (`supabase/migrations/0001_vaults.sql`), données **chiffrées de bout en bout** (`src/crypto/`, `src/account/`). Rien de lisible ne doit partir vers le serveur de comptes ; les données locales sont chiffrées aussi (`src/state/persist.ts`).
- Tests : Vitest + Testing Library. Lint : oxlint.

## Conventions

- Interface **en français, au tutoiement** ; code, noms de variables et commits **en anglais**.
- Mobile d'abord : largeur de référence 390 px, utilisable à 360 px. Cibles tactiles : 40 px minimum (boutons ronds), CTA de 52 à 56 px.
- La logique métier vit dans `src/domain/` en fonctions pures testées, sans appel réseau. Ce code est partagé avec le serveur Deno, donc **ses imports gardent l'extension `.ts`**, tout comme `src/data/catalog.ts`.
- Les ingrédients sont référencés par leur **identifiant du catalogue** (`src/data/catalog.ts`), jamais par du texte libre. Les recettes générées par l'IA aussi : le schéma de sortie limite les identifiants au catalogue.
- Recettes importées de TheMealDB : `src/data/mealdb.ts` (id `m<idMeal>`, vraie photo, `pantry`, `source`). Candidats listés par `scripts/mealdb-candidates.mjs`, puis traduits et vérifiés à la main. L'IA se coupe dans le Profil (`prefs.ai`).
- Quantités en unité de base (`g`, `cl`, `pc`) ; conversions dans `src/domain/units.ts`. Statut par ingrédient : `ok` / `partial` / `missing`.
- Régime et allergies = **filtres stricts** ; cuisines préférées, aliments qui périment bientôt et **objectif** (nutrition estimée) = **bonus de tri** (score dans `src/domain/matching.ts`). Tout nouvel ingrédient doit avoir ses valeurs dans `src/data/nutrition.ts`.
- Non connecté : seul l'accueil (`screens/Welcome.tsx`) est visible ; après inscription, la configuration (`screens/Onboarding.tsx`) tant que `prefs.onboarded` est faux.
- Zones de sécurité : `var(--safe-top)` / `var(--safe-bottom)` / `var(--top)`, jamais `env()` directement.
- Les bottom sheets (`ui/Sheet.tsx`) sont rendus dans `.app` via un portail React : ils ne suivent jamais le défilement d'un écran.
- Animations : keyframes `mj-*` de `styles.css`, coupées par `prefers-reduced-motion`.

## Arborescence

```
src/
  domain/      # types + logique pure : unités, péremption, régime, matching/score, recherche, étapes, IA (validation)
  data/        # catalogue d'ingrédients et de recettes
  state/       # store, données locales chiffrées, photos, client IA, listes
  crypto/      # chiffrement de bout en bout (WebCrypto) et clés dans IndexedDB
  account/     # comptes Supabase et synchro chiffrée
  ui/          # briques de la DA : cœur, en-tête, cartes, sheet, barre d'onglets, illustrations animées
  screens/     # Frigo, Recettes (résultats), Fiche, Chercher, Listes, Profil, sheets, « Bon appétit ! »
server/        # génération de recettes par l'IA (partagé serveur local / Supabase)
supabase/      # fonction Edge generate-recipe (pour une future mise en ligne)
docs/design/   # handoff de design (référence visuelle)
```

## Commandes

- `npm run dev` : serveur de dev, avec l'API IA si `ANTHROPIC_API_KEY` est dans `.env.local` (voir `.env.example`)
- `npm start` : build + serveur local sur le port 4173, ouvert au réseau local (c'est ce que lance `Mijote.command`)
- `npm run build` : typecheck + build PWA
- `npm test` : tests unitaires et parcours (Vitest)
- `npm run lint` : oxlint + typecheck
