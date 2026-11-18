# 🎴 Holo Card Studio

Petit outil local qui reprend les **effets holographiques 3D** du repo
[simeydotme/pokemon-cards-css](https://github.com/simeydotme/pokemon-cards-css) :
upload ton propre PNG de carte, choisis un effet, et bouge la souris (ou le
doigt / le gyroscope) pour obtenir le rendu 3D.

## Lancer

Aucune installation, aucun build :

- **Double-clic sur `index.html`** (ça marche en `file://`), ou
- `python3 -m http.server` dans ce dossier puis ouvrir <http://localhost:8000>

## Utilisation

1. **Importer un PNG** (bouton ou glisser-déposer sur la carte). Par défaut une
   carte exemple est chargée.
2. **Choisir un effet** : basique, holo rare, reverse, cosmos/galaxy, amazing,
   radiant, rainbow, rainbow alt, secret rare (or), V, V full art, VMAX, VSTAR,
   shiny V, shiny VMAX, trainer gallery.
3. **Réglages** : rotation max, intensité de l'éclat, taille de la carte,
   couleur de la lueur.
4. **Démo auto** : la carte tourne toute seule (s'arrête au premier mouvement
   de souris).
5. **Télécharger le rendu (PNG)** : fige une pose et capture la carte via
   html2canvas (nécessite internet ; rendu approximatif car les `mix-blend-mode`
   ne sont pas reproduits — sinon, une capture d'écran fait l'affaire).

## Structure

```
index.html          page (UI en français)
css/cards.css       effets holo (adapté du repo, CSS vanilla)
css/ui.css          habillage de l'interface
js/app.js           tilt 3D (springs), upload, contrôles, export
img/                textures générées localement + carte exemple
tools/make_textures.py  régénère les textures (nécessite Pillow)
```

## Crédits

Effets CSS adaptés de [pokemon-cards-css](https://github.com/simeydotme/pokemon-cards-css)
(GPL-3.0, © simeydotme). Les textures d'origine (glitter, cosmos, foils…) sont
remplacées ici par des approximations générées localement avec Pillow
(`tools/make_textures.py`).
