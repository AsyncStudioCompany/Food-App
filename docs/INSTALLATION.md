# Installer Mijote sur iPhone et Mac

Mijote est une app web installable (PWA). On la met en ligne une fois, puis on l'ajoute à l'écran d'accueil de l'iPhone et au Dock du Mac. Elle s'ouvre alors en plein écran avec son icône, comme une app, et le frigo marche hors ligne.

## 1. Mettre l'app en ligne (Netlify, gratuit)

1. Fusionne la branche de travail dans `main` sur GitHub (ou choisis directement la branche à l'étape 3).
2. Va sur [netlify.com](https://www.netlify.com) et connecte-toi **avec ton compte GitHub**.
3. **Add new site → Import an existing project → GitHub**, puis choisis le dépôt `Food-App` et la branche.
   Les réglages de build sont lus dans `netlify.toml` : il n'y a rien à remplir. Clique sur **Deploy**.
4. Au bout d'une minute, tu obtiens une adresse du type `https://mijote-xxxx.netlify.app`. Tu peux la renommer dans **Site configuration → Change site name**.

### Activer l'IA (facultatif)

1. Crée une clé sur [console.anthropic.com](https://console.anthropic.com) → **API Keys**. Chaque recette inventée coûte quelques centimes.
2. Dans Netlify : **Site configuration → Environment variables → Add a variable** : `ANTHROPIC_API_KEY` = ta clé.
3. **Deploys → Trigger deploy** pour que la clé soit prise en compte.

Sans clé, tout le reste marche : coupe simplement « Recettes inventées par l'IA » dans le Profil.

## 2. Sur l'iPhone

1. Ouvre l'adresse du site dans **Safari**.
2. Touche le bouton **Partager** (carré avec une flèche), puis **Sur l'écran d'accueil**, puis **Ajouter**.
3. Lance Mijote depuis son icône : elle s'ouvre en plein écran, sans barre d'adresse.

## 3. Sur le Mac

- **Safari** (macOS Sonoma ou plus récent) : ouvre l'adresse, puis **Fichier → Ajouter au Dock**.
- **Chrome** : ouvre l'adresse, puis clique sur l'icône d'installation à droite de la barre d'adresse.

L'app apparaît dans le Dock et le Launchpad et s'ouvre dans sa propre fenêtre.

## À savoir

- **Chaque appareil garde ses propres données** (frigo, favoris, listes, préférences). Pour avoir le même frigo sur l'iPhone et le Mac, il faudra ajouter les comptes avec synchro (Supabase).
- Les mises à jour arrivent seules : à chaque déploiement sur Netlify, l'app se met à jour à la prochaine ouverture.
- Sur iPhone, les données d'une app installée sur l'écran d'accueil sont séparées de celles de Safari.

## Lancer l'app en local sur le Mac (développement)

1. Installe [Node.js](https://nodejs.org) 22 ou plus récent.
2. Dans le dossier du projet : `npm install`.
3. Pour l'IA : copie `.env.example` en `.env.local` et renseigne `ANTHROPIC_API_KEY`.
4. `npm run dev`, puis ouvre l'adresse affichée (`http://localhost:5173`).
5. Pour l'essayer sur l'iPhone sur le même Wi-Fi : `npm run dev -- --host`, puis ouvre l'adresse « Network » dans Safari. L'installation hors ligne demande en revanche le site en HTTPS (étape 1).

## Et une vraie app de l'App Store ?

C'est possible plus tard avec Capacitor, qui emballe le même code en app iOS et macOS. Il faut alors Xcode sur le Mac et un compte Apple Developer (99 €/an). Avec un compte Apple gratuit, l'app installée depuis Xcode expire au bout de 7 jours.
