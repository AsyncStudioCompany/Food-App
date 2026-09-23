# Food-App — contexte pour Claude

Application de recettes (web mobile-first, installable comme une app) avec trois piliers :

1. **Recettes** : un catalogue de recettes à parcourir, filtrer et consulter.
2. **Mon frigo** : l'utilisateur liste les aliments qu'il a chez lui.
3. **Suggestions** : l'app propose les recettes réalisables (ou presque) avec le contenu du frigo, triées selon les **préférences alimentaires** de l'utilisateur.

La spécification complète (fonctionnalités, modèle de données, algorithme de correspondance, feuille de route) est dans [`docs/CONTEXTE.md`](docs/CONTEXTE.md). Lis-la avant toute nouvelle fonctionnalité.

## Stack retenue (à confirmer avant de coder la première ligne)

- **Front** : React + TypeScript + Vite, Tailwind CSS, React Router.
- **PWA** : `vite-plugin-pwa` (installable sur mobile, fonctionne hors ligne pour le frigo).
- **App mobile native (plus tard)** : Capacitor pour emballer le même code en app iOS/Android.
- **Données** : Supabase (Postgres + Auth + stockage d'images). En MVP, un mode local (`localStorage`/IndexedDB) suffit pour le frigo et les préférences.
- **Tests** : Vitest + Testing Library ; Playwright pour les parcours principaux.

## Conventions

- Interface utilisateur **en français** ; code, noms de variables, commits et noms de tables **en anglais**.
- Mobile d'abord : chaque écran doit être utilisable à 360 px de large, cibles tactiles ≥ 44 px.
- La logique métier (correspondance frigo ↔ recettes, filtres de préférences) vit dans des fonctions pures sous `src/domain/` et est testée unitairement. Aucun appel réseau dans `src/domain/`.
- Les ingrédients sont toujours référencés par un **identifiant d'ingrédient canonique**, jamais par du texte libre (voir « Normalisation des ingrédients » dans `docs/CONTEXTE.md`).
- Les allergies et régimes sont des **filtres stricts** ; les goûts (cuisines, types de plats aimés) ne font que **modifier le tri**.

## Arborescence visée

```
src/
  domain/        # types + logique pure (matching, filtres, scores)
  data/          # accès aux données (Supabase, stockage local, seed)
  features/
    recipes/     # catalogue, détail recette
    fridge/      # gestion du frigo
    suggestions/ # « Que puis-je cuisiner ? »
    preferences/ # profil alimentaire
  components/    # UI partagée
  seed/          # recettes et ingrédients de départ (JSON)
```

## Commandes (une fois le projet initialisé)

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm test` — tests unitaires
- `npm run lint` — lint + typecheck
