# Food-App — Spécification et contexte produit

## 1. Vision

« J'ouvre mon frigo, je ne sais pas quoi cuisiner. » Food-App répond à cette question : l'utilisateur indique ce qu'il a, l'app lui propose des recettes qu'il peut faire **maintenant**, ou presque, en tenant compte de ce qu'il aime et de ce qu'il ne peut pas manger.

Objectifs secondaires : réduire le gaspillage (mettre en avant les aliments qui vont périmer) et donner envie de cuisiner (belles fiches recettes).

**Support** : site web responsive, mobile-first, installable (PWA). Il pourra ensuite être publié sur les stores via Capacitor sans réécrire le code.

## 2. Utilisateurs cibles

- Étudiants et jeunes actifs qui cuisinent avec ce qu'ils ont sous la main.
- Familles qui veulent limiter le gaspillage.
- Personnes ayant des contraintes alimentaires (végétarien, sans gluten, allergies) et qui veulent un filtre fiable.

## 3. Fonctionnalités

### 3.1 Recettes (catalogue)

- Liste de recettes en cartes : photo, titre, temps total, difficulté, badges (végé, rapide…).
- Recherche plein texte (titre, ingrédient).
- Filtres : type de plat (entrée, plat, dessert, snack, boisson), cuisine (française, italienne, asiatique…), temps max, difficulté, régime.
- Fiche recette :
  - ingrédients avec quantités, chacun marqué selon le frigo : **« j'ai »**, **« pas assez »** (ex. « j'ai 2 œufs / il en faut 4 ») ou **« il me manque »** ;
  - ajustement du nombre de portions : les quantités sont recalculées **et la disponibilité aussi** (pour 2 personnes vous avez peut-être assez, pour 6 non) ;
  - étapes numérotées ; mode « cuisine » (écran qui reste allumé, grosses étapes) en bonus ;
  - bouton « favori ».

### 3.2 Mon frigo

- Ajout rapide d'aliments avec **autocomplétion** sur la base d'ingrédients canoniques (« tomat » → Tomate).
- Rangement par catégorie : fruits & légumes, viandes & poissons, produits laitiers, féculents, épicerie, condiments, surgelés…
- **Quantités saisies dès le MVP** (ex. « 6 œufs », « 500 g de pâtes », « 1 L de lait ») :
  - le formulaire propose l'unité par défaut de l'ingrédient (pièces pour les œufs, g pour les pâtes, ml pour le lait) avec une quantité préremplie, modifiable ;
  - boutons **+ / −** sur chaque aliment pour ajuster vite (pas de 1 pour les pièces, de 50 g / 100 ml sinon) ;
  - un aliment à 0 disparaît du frigo (avec « annuler ») ;
  - la quantité reste techniquement facultative : un aliment sans quantité compte comme « présent, quantité inconnue » (utile pour les restes ou les pots entamés).
- Date de péremption facultative → les aliments qui périment bientôt sont mis en avant.
- **Placard de base** (« toujours en stock ») : sel, poivre, huile, eau, sucre, farine… cochés une fois pour toutes et jamais comptés comme manquants.
- Suppression rapide (glisser / bouton).
- **« J'ai cuisiné cette recette »** → écran de confirmation qui **déduit les quantités utilisées** du frigo (selon le nombre de portions choisi), chaque ligne restant modifiable avant validation.
- Bonus plus tard : scan de ticket de caisse ou de code-barres (Open Food Facts).

### 3.3 Suggestions (« Que puis-je cuisiner ? »)

Écran d'accueil de l'app. Trois sections :

1. **Faisable maintenant** : tous les ingrédients obligatoires sont dans le frigo.
2. **Il manque 1 ou 2 ingrédients** : avec la liste de ce qui manque (→ futur bouton « ajouter à la liste de courses »).
3. **Pour finir ce qui va périmer** : recettes utilisant les aliments proches de la péremption.

Chaque carte affiche un pourcentage ou une jauge de correspondance (« 5/6 ingrédients »).

### 3.4 Préférences alimentaires

Deux familles, traitées **différemment** :

| Type | Exemples | Effet |
|---|---|---|
| **Contraintes (strictes)** | Régime (végétarien, vegan, pescétarien, halal, sans porc), allergies/intolérances (gluten, lactose, arachides, fruits à coque, œufs, crustacés…), ingrédients refusés (« je déteste la coriandre ») | La recette est **exclue** partout (catalogue compris, sauf si l'utilisateur désactive le filtre explicitement). |
| **Goûts (souples)** | Cuisines préférées (italienne, japonaise…), types de plats aimés (plats mijotés, salades, épicé), ingrédients adorés, temps de préparation habituel | La recette est **mieux classée**, jamais exclue. |

Les préférences sont choisies à l'onboarding (3 écrans maximum, tout est passable) et modifiables dans le profil.

Bonus : apprentissage implicite (les recettes mises en favori ou marquées « cuisinée » renforcent les tags associés).

### 3.5 Hors MVP (idées)

- Liste de courses générée depuis les ingrédients manquants.
- Planning de repas de la semaine.
- Ajout de ses propres recettes, import depuis une URL.
- Partage d'un frigo commun (colocation, famille).
- Suggestions générées par IA à partir du frigo.

## 4. Modèle de données

```ts
// Ingrédient canonique : la clé de voûte du matching
type Ingredient = {
  id: string;              // "tomato"
  name: string;            // "Tomate" (affichage FR)
  defaultUnit: Unit;       // unité proposée à la saisie ("piece" pour les œufs)
  gramsPerPiece?: number;  // conversion pièce ↔ masse (1 œuf ≈ 60 g, 1 oignon ≈ 150 g)
  gramsPerMl?: number;     // conversion volume ↔ masse (farine ≈ 0,55 ; lait ≈ 1,03)
  aliases: string[];       // ["tomates", "tomate cerise", "tomates pelées"]
  category: IngredientCategory;
  parentId?: string;       // "cherry_tomato" → parent "tomato"
  isPantryStaple: boolean; // sel, poivre, huile… par défaut
  allergens: Allergen[];   // ["gluten"], ["lactose"]…
  dietFlags: {             // pour déduire le régime d'une recette
    isMeat: boolean; isFish: boolean; isAnimalProduct: boolean; isPork: boolean;
  };
};

type Recipe = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  mealType: MealType[];    // "starter" | "main" | "dessert" | "snack" | "drink" | "breakfast"
  cuisine?: Cuisine;       // "french" | "italian" | ...
  tags: string[];          // "quick", "spicy", "comfort", "one-pot"...
  ingredients: RecipeIngredient[];
  steps: string[];
  source?: { name: string; url?: string };
};

type RecipeIngredient = {
  ingredientId: string;
  quantity?: number;
  unit?: Unit;             // "g" | "ml" | "piece" | "tbsp" | "tsp" | "pinch"...
  note?: string;           // "coupées en dés"
  optional: boolean;       // n'empêche pas de faire la recette
};

type FridgeItem = {
  id: string;
  userId: string;
  ingredientId: string;
  quantity?: number;       // absent = présent, quantité inconnue
  unit?: Unit;
  expiresOn?: string;      // ISO date
  addedAt: string;
};

type UserPreferences = {
  userId: string;
  diet?: "omnivore" | "vegetarian" | "vegan" | "pescatarian";
  excludePork: boolean;
  allergens: Allergen[];
  excludedIngredientIds: string[];
  pantryStapleIds: string[];      // placard de base personnalisé
  favoriteCuisines: Cuisine[];
  favoriteTags: string[];
  lovedIngredientIds: string[];
  maxTotalMinutes?: number;
};
```

Unités gérées : `g`, `kg`, `ml`, `cl`, `l`, `piece`, `tbsp` (c. à soupe = 15 ml), `tsp` (c. à café = 5 ml), `pinch` (pincée), `to_taste` (selon le goût). Les quantités sont stockées telles que saisies et converties uniquement au moment de la comparaison (`src/domain/units.ts`).

Le régime et les allergènes d'une recette sont **déduits de ses ingrédients** (pas saisis à la main) pour éviter les incohérences.

## 5. Algorithme de correspondance frigo ↔ recettes

Fonction pure dans `src/domain/matching.ts`.

```
entrée : recettes, frigo (FridgeItem[]), préférences, nombre de portions voulu
pour chaque recette :
  1. FILTRE STRICT — exclure si :
     - un ingrédient (non optionnel ou optionnel non retirable) contient un allergène de l'utilisateur
     - un ingrédient est dans excludedIngredientIds
     - la recette est incompatible avec le régime
  2. ingrédients requis = ingrédients non optionnels, hors placard de base
  3. besoin(i) = quantité de la recette × (portions voulues / portions de la recette)
     stock(i)  = somme des FridgeItem de i ou d'un parent/enfant de i
                 (ex. « tomate cerise » dans le frigo satisfait « tomate »)
  4. statut(i) :
     - "missing"      si aucun stock
     - "enough"       si stock ≥ besoin, ou si la comparaison est impossible :
                      quantité du frigo inconnue, besoin en pincée / selon le goût,
                      unités non convertibles faute de gramsPerPiece / gramsPerMl
     - "insufficient" si stock < besoin
     ratio(i) = enough → 1 ; missing → 0 ; insufficient → stock / besoin
  5. couverture = moyenne des ratio(i) sur les requis
     manquants  = requis "missing" ; insuffisants = requis "insufficient"
  6. score =
       100 * couverture
     - 15 * |manquants|
     -  7 * |insuffisants|
     + 10 si cuisine ∈ favoriteCuisines
     +  5 par tag ∈ favoriteTags (plafonné)
     +  5 par ingrédient adoré présent
     +  8 par ingrédient du frigo qui périme dans ≤ 3 jours et utilisé
     -  10 si temps total > maxTotalMinutes
sortie : recettes classées, groupées en
  - faisable (tout "enough")
  - presque (1–2 ingrédients "missing" ou "insufficient", avec le détail :
    « il manque 2 œufs », « il manque le basilic »)
  - le reste (masqué ou en bas)
```

Les poids sont des constantes nommées et ajustables ; les tests unitaires doivent couvrir chaque règle (allergène exclu, parent/enfant, placard ignoré, bonus péremption, quantité insuffisante, recalcul par portions, conversions d'unités, quantité inconnue…).

## 6. Normalisation des ingrédients (point difficile)

Le matching ne fonctionne que si « tomates », « tomate », « tomates concassées » renvoient au même ingrédient.

- Maintenir une **base d'ingrédients canoniques** (`src/seed/ingredients.json`), ~300 entrées pour commencer, avec alias FR.
- L'utilisateur ne tape jamais de texte libre dans le frigo : il choisit dans l'autocomplétion (recherche insensible aux accents et au pluriel).
- Les recettes importées passent par une étape de rattachement de chaque ligne d'ingrédient à un `ingredientId` (script + vérification manuelle ; plus tard éventuellement assisté par IA).
- Hiérarchie simple (`parentId`) pour les variantes : lait → lait entier / demi-écrémé ; fromage râpé → emmental, gruyère.

## 7. Sources de recettes

| Source | Avantages | Limites |
|---|---|---|
| Seed maison (JSON, 50–100 recettes) | Contrôle total, en français, ingrédients déjà normalisés | Travail de saisie |
| TheMealDB (API gratuite) | ~300 recettes avec photos | En anglais, à traduire et normaliser |
| Spoonacular / Edamam | Gros catalogue, endpoint « par ingrédients » | Payant au-delà d'un quota, en anglais |
| Recettes des utilisateurs | Contenu communautaire | Modération nécessaire (post-MVP) |

⚠️ Ne pas scraper de sites de recettes (Marmiton, 750g…) : conditions d'utilisation et droits sur les photos et les textes.

**Recommandation MVP** : un seed maison de ~60 recettes françaises variées (couvrant tous les régimes), qui sert aussi de jeu de test pour le matching.

## 8. Écrans et navigation

Design « popote » (thème sombre, pastilles). Barre de navigation flottante en bas avec 3 onglets :

1. **Mon frigo** (`/`), écran d'accueil : pastilles d'aliments par rayon (compteur « 3/7 »), recherche d'aliment, panneau de quantité (+ / −, unité, date de péremption), bouton flottant « Trouver des recettes » avec le nombre de recettes trouvées.
2. **Recherche** (`/recherche`) : catalogue complet, recherche par titre ou ingrédient.
3. **Préférences** (`/preferences`) : régime, sans porc, allergies, cuisines préférées, goûts.

Écrans secondaires :
- **Résultats** (`/resultats`) : « N recettes avec ce que t'as. », filtres rapides (nombre d'ingrédients, régime, tri Pertinence / Plus rapide, type de plat), **Top 3** en grandes cartes, puis « Tu as tout ce qu'il faut », puis « Il te manque presque rien » (avec le détail de ce qui manque).
- **Fiche recette** (`/recette/:id`) : ingrédients marqués J'ai / Pas assez / Il manque / Placard / Facultatif, portions ajustables, étapes, « J'ai cuisiné cette recette ».

Parcours clé testé de bout en bout (`src/App.test.tsx`) : *ajout d'aliments avec quantités → « Trouver des recettes » → la recette faisable arrive en tête avec « Tu as tout » → fiche → « J'ai cuisiné » retire les quantités du frigo*.

## 9. Exigences non fonctionnelles

- **Performance** : le matching tourne côté client sur quelques centaines de recettes en < 50 ms.
- **Hors ligne** : le frigo et les recettes déjà consultées restent accessibles hors ligne (PWA).
- **Accessibilité** : contrastes AA, libellés sur les boutons-icônes, navigation clavier sur desktop.
- **Données personnelles** : le frigo et les préférences (dont les allergies, donnée de santé) appartiennent à l'utilisateur. Suppression de compte = suppression des données (RGPD). Row Level Security activée sur Supabase.
- **Sans compte** : l'app doit être utilisable sans inscription (stockage local), avec possibilité de créer un compte ensuite pour synchroniser.

## 10. Feuille de route

**Phase 0 — Socle**
- Initialiser Vite + React + TS + Tailwind + PWA, lint, Vitest.
- Seed : `ingredients.json` (~300) + `recipes.json` (~60).

**Phase 1 — MVP local (sans backend)**
- Catalogue + fiche recette.
- Frigo avec autocomplétion et quantités (+ / −), stocké en local.
- Comparaison des quantités dans le matching, recalcul par portions, déduction du frigo après « j'ai cuisiné ».
- Préférences + onboarding.
- Écran « Que puis-je cuisiner ? » avec l'algorithme de la section 5.

**Phase 2 — Comptes et synchro**
- Supabase : auth (e-mail / Google / Apple), tables, RLS, migration du stockage local vers le compte.
- Favoris, historique « cuisinée ».

**Phase 3 — Confort**
- Dates de péremption et notifications.
- Liste de courses.
- Mode cuisine.

**Phase 4 — Mobile natif et extension**
- Capacitor : build iOS/Android, publication sur les stores.
- Scan de code-barres (Open Food Facts), import de recettes, suggestions IA.

## 11. Questions ouvertes

- Nom définitif et identité visuelle de l'app.
- Monétisation éventuelle (aucune prévue au MVP).
- Langues : français uniquement au départ ; prévoir l'i18n (clés de traduction) dès le début pour ne pas bloquer l'anglais plus tard.
