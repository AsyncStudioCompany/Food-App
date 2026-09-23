# Food-App — contexte pour Claude

Application de recettes (web mobile-first, installable comme une app) avec trois piliers :

1. **Recettes** : un catalogue de recettes à parcourir, filtrer et consulter.
2. **Mon frigo** : l'utilisateur liste les aliments qu'il a chez lui.
3. **Suggestions** : l'app propose les recettes réalisables (ou presque) avec le contenu du frigo, triées selon les **préférences alimentaires** de l'utilisateur.

La spécification complète (fonctionnalités, modèle de données, algorithme de correspondance, feuille de route) est dans [`docs/CONTEXTE.md`](docs/CONTEXTE.md). Lis-la avant toute nouvelle fonctionnalité.

## Stack (validée)

- **Front** : React 19 + TypeScript + Vite, Tailwind CSS 4, React Router.
- **PWA** : `vite-plugin-pwa` (installable sur mobile, fonctionne hors ligne pour le frigo).
- **App mobile native (plus tard)** : Capacitor pour emballer le même code en app iOS/Android.
- **Données** : Supabase (Postgres + Auth + stockage d'images). En MVP, un mode local (`localStorage`/IndexedDB) suffit pour le frigo et les préférences.
- **Tests** : Vitest + Testing Library ; Playwright pour les parcours principaux.
- **Lint** : oxlint.

## Conventions

- Interface utilisateur **en français** ; code, noms de variables, commits et noms de tables **en anglais**.
- Mobile d'abord : chaque écran doit être utilisable à 360 px de large, cibles tactiles ≥ 44 px.
- La logique métier (correspondance frigo ↔ recettes, filtres de préférences) vit dans des fonctions pures sous `src/domain/` et est testée unitairement. Aucun appel réseau dans `src/domain/`.
- Les ingrédients sont toujours référencés par un **identifiant d'ingrédient canonique**, jamais par du texte libre (voir « Normalisation des ingrédients » dans `docs/CONTEXTE.md`).
- Le frigo stocke des **quantités avec unité**. Le matching compare les quantités au besoin de la recette (ajusté aux portions) : chaque ingrédient est `enough` / `insufficient` / `missing`. Conversions d'unités dans `src/domain/units.ts`. Si une quantité est inconnue ou non convertible, on considère l'ingrédient comme disponible.
- Les allergies et régimes sont des **filtres stricts** ; les goûts (cuisines, types de plats aimés) ne font que **modifier le tri**.

## Design « popote »

- Nom affiché : **popote**. Thème sombre unique (fond `stone-950`, surfaces `stone-900`, bordures `stone-800`), pastilles arrondies, élément actif en blanc sur noir, chiffres en police mono.
- Couleurs d'état : vert (`emerald-300`) « Tu as tout », orange (`amber-300`) « pas assez », rouge (`red-300`) « Il te manque ».
- Barre de navigation flottante en bas : Mon frigo (`/`), Recherche (`/recherche`), Préférences (`/preferences`).
- Zones de sécurité iPhone : utiliser `var(--safe-top)` / `var(--safe-bottom)` (définies dans `src/index.css`), jamais `env()` directement, pour que le cadre de la maquette puisse les simuler.
- Icônes : `lucide-react`. Visuel de recette : `RecipeVisual` (photo si `imageUrl`, sinon dégradé + emoji).

## Arborescence

```
src/
  domain/        # types + logique pure (matching, unités, recherche, consommation du frigo)
  data/          # seed, stores persistants (frigo, préférences) en localStorage
  features/
    fridge/      # « Mon frigo » : pastilles par rayon + panneau de quantité
    results/     # « N recettes avec ce que t'as » : top 3 puis faisables, puis presque
    recipes/     # recherche + fiche recette (portions, « J'ai cuisiné »)
    preferences/ # régime, allergies, cuisines, goûts
  components/    # en-tête, barre de navigation, logo, visuel de recette
  demo/          # cadre iPhone 16 Pro Max et frigo d'exemple de la maquette
  seed/          # ingrédients et recettes de départ (JSON)
```

## Commandes

- `npm run dev` — serveur de développement
- `npm run build` — typecheck + build de production (génère aussi le service worker PWA)
- `npm test` — tests unitaires (Vitest), `npm run test:watch` en continu
- `npm run lint` — oxlint + typecheck
- `npm run build:demo` — maquette interactive en un seul fichier (`dist-demo/popote.html`) : routes en mémoire, cadre iPhone 16 Pro Max sur grand écran, frigo d'exemple

## Données de départ

- `src/seed/ingredients.json` et `src/seed/recipes.json` sont la source de vérité, chargés via `src/data/seed.ts`.
- `src/seed/seed.test.ts` vérifie leur cohérence (identifiants uniques, parents existants, unités et allergènes valides, chaque ingrédient de recette existe). Toute nouvelle recette doit passer ces tests.
- Pour une recette : quantités pour `servings` portions, unité mesurable (g, ml, pièce, c. à soupe…) dès que possible, `optional: true` pour ce qui n'est pas indispensable.
