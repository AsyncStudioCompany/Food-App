# Mijote — spécification produit

## 1. Vision

Mijote répond à la question « qu'est-ce que je cuisine avec ce que j'ai ? », souvent posée devant le frigo ouvert. L'app aide à ne rien jeter : elle fait passer en premier les recettes qui utilisent les aliments sur le point de périmer.

Public : 18–35 ans et familles. Ton familier (tutoiement), usage rapide.

## 2. Fonctionnalités

### Mon frigo (`/`)
- Aliments du catalogue regroupés par rayon (Crèmerie & frais, Légumes, Fruits, Épicerie), en pastilles. Une pastille active affiche la quantité ; un point orange signale un aliment qui périme dans 2 jours ou moins.
- Panneau de quantité : − / + (pas de 50 g, 0,25 kg, 5 cl, 0,25 L ou 1 pièce), unité, date de péremption (Aujourd'hui, Demain, 3 jours, 1 semaine, Pas de date), Retirer / Valider.
- Bouton collant « Trouver des recettes » avec le nombre d'idées.

### Recettes (`/recettes`)
- Pastilles de contexte (aliments, régime, allergies, cuisines) qui renvoient au frigo ou au profil.
- Top 3 en carrousel, puis « Tu as tout », puis « Il te manque presque rien » (2 manquants au plus).
- « Rien ne te tente ? » : tuile **Invente-moi une recette** (IA, voir §4).

### Fiche recette (`/recette/:id`)
- Photo, cœur, « + Liste ». Carte d'humeur animée (prête / il manque / en cuisson / c'est prêt).
- Portions ajustables : les quantités se recalculent.
- Ingrédients avec statut (dans ton frigo, pas assez, à acheter), étapes cochables illustrées.
- « J'ai cuisiné » retire les quantités du frigo et ouvre l'écran « Bon appétit ! », avec les aliments sauvés de la poubelle (ceux qui périmaient dans 3 jours ou moins).

### Chercher (`/chercher`)
Recherche par recette ou ingrédient, et filtres : Faisable maintenant, 20 min max, cuisines.

### Listes (`/listes`, `/listes/:id`)
« Coups de cœur » (rempli automatiquement par les recettes aimées), listes perso, et « Inventées pour toi » dès que l'IA a créé une recette. Le panneau « Ajouter à une liste » s'ouvre depuis la fiche.

### Profil (`/profil`)
Régime (Tout, Végétarien, Vegan, Sans porc), allergies (Gluten, Lactose, Arachides, Œufs, Fruits à coque), cuisines préférées, portions par défaut, et un interrupteur **Recettes inventées par l'IA** (coupé, la tuile « Invente-moi une recette » disparaît). Les changements s'appliquent immédiatement.

## 3. Classement

Pour chaque recette compatible avec le régime et les allergies, évaluée aux portions par défaut :

```
score = −100 × manquants + 20 si cuisine préférée + 15 × aliments qui périment dans ≤ 2 jours − minutes / 5
```

Un ingrédient est `ok` si la quantité du frigo couvre le besoin, `partial` s'il y en a trop peu, `missing` s'il n'y en a pas. Les deux derniers comptent comme manquants.

## 4. Recettes inventées par l'IA

- L'utilisateur peut écrire une envie (facultatif) ; l'app envoie son frigo (quantités, jours avant péremption), ses préférences et cette envie au serveur.
- Le serveur (`server/recipeAI.ts`) appelle l'API Claude avec une **sortie structurée** : nom, cuisine, temps, portions, ingrédients (identifiants du catalogue uniquement), étapes, mot-clé photo en anglais. Sel, poivre, huile, épices sont supposés au placard.
- Le serveur vérifie la recette (catalogue, doublons, régime, allergies) et redemande une fois en cas d'erreur. Le client revérifie avant d'enregistrer.
- La recette est gardée sur l'appareil, passe par le même classement que les autres, et reçoit une photo TheMealDB via son mot-clé. On peut la supprimer depuis sa fiche.
- Déploiement : `supabase functions deploy generate-recipe` puis `supabase secrets set ANTHROPIC_API_KEY=…`, et au build `VITE_RECIPE_AI_URL` + `VITE_SUPABASE_ANON_KEY`. Prévoir une limite d'appels par utilisateur avant l'ouverture au public.

## 5. Données

- Catalogue : `src/data/catalog.ts` (85 ingrédients, 112 recettes) :
  - 24 recettes maison (celles de la maquette et quelques ajouts) ;
  - 88 recettes importées de **TheMealDB** (`src/data/mealdb.ts`), avec leur vraie photo. `scripts/mealdb-candidates.mjs` télécharge l'API et liste les recettes dont tous les ingrédients (hors placard) existent dans le catalogue ; noms, étapes (au tutoiement) et quantités sont ensuite traduits et vérifiés à la main. Pour en ajouter : compléter la table `MAP` du script (et le catalogue), relancer, traduire.
- Les ingrédients comptés à la pièce sont arrondis au demi supérieur quand on change les portions (1,33 oignon → 1,5).
- Cuisines : Française, Italienne, Asiatique, Mexicaine, Indienne, Moyen-Orient (maquette), plus Espagnole, Européenne, Maghreb, Africaine, Caribéenne, Sud-américaine, Américaine pour les recettes importées.
- Chaque ingrédient a une unité de base, un rayon, une quantité proposée par défaut, et au besoin un type animal (porc, viande, poisson, laitier, œuf) et des allergènes. Régime et allergènes d'une recette se déduisent de ses ingrédients.
- Sur l'appareil (`localStorage`) : frigo (quantité, unité, date de péremption), préférences, favoris, listes, recettes inventées. Photos TheMealDB résolues et mises en cache.
- Photos : chaque recette du catalogue a une photo vérifiée à la main (celle de TheMealDB pour les recettes importées ; pour les recettes maison, le même plat sur TheMealDB ou une photo sous licence libre trouvée avec Openverse, créditée sur la fiche). Une recette de l'IA ne prend une photo TheMealDB que si le nom du plat contient tous les mots cherchés. Sinon, fond rayé : mieux vaut pas de photo qu'une photo d'un autre plat.

## 6. Suite possible

- Comptes et synchro (Supabase Auth + tables avec RLS) pour retrouver son frigo sur plusieurs appareils. Pas encore fait : aujourd'hui tout reste sur l'appareil.
- Liste de courses à partir des ingrédients manquants.
- Rappels de péremption (notifications).
- Emballage natif avec Capacitor.
