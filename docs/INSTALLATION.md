# Utiliser Mijote sur ton Mac (et ton iPhone)

Mijote tourne en local sur ton Mac : rien n'est mis en ligne. L'iPhone peut s'en servir sur le même Wi-Fi tant que le Mac l'a lancée.

## Première fois

1. **Installe Node.js** : télécharge la version « LTS » sur [nodejs.org](https://nodejs.org) et installe-la.
2. **Récupère le projet** : dans le Terminal, `git clone https://github.com/AsyncStudioCompany/Food-App.git`.
   (Si tu télécharges plutôt le ZIP depuis GitHub, macOS peut bloquer le lanceur la première fois : clic droit sur `Mijote.command` → **Ouvrir** → **Ouvrir**.)
3. **Pour l'IA** (facultatif) : copie `.env.example` en `.env.local` et renseigne ta clé `ANTHROPIC_API_KEY` (à créer sur [console.anthropic.com](https://console.anthropic.com)). Sans clé, coupe « Recettes inventées par l'IA » dans le Profil : tout le reste marche.

## Lancer Mijote

**Double-clique sur `Mijote.command`** dans le dossier du projet.

- La première fois, il installe ce qu'il faut (1 à 2 minutes).
- Il ouvre ensuite Mijote dans ton navigateur, sur `http://localhost:4173`.
- La fenêtre du Terminal affiche aussi l'adresse pour l'iPhone, du type `http://192.168.x.x:4173`.
- **Laisse cette fenêtre ouverte** pendant que tu utilises l'app. Ferme-la pour arrêter Mijote.

Depuis un terminal, `npm start` fait la même chose (sans ouvrir le navigateur).

## En faire une app sur le Mac

Une fois Mijote ouverte sur `http://localhost:4173` :

- **Safari** (macOS Sonoma ou plus récent) : **Fichier → Ajouter au Dock**.
- **Chrome** : icône d'installation à droite de la barre d'adresse.

Mijote apparaît dans le Dock avec son icône et s'ouvre dans sa propre fenêtre. Après une première visite, elle se rouvre même si `Mijote.command` n'est pas lancé (le frigo, les recettes et les photos déjà vues sont gardés hors ligne). Pour l'IA et les nouvelles photos, relance `Mijote.command`.

## Sur l'iPhone (même Wi-Fi)

1. Lance `Mijote.command` sur le Mac.
2. Sur l'iPhone, ouvre dans **Safari** l'adresse affichée par le Terminal (`http://192.168.x.x:4173`).
3. **Partager → Sur l'écran d'accueil** pour avoir l'icône.

Limites du mode local sur l'iPhone : le Mac doit être allumé avec Mijote lancée, et l'iPhone n'a pas de mode hors ligne (iOS l'exige en HTTPS).

## À savoir

- **Chaque appareil et chaque navigateur garde ses propres données** (frigo, favoris, listes, préférences). Le frigo de l'iPhone n'est pas celui du Mac.
- Pour récupérer une nouvelle version : `git pull` dans le dossier, puis relance `Mijote.command`.

## Plus tard : en ligne

Rien n'est hébergé pour l'instant. Quand tu voudras l'app sans laisser le Mac allumé (avec le mode hors ligne sur l'iPhone), il suffira d'un hébergement de site statique en HTTPS, plus un endroit où faire tourner l'IA. La fonction Supabase `supabase/functions/generate-recipe` est déjà prête pour l'IA, et Supabase servira aussi pour les comptes.

Une vraie app de l'App Store reste possible avec Capacitor : il faudra Xcode et un compte Apple Developer (99 €/an).
