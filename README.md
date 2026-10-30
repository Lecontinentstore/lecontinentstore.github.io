# Site web Le Continent Store (v3, maillots en 3D)

Site vitrine statique (HTML, CSS, JS, sans outil de build). Les commandes passent par WhatsApp : la fiche produit prépare un message avec le maillot, la taille, le flocage et le total. Rien n'est payé en ligne.

## Ce qu'il fait
- **Accueil plein écran centré** : vidéo de fond, titre animé, nom de pays qui change dans ses couleurs. Texte : maillots d'Afrique, du monde et de clubs.
- **Maillots en vraie 3D** (Three.js) : un modèle 3D de maillot « fantôme » (`models/maillot.glb`) sur lequel on projette les vraies photos du maillot, à plat de face et de dos, tirées des vidéos. On le fait tourner au doigt, un toucher le retourne.
- **Showroom 3D** : 8 maillots les plus demandés, flèches et points pour passer de l'un à l'autre.
- **Barre fixe en bas** (Showroom, Flocage, WhatsApp), toujours visible.
- **Choix du pays** : toute la page prend les couleurs du pays choisi et le catalogue se filtre.
- **Catalogue** : vignettes 3D calculées dans le navigateur ; au survol (ordinateur), la vraie vidéo tourne dans la carte. Au clic, la fiche produit s'ouvre en 3D (bouton « Vidéo réelle » pour la vidéo), avec la taille, le flocage et la commande WhatsApp.
- **Flocage en 3D** : nom (12 lettres) et numéro jusqu'à 3 chiffres (ex. 237) imprimés en direct dans le dos du maillot 3D.
- Chiffres animés, boutique, réseaux, FAQ, curseur personnalisé, boutons aimantés, grain.

Bibliothèques (CDN) : Three.js 0.165.0 (3D), GSAP 3.12.5 + ScrollTrigger (animations), Lenis 1.1.13 (défilement fluide, ordinateur seulement). Polices Google : Archivo (largeur variable), Noto Color Emoji (drapeaux sur Windows). Si les CDN ne répondent pas, le site reste lisible sans animations.

## Fichiers
- `index.html`, `style.css`, `app.js` : la page. `app.js` contient aussi les **couleurs officielles par pays** (`COULEURS`) et la liste des maillots du showroom (`TOP`).
- `produits.js` : **la liste des maillots** (seul fichier à modifier pour le catalogue).
- `jersey3d.js` : la 3D (chargement du modèle, projection des photos, flocage, visionneuse, vignettes).
- `models/maillot.glb` : modèle 3D d'après « FC Porto Concept Shirt » de Gabrielelel (Sketchfab), **licence CC BY 4.0** : le crédit en bas de page est obligatoire, ne pas l'enlever (texte dans `models/LICENCE-maillot.txt`).
- `img/3d/<nom>-face.webp` et `<nom>-dos.webp` : photos à plat, détourées, col en haut, projetées sur le modèle.
- `img/detoures/*.webp` : maillots détourés (ancienne v2, secours).
- `img/maillots/*.webp` : photos 4:5 (secours).
- `video/*.mp4` : clips de 7 s sans son + `hero.mp4`. **Non commités** (règle du dépôt) : les recréer avec le script ci-dessous.

## Ajouter un maillot
1. Mettre sa vidéo TikTok dans `exports/insta/` (`scripts/insta_dl.ps1`).
2. `python clients/continent-store/scripts/site_photos.py` (photo de secours) puis `python clients/continent-store/scripts/site_media.py` (détourage + clip). Options : `--detourage-seul`, `--sans-detourage`.
3. Textures 3D : `python clients/continent-store/scripts/site_3d_extraire.py <nom>` prend l'image à plat de face (55-78 % de la vidéo) et de dos (80-99 %), la détoure et la redresse. Vérifier la planche `tmp/3d/plat_1.jpg`. Si c'est raté (maillot blanc, image floue) : choisir les bons moments avec `site_3d_planches.py`, les noter dans `tmp/3d/reglages.json` (`{"nom": {"face": 0.62, "dos": 0.9}}`) et relancer avec `MODELE=birefnet-general` (plus précis, ~5 min par image).
4. Ajouter une ligne dans `produits.js`.
5. Changer le numéro de version `?v=` des fichiers dans `index.html` pour forcer la mise à jour chez les visiteurs.

Le détourage utilise `rembg` (modèle BiRefNet, téléchargé au premier lancement, environ 1 Go).

## Voir le site en local
`python -m http.server 8765 --directory clients/continent-store/site-web` puis ouvrir http://localhost:8765

## Mettre en ligne (à décider)
Le dossier entier (vidéos comprises, ~37 Mo) s'héberge gratuitement sur Netlify ou Cloudflare Pages, avec un nom de domaine (~10 €/an).

## À compléter
- Le vrai logo (le cercle noir et or actuel est une version simplifiée).
- Les maillots de la liste « Aussi en boutique ».
- Frais, délais de livraison et moyens de paiement.

## En ligne (public)
**https://lecontinentstore.github.io/** : hébergé gratuitement sur GitHub Pages, dans l'organisation GitHub « Lecontinentstore » (rattachée au compte de Patrick).
Copie du dossier : `C:\Users\User\Documents\lecontinentstore-site` (dépôt `Lecontinentstore/lecontinentstore.github.io`).
Pour mettre à jour : recopier `site-web/` dans ce dossier (sans `_proto.html`), puis `git add -A`, `git commit`, `git push`. Le site se met à jour en ~1 minute.
