# Mijote — spécification produit

## 1. Vision

Mijote répond à la question « qu'est-ce que je cuisine avec ce que j'ai ? », souvent posée devant le frigo ouvert. L'app aide à ne rien jeter : elle fait passer en premier les recettes qui utilisent les aliments sur le point de périmer.

Public : 18–35 ans et familles. Ton familier (tutoiement), usage rapide.

## 2. Fonctionnalités

### Accueil et première configuration
- Sans être connecté, on ne voit que l'accueil (« Cuisine avec ce que t'as. ») : **Créer mon compte** ou **J'ai déjà un compte**. Sans serveur de comptes configuré, un bouton **Commencer** crée un profil local.
- Après l'inscription, 4 étapes : régime et allergies, **objectif** (Équilibré, Prise de masse, Protéines, Perte de poids), cuisines et portions, puis les aliments qu'on a chez soi. Chaque étape peut être passée ; tout se modifie ensuite dans le Profil et le Frigo.

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

L'objectif ajoute un bonus selon la nutrition estimée par portion (`src/domain/nutrition.ts`, valeurs par ingrédient dans `src/data/nutrition.ts`, huile et épices non comptées) : au plus ±35 points, moins qu'un ingrédient manquant, donc il réordonne sans jamais masquer. La fiche affiche kcal, protéines, glucides et lipides par portion ; les listes affichent les protéines (prise de masse, protéines) ou les kcal (perte de poids).

Un ingrédient est `ok` si la quantité du frigo couvre le besoin, `partial` s'il y en a trop peu, `missing` s'il n'y en a pas. Les deux derniers comptent comme manquants.

## 4. Recettes inventées par l'IA

- L'utilisateur peut écrire une envie (facultatif) ; l'app envoie son frigo (quantités, jours avant péremption), ses préférences et cette envie au serveur.
- Le serveur (`server/recipeAI.ts`) appelle l'API Claude avec une **sortie structurée** : nom, cuisine, temps, portions, ingrédients (identifiants du catalogue uniquement), étapes, mot-clé photo en anglais. Sel, poivre, huile, épices sont supposés au placard.
- Le serveur vérifie la recette (catalogue, doublons, régime, allergies) et redemande une fois en cas d'erreur. Le client revérifie avant d'enregistrer.
- La recette est gardée sur l'appareil, passe par le même classement que les autres, et reçoit une photo TheMealDB via son mot-clé. On peut la supprimer depuis sa fiche.
- Déploiement : `supabase functions deploy generate-recipe` puis `supabase secrets set ANTHROPIC_API_KEY=…`, et au build `VITE_RECIPE_AI_URL` + `VITE_SUPABASE_ANON_KEY`. Prévoir une limite d'appels par utilisateur avant l'ouverture au public.

## 5. Où trouver ce qui manque

- Sur la fiche, sous « Manque : … », le lien **« Où les trouver ? »** ouvre un panneau : pastilles des ingrédients manquants (cochées par défaut), tri « Le plus proche » / « Le moins cher », une ligne par magasin (nom, distance, prix estimé du panier ou « prix inconnu », nombre de prix connus). Un appui ouvre l'itinéraire dans Plans (`https://maps.apple.com/?daddr=lat,lon&q=Nom`).
- **Adresse** (Profil, « Ton adresse ») : facultative. Saisie avec autocomplétion par l'API Adresse, appelée depuis l'appareil (l'ancien `api-adresse.data.gouv.fr` a migré vers la Géoplateforme de l'IGN, `data.geopf.fr/geocodage`, même API), ou « Utiliser ma position » (le navigateur ne la donne qu'en https ou sur localhost). Les coordonnées sont dans `prefs.location`, donc chiffrées comme le reste, sur l'appareil et dans le compte. Sans adresse, le panneau propose de la renseigner.
- **Serveur** : `POST /api/stores` (`server/stores.ts`, même modèle que l'IA : serveur Vite local, fonction Vercel `server/vercelStores.ts`, fonction Supabase `supabase/functions/stores`). Il reçoit une position arrondie à ~100 m et les identifiants catalogue des ingrédients manquants (12 au plus).
  - Magasins : supermarchés, supérettes, épiceries et primeurs à moins de 3 km, via OpenStreetMap (Overpass : le serveur principal, puis s'il échoue le principal et deux miroirs en parallèle ; une réponse « 200 mais abandonnée » d'Overpass compte comme un échec, jamais comme « aucun magasin », et une liste vide n'est gardée que 10 min) : nom, enseigne, coordonnées, horaires. Les 30 plus proches.
  - Prix : Open Prices, en euros. Correspondance ingrédient → catégorie Open Food Facts dans `src/data/offCategories.ts` (catégorie de produit brut au kilo ou à la pièce, ou catégorie de produit emballé ; chaque étiquette vérifiée sur Open Prices). Pour chaque ingrédient, relevés autour de la position (5 km) et relevés récents partout, ramenés en €/g (poids d'une pièce pris dans `src/data/nutrition.ts`). Un magasin prend la médiane de ses propres relevés, sinon celle de son enseigne en France.
  - Cache mémoire (magasins 24 h, prix 6 à 12 h), requêtes identiques partagées, budget de 60 appels par minute vers les services ouverts (au-delà : 429), User-Agent explicite, aucune clé.
- Le prix affiché est celui des quantités qui manquent (pas d'un paquet entier), marqué « ≈ ». Les relevés Open Prices sont partiels : « Le moins cher » ne compare que les prix connus (d'abord les magasins qui connaissent le plus de prix, puis le moins cher), et le panneau le dit.
- Hors ligne : le dernier résultat pour cet endroit est affiché depuis un cache chiffré sur l'appareil (`saveSide` / `loadSide` de `src/state/persist.ts`, jamais synchronisé).
- Logique pure et testée dans `src/domain/stores.ts` : distance, lecture d'Overpass et d'Open Prices, conversion des prix, panier, tri.

## 6. Données

- Catalogue : `src/data/catalog.ts` (116 ingrédients, 357 recettes) :
  - 24 recettes maison (celles de la maquette et quelques ajouts) ;
  - 333 recettes importées de **TheMealDB** (`src/data/mealdb.ts` pour les 88 premières, `src/data/mealdb2.ts` pour les 245 suivantes), avec leur vraie photo : plats, soupes, salades, entrées, accompagnements, petits-déj et desserts de 13 cuisines. `scripts/mealdb-candidates.mjs` télécharge l'API et liste les recettes dont tous les ingrédients (hors placard) existent dans le catalogue ; noms, étapes (au tutoiement) et quantités sont ensuite traduits et vérifiés à la main. Pour en ajouter : compléter la table `MAP` du script (et le catalogue), relancer, traduire.
- Les ingrédients comptés à la pièce sont arrondis au demi supérieur quand on change les portions (1,33 oignon → 1,5).
- Cuisines : Française, Italienne, Asiatique, Mexicaine, Indienne, Moyen-Orient (maquette), plus Espagnole, Européenne, Maghreb, Africaine, Caribéenne, Sud-américaine, Américaine pour les recettes importées.
- Chaque ingrédient a une unité de base, un rayon, une quantité proposée par défaut, et au besoin un type animal (porc, viande, poisson, laitier, œuf) et des allergènes. Régime et allergènes d'une recette se déduisent de ses ingrédients.
- Sur l'appareil (`localStorage`, chiffré) : frigo (quantité, unité, date de péremption), préférences (dont l'adresse), favoris, listes, recettes inventées, derniers magasins trouvés. Photos TheMealDB résolues et mises en cache.
- Photos : chaque recette du catalogue a une photo vérifiée à la main (celle de TheMealDB pour les recettes importées ; pour les recettes maison, le même plat sur TheMealDB ou une photo sous licence libre trouvée avec Openverse, créditée sur la fiche). Une recette de l'IA ne prend une photo TheMealDB que si le nom du plat contient tous les mots cherchés. Sinon, fond rayé : mieux vaut pas de photo qu'une photo d'un autre plat.

## 7. Comptes et chiffrement

- Comptes Supabase (e-mail + mot de passe), activés par `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. Sans eux, l'app fonctionne sans compte.
- **Chiffrement de bout en bout** (`src/crypto/vault.ts`) : PBKDF2-SHA256 (600 000 itérations) puis HKDF dérivent du mot de passe un mot de passe de connexion (seul envoyé à Supabase) et une clé qui emballe une clé de données aléatoire (AES-GCM 256). Les données sauvegardées sont chiffrées avec cette clé ; la table `vaults` (une ligne par utilisateur, RLS) ne contient que du chiffré.
- Sur l'appareil, les données sont chiffrées avec une clé locale non exportable gardée dans IndexedDB (`src/state/persist.ts`) ; la clé de données du compte y est aussi gardée, non exportable, pour rouvrir l'app sans mot de passe.
- Synchro (`src/account/account.ts`) : envoi 1,5 s après chaque changement, récupération au démarrage et au retour sur l'app ; la dernière écriture gagne. Première connexion d'un appareil : les données du compte remplacent celles de l'appareil (un compte neuf reprend celles de l'appareil).
- Déconnexion : les données de l'appareil sont effacées (elles restent dans le compte). « Supprimer mes données » efface la ligne du serveur.
- Limites : mot de passe oublié = données perdues ; pas encore de changement de mot de passe ni de suppression de l'utilisateur Supabase lui-même (à faire depuis le tableau de bord).

## 8. Suite possible

- Changement de mot de passe (réemballer la clé de données) et suppression complète du compte.
- Liste de courses à partir des ingrédients manquants.
- Rappels de péremption (notifications).
- Emballage natif avec Capacitor.
