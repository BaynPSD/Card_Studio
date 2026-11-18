# 🎴 Holo Card Studio

Outil 100 % local (HTML/CSS/JS vanilla, aucune dépendance) pour uploader ton
PNG de carte et lui appliquer les **effets holographiques 3D** des deux projets
de simeydotme, embarqués via [fyk0620/ribi-holo](https://github.com/fyk0620/ribi-holo) :

- **pokemon-cards-css** (Épée & Bouclier) : holo, reverse, cosmos, amazing, radiant, V, V full art,
  VMAX, VSTAR, trainer full art, rainbow, rainbow alt, secret rare (or), shiny rare/V/VMAX,
  trainer gallery…
- **pokemon-cards-151** (Écarlate & Violet) : double rare (ex), ultra rare (full art ex),
  illustration rare, special illustration rare, **hyper rare (or)**, **poké ball / master ball holo**…

Bouge la souris (ou le doigt / le gyroscope) sur la carte pour le rendu 3D.

## Lancer

- **Double-clic sur `index.html`** (fonctionne en `file://`), ou
- `python3 -m http.server` puis ouvrir <http://localhost:8000>
- **En ligne** : déployé automatiquement sur GitHub Pages →
  <https://baynpsd.github.io/Card_Studio/>

## Utilisation

1. **Importer un PNG** (bouton ou glisser-déposer sur la carte) — une carte
   exemple est chargée par défaut.
2. **Choisir un effet** dans la liste (groupée par moteur SWSH / 151).
3. **Réglages** : rotation max, intensité de l'éclat, taille, couleur de lueur.
4. **Démo auto** / **Réinitialiser** / **Télécharger le rendu (PNG)** (export
   approximatif via html2canvas, nécessite internet ; sinon capture d'écran).

Un masque automatique (template de la fenêtre d'art, `img/card_mask.webp`)
est généré au chargement pour les effets masqués, comme dans ribi-holo.

## Structure

```
index.html            page (UI en français)
css/cards.css         structure 3D + les deux moteurs d'effets (151 scopé sous .card.e151)
css/ui.css            habillage de l'interface
js/app.js             tilt 3D (springs), upload, masque auto, presets, export
img/foils/            vraies textures holo (ribi-holo, GPL-3.0)
img/card*.webp        carte/masque/foil/dos par défaut (ribi-holo)
img/sample-card.png   carte exemple générée (tools/make_sample_card.py)
licenses/             licences GPL-3.0 des projets d'origine
.github/workflows/pages.yml   déploiement GitHub Pages
```

## Crédits & licences

- Effets CSS et logique d'interaction : [simeydotme/pokemon-cards-css](https://github.com/simeydotme/pokemon-cards-css)
  et [simeydotme/pokemon-cards-151](https://github.com/simeydotme/pokemon-cards-151) (GPL-3.0),
  embarqués via [fyk0620/ribi-holo](https://github.com/fyk0620/ribi-holo) (GPL-3.0).
- Textures (`img/foils/`, `img/card*.webp`) : ribi-holo. Voir `licenses/`.
