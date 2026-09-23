#!/bin/bash
# Double-clique sur ce fichier dans le Finder pour lancer Mijote sur ton Mac.
# Ferme la fenêtre du Terminal (ou Ctrl+C) pour arrêter l'app.
cd "$(dirname "$0")" || exit 1

if ! command -v npm >/dev/null 2>&1; then
  echo "Il faut d'abord installer Node.js : https://nodejs.org (version LTS), puis relancer."
  read -r -p "Appuie sur Entrée pour fermer."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Première fois : installation des dépendances…"
  npm install || { read -r -p "L'installation a échoué. Entrée pour fermer."; exit 1; }
fi

echo "Préparation de Mijote…"
npm run build >/dev/null || { read -r -p "La préparation a échoué. Entrée pour fermer."; exit 1; }

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
echo
echo "Mijote tourne !"
echo "  Sur ce Mac     : http://localhost:4173"
[ -n "$IP" ] && echo "  Sur ton iPhone : http://$IP:4173  (même Wi-Fi)"
echo "Laisse cette fenêtre ouverte tant que tu utilises l'app."
echo

(sleep 2 && open "http://localhost:4173") &
exec npx vite preview --host --port 4173 --strictPort
