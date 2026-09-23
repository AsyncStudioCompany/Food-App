# Handoff : Mijote — direction 2a « Soir »

## Overview
Mijote est une app mobile de recettes anti-gaspillage, en français et sur un ton familier (tutoiement). L'utilisateur saisit le contenu de son frigo avec les quantités et les dates de péremption. L'app lui propose d'abord les recettes faisables tout de suite, puis celles où il manque 1 ou 2 ingrédients. Elle respecte son régime et ses allergies, et met en avant ses cuisines préférées. Elle permet aussi d'aimer des recettes et de les ranger dans des listes.

Public : 18–35 ans et familles. Usage rapide, souvent devant le frigo ouvert.

## About the Design Files
Les fichiers de ce dossier sont des **références de design en HTML** : des prototypes qui montrent le rendu et le comportement attendus. Ce n'est **pas du code de production à copier tel quel**. Il faut **recréer ces écrans dans l'environnement du projet cible** (React Native, SwiftUI, Flutter, React web…) en suivant ses conventions. S'il n'existe pas encore de codebase, choisis le framework le plus adapté (recommandé : React Native + Expo, ou une PWA React).

- `Mijote 2a.dc.html` : ouvre ce fichier dans un navigateur pour voir le prototype 2a seul, en entier.
- `MijoteApp.dc.html` : toute l'UI, la logique et les données de démo. Le composant est paramétré par `theme` ; **seul le thème `soir` concerne ce handoff** (`jour` en est la variante claire, accessible via le bouton « Mode clair » sous le téléphone). Les données (catalogue `CAT`, recettes `REC`, conversions `F`/`STEP`) et l'algorithme de matching sont dans le bloc `<script>`, à partir de `const STEP`.
- `support.js` : runtime qui permet d'ouvrir les prototypes. À ne pas porter.

## Fidelity
**High-fidelity.** Les couleurs, la typographie, les rayons, les espacements, les textes et les interactions sont définitifs. Reproduis-les fidèlement. Seules les photos sont des stand-ins (voir Assets).

## Design Tokens (thème `soir`)
Couleurs :
- bg `#121110` · surface `#1d1b19` · soft `#2a2724` · line `#2e2b28` · frame (bezel) `#050505`
- ink `#f5f2ec` · muted `#9a948a`
- accent (CTA) `oklch(0.72 0.16 40)` ≈ `#e8845a` · accentInk `#121110`
- ok `oklch(0.83 0.15 138)` · okSoft `oklch(0.32 0.06 138)` · okInk `oklch(0.86 0.14 138)`
- warn `oklch(0.8 0.14 75)` · warnSoft `oklch(0.33 0.06 75)` · warnInk `oklch(0.86 0.12 78)`
- miss `oklch(0.76 0.14 30)` · missSoft `oklch(0.32 0.06 30)`
- sur les photos : cardOk `oklch(0.86 0.15 138)`, cardMiss `oklch(0.8 0.13 32)`
- barre d'onglets (verre) `rgba(33,31,28,.82)` + `backdrop-filter: blur`, onglet actif bg `#f5f2ec` / texte `#121110`
- scrim des photos : `linear-gradient(180deg, rgba(12,11,10,.25) 0%, rgba(12,11,10,0) 25%, rgba(12,11,10,0) 42%, rgba(12,11,10,.9) 100%)`
- cœur actif `oklch(0.63 0.2 25)` ; inactif = muted à 40–50 % d'opacité (blanc à 55 % sur photo)
- pastille sélectionnée : bg `#f5f2ec`, texte `#121110` ; non sélectionnée : bg `#1d1b19`, bordure `#2e2b28`

Typographie : **Geist** (400/500/600/700) pour tout, **Geist Mono** pour les compteurs et les labels techniques.
- Titre d'écran : 600, 34px, line-height 1.05, letter-spacing −0.035em. La 2ᵉ moitié du titre est en couleur muted (ex. « Tu as tout » + « pour 7 recettes »).
- Titre de carte photo : 600, 26–28px, −0.035em
- Titre de section : 600, 22px
- Corps : 15px/1.5 · méta : 13–14px muted · badges : 700, 11px
- Barre d'onglets : 12.5px

Rayons : grandes cartes 28px · cartes et lignes 16px · vignettes 12px · pastilles et CTA 999px · bottom sheet 28px (haut uniquement).
Espacement : marge d'écran 20px · gap des listes 10px · gap des carrousels 12px · gap des pastilles 8px.
Ombres : aucune (pour ce thème, la profondeur vient des surfaces).
Cibles tactiles : 40px minimum (boutons ronds), CTA 52–54px.

## Screens / Views
Frame de référence : 390 × 844, status bar de 44px. Toutes les zones scrollent verticalement ; l'overflow horizontal est masqué (sauf dans les carrousels).

### 1. Mon frigo
- Titre « Mon frigo », compteur mono « 5/18 » (aliments ajoutés / catalogue), recherche.
- Aliments regroupés par rayon (Crèmerie & frais, Légumes, Fruits, Épicerie), en pastilles qui passent à la ligne. Une pastille active affiche sa quantité en sous-texte, et un point warn si l'aliment périme dans 2 jours ou moins.
- Un tap ouvre le **panneau de quantité** (bottom sheet) : boutons − et + (pas selon l'unité : 50 g, 0,25 kg, 5 cl, 0,25 L, 1 pièce), choix d'unité, péremption en pastilles (Aujourd'hui, 2 j, 3 j, 1 sem, Pas de date), bouton Retirer / Valider.
- En bas, un CTA collant « Trouver des recettes » (accent) avec le nombre de recettes faisables.

### 2. Résultats
- En-tête avec bouton retour rond de 40px ; titre en deux tons ; rangée de pastilles de contexte qui défile horizontalement (régime, cuisines).
- « Top 3 » : **carrousel horizontal**. Cartes de 280 × 392, rayon 28, photo plein cadre avec scrim, numéro, nom, méta, statut (cardOk « Tu as tout » ou cardMiss « Il manque X »), et un cœur dans un rond flouté de 38px. Accroche (snap) sur le début de chaque carte ; marge intérieure de 20px.
- « Tu as tout » puis « Il te manque presque rien » : lignes avec une vignette de 62px, le nom, la méta, un statut coloré et un cœur de 40px à droite.
- Classement : les recettes faisables d'abord, puis le nombre d'ingrédients manquants (≤ 2), les cuisines préférées, et enfin l'utilisation des aliments qui périment bientôt. Les recettes incompatibles avec le régime ou les allergies sont exclues.

### 3. Fiche recette
- Photo héro de 290px. Boutons flottants : « ← Retour » (pilule surface), cœur de 40px et « + Liste ».
- Nom, méta (temps · cuisine · portions).
- **Carte d'humeur** (rayon 28, fond selon l'état) : une illustration animée de 104 × 92 à gauche, un titre en 21px et un texte en 13.5px. États :
  - `ready` (fond okSoft) : poêle avec un œuf qui grésille et de la vapeur — « Tout est dans ton frigo »
  - `missing` (missSoft) : sac de courses avec un badge du nombre manquant qui pulse — « Il te manque N trucs »
  - `cooking` (warnSoft, dès 1 étape cochée) : marmite, bulles, flammes, barre de progression — « Étape X sur Y »
  - `done` (okSoft, toutes les étapes cochées) : assiette et étoiles — « C'est prêt ! »
- Portions − / + : les quantités se recalculent.
- Ingrédients avec un statut par ligne : ok / partial (« il t'en faut encore… ») / missing.
- Étapes : cartes cochables. Chaque carte a une **illustration animée de 68 × 60** choisie d'après le texte de l'étape (fonction `stepKind`) : `cut` couteau sur une planche, `pan` poêle, `pot` marmite, `oven` four qui rougeoie, `mix` bol et cuillère, `rest` minuteur, `plate` assiette. Une étape cochée passe en texte barré et son illustration à 45 % d'opacité.
- CTA « J'ai cuisiné » : décompte les quantités utilisées du frigo et ouvre l'écran **« Bon appétit ! »** (plein écran, animation `rise` de .45s) avec l'assiette en ×2, le nombre d'ingrédients utilisés, une pastille « Sauvés de la poubelle : … » (aliments qui périmaient dans 3 jours ou moins) et le bouton « Retour aux recettes ».

### 4. Chercher
Recherche texte (recettes et ingrédients), filtres en pastilles qui défilent horizontalement (Faisable maintenant, < 20 min, cuisines), et liste de résultats au même format que les lignes.

### 5. Listes
- Vue d'ensemble : grille de 2 colonnes. Chaque carte est une mosaïque carrée de 2×2 vignettes (rayon 28), avec le nom et « N recettes ». La première carte, « Coups de cœur », se remplit automatiquement avec les recettes aimées et porte un badge cœur. Une tuile en pointillés « + Nouvelle liste » ouvre un champ et un bouton « Créer ».
- Détail : « ← Mes listes », titre, puis les lignes de recettes. État vide : « Rien ici pour l'instant. Touche le cœur ou « + Liste » sur une recette. »
- Le **bottom sheet « Ajouter à une liste »**, ouvert depuis la fiche, affiche une ligne par liste (vignette, nom, compte, case ronde cochée en accent), un champ pour créer une liste avec la recette déjà dedans, et le bouton « Terminé ».

### 6. Profil / Préférences
Régime (Aucun, Végétarien, Vegan, Sans porc), allergies (Gluten, Lactose, Arachides, Œufs, Fruits à coque…), cuisines préférées et portions par défaut. Tout est en pastilles et s'applique immédiatement au classement.

### Navigation
Barre d'onglets en verre, flottante, avec 5 onglets : Frigo · Recettes · Chercher · Listes · Profil. L'onglet actif est une pilule claire. Elle est masquée sur la fiche recette et pendant les bottom sheets.

## Interactions & Behavior
- Bottom sheets : scrim `rgba(10,8,6,.42)` ; un tap sur le scrim ferme le sheet.
- Carrousels et rangées de pastilles : défilement horizontal natif, `overscroll-behavior-x: contain`, scrollbar masquée. Sur desktop/web, prévoir le glisser à la souris avec accroche à la carte la plus proche, et un tap ignoré après un glissement.
- Toast en bas de l'écran après certaines actions.
- Animations (boucles infinies ; à désactiver si `prefers-reduced-motion`) :
  - `steam` 2.2–2.4s : opacité 0→.9→0 et translateY 8→−16px, décalée de .5s par filet
  - `bob` 1.2–2.6s : scale 1↔1.05
  - `pop` 1.8s : scale 1↔1.18
  - `flicker` .8s en alternance : scaleY .8↔1.2
  - `bubble` 1.5s : montée de 18px en fondu
  - `twinkle` 1.6s : scale et opacité
  - `chop` .9s : translateY 7px + rotation −6°
  - `stir` 1.3s en alternance : rotation ±18°
  - `spin` 3s linéaire
  - `glow` 1.6s en alternance
- Barre de progression de la carte d'humeur : transition `width .4s ease`.

## State Management
- `fridge` : `{ [ingredientId]: { qty, unit, exp /* jours ou null */ } }`
- `prefs` : `{ diet, allergies[], cuisines[], portions }`
- `liked` : `{ [recipeId]: bool }` ; `lists` : `[{ id, n, ids[] }]`
- UI : `screen`, `recipe`, `portions`, `done` (étapes cochées), `sheet`, `listSheet`, `openList`, `celebrate`, `toast`, la recherche `sq` et les filtres `sf`
- Données dérivées : `evalR(recipe, portions)` renvoie le statut de chaque ingrédient (quantités converties via la table `F`), les manquants et un score.
- À persister en production : le frigo, les préférences, les favoris et les listes.

## Assets
- Les photos de recettes sont des **stand-ins** chargés à l'exécution depuis TheMealDB (API publique) : ce sont des plats proches, pas exacts. À remplacer par de vraies photos. Si la photo manque, le fond de repli est un motif rayé (`s1 #2b2723` / `s2 #24211e`).
- Les illustrations (humeur, étapes, célébration) sont construites en formes CSS dans `mkIllu` et `mkStepIllu`. À reproduire en Lottie/Rive ou en SVG animé avec la même palette : poêle `#050404`, jaune d'œuf `oklch(0.82 0.16 80)`, tomate `oklch(0.63 0.19 32)`, feuille `oklch(0.62 0.14 140)`, bois `oklch(0.72 0.08 65)`, flamme `oklch(0.76 0.17 60)`.
- Polices : Geist et Geist Mono (Google Fonts / Vercel, licence OFL).
- Aucune icône de bibliothèque : cœurs, coches et « + » sont dessinés en CSS ou en texte.

## Files
- `Mijote 2a.dc.html` : le prototype 2a seul, à ouvrir dans un navigateur
- `MijoteApp.dc.html` : template, logique, données et thèmes
- `support.js` : runtime des prototypes (à ne pas porter)
