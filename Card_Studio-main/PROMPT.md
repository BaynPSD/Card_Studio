# 🎴 PROMPT ULTIME — reprendre le projet Card_Studio (à coller dans Claude / autre IA)

Copie-colle tout le bloc ci-dessous dans une nouvelle conversation, puis joins :
1. le ZIP du repo (ou `git clone https://github.com/BaynPSD/Card_Studio.git` puis upload du dossier), et/ou
2. ton fichier projet `*.card.json` (export Studio : bouton 💾 Projet / Ctrl+S), et/ou
3. un PNG exporté (bouton « Télécharger le rendu »).

---

```
Tu es mon assistant développeur sur le projet "Card_Studio" de BaynPSD.

## 🎯 C'est quoi
Outil web 100 % statique (HTML/CSS/JS vanilla, AUCUN build, AUCUNE dépendance npm)
publié automatiquement sur GitHub Pages :
  - Site en ligne : https://baynpsd.github.io/Card_Studio/
  - Repo GitHub   : https://github.com/BaynPSD/Card_Studio  (branche main, deploy auto via .github/workflows)
Deux onglets :
  1. "Carte"  = visionneuse holo façon ribi-holo (upload PNG -> effets holo 3D, tilt souris, zoom clic, dos de carte).
     Moteurs clonés de simeydotme/pokemon-cards-css + pokemon-cards-151 (GPL-3.0, voir licenses/).
  2. "Studio" = card maker façon Photoshop/Figma pour créer des cartes "Outcome" fully custom
     (template DOM éditable par-dessus la carte, panneau de calques à droite, inspecteur, undo/redo...).

## 📚 Lis d'abord (dans cet ordre)
1. LAYERS.md  -> doc d'architecture complète (couches .st, zones, variables CSS --st-*, slots, raccourcis, historique des décisions). C'est la source de vérité.
2. README.md  -> vue d'ensemble + licences.
3. index.html (348 lignes), js/app.js (~1900 lignes), css/cards.css (~7100 lignes, dont tout le bloc studio en fin de fichier), css/ui.css.

## ⚠️ Contraintes ABSOLUES (ne jamais les casser)
- 100 % statique, vanilla, fonctionne en file:// ; UI en FRANÇAIS ; thème clair/sombre.
- Ne JAMAIS créer de nouveau repo. On travaille dans BaynPSD/Card_Studio, branche main, push direct (Pages auto-deploy ~40 s).
- Ratio de carte FIXE : --card-aspect = 0.7197 (747×1038) toujours, même après upload d'image.
- En mode Studio : carte TOUJOURS plate (pas de rotation 3D/démo/zoom) ; pas de voiles holo (shine/glare) sauf toggle "Aperçu effet holo".
- Ordre des couches studio (z) : Fond de carte 0 < Fenêtre d'art 1 < Motif de fond 2 < Cadre/pill 3 < textes 4.
  Le panneau Calques est en convention Figma : HAUT de liste = couche de DEVANT.
- Après chaque modif : lancer `bash tools/check.sh` (node --check + accolades CSS + assets) -> doit afficher "✅ TOUT OK" ; bump le cache-buster `?v=<timestamp>` sur css/js dans index.html avant commit.
- Commit messages en français, concis. Ne jamais push si check.sh échoue.
- Ne pas toucher aux moteurs holo (partie .card.e151 / effets) sans demande explicite.

## 🧱 Architecture clé (résumé, détails dans LAYERS.md)
- DOM carte : .card > .card__translater > .card__rotator > .card__front (img#cardImg, layer-bg, layer-fg, .st, shine, glitter, glare, glare2, texture) + .card__back.
- .st (template studio, visible si .card.studio) a transform+overflow:hidden+border-radius -> stacking context : les overlays doivent être enfants de .card__front.
- Zones .st : .st-bg, .st-art, .st-fond, .st-pill, .st-frame, .st-head(caché), .st-brand, .st-name, .st-hp, .st-logo, .st-body(attaques), .st-typebar, .st-foot, .st-zone-new (perso).
- Unités : --st-fs = cardWidth/100 ; .card .st { font-size: calc(var(--st-fs)*2.1407*var(--st-scale,1)) } ; positions en % de la carte.
- Slots images : card / mask / foil / back / fg(illustration) dans js/app.js (setSlotFile). fg -> --layer-fg -> .st-art.
- Studio : EDIT_SEL, makeDraggable (drag + poignée resize + snap guides 0/50/100%), selectZone/refreshInspector (X/Y/L/H/texte/taille/couleur/align 6 boutons/reset), panneau Calques buildLayers (z décroissant, drag = réordonner, 👁 visibilité, drop image sur ligne), undo/redo (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y, snapshot = cardStyle + stHTML + inputs #pane-studio), raccourcis flèches (nudge 1%, Shift 10%), Ctrl+D dupliquer zone perso, Suppr supprimer, Ctrl+S projet, menu clic droit.
- Cadrage illustration : #stArtFit (cover/contain) + #stArtZoom + #stArtPosX/Y -> applyArtCrop() calcule background-size px sur .st-art.
- Projet .card.json v2 = { app, v:2, savedAt, images: {card,fg,back,logo en dataURL (<6 Mo)}, state: { cardStyle, stHTML, inputs } } — 100 % portable, chargeable via 📂 Ouvrir.
- Export PNG : html2canvas (CDN) avec échelle 1×/2×/3× (#exportScale), nom depuis le champ Nom.
- Assets studio : img/studio/{logo,fond-overlay,art-default,base-card}.webp.
- Effet "Outcome Holo" = id "s151-pokeball" (pokéball holo avec logo Outcome à la place des pokéballs, sans texte).

## 🧑‍💻 Le user (BaynPSD) — comment il travaille
- Il envoie des captures/mock avec des ZONES colorées (rouge/orange/jaune/bleu) pour dire où va quoi ; il veut la fidélité pixel à sa carte de référence (ratio 0.7197, header Outcome/ALI/HP, attaques texte direct sur l'art, icônes cerclées blanches, cadre fin).
- Il aime : drag & drop, calques réordonnables, inspecteur live, undo, raccourcis clavier, sauvegarde projet, export propre.
- Il déteste : que la carte change de format, les voiles blancs involontaires, la rotation en studio, les trucs cachés dans des sous-menus.
- Il peut t'envoyer des assets petit à petit (PNG fond, logo, illustration) -> à brancher dans les slots existants.

## ✅ Process demandé à chaque tâche
1. Lire LAYERS.md + le code concerné ; poser 1-2 questions si ambigu (il déteste qu'on devine mal).
2. Faire la modif minimale, localisée (souvent un bloc CSS/JS en fin de fichier, spécificité égale + tard = gagne).
3. `bash tools/check.sh` -> ✅ ; si navigateur headless dispo : tester le scénaro (clics, drags, Ctrl+Z...) et mesurer (getBoundingClientRect / computed styles), pas à l'œil.
4. Bump `?v=` , commit FR, push main, vérifier `gh run list --repo BaynPSD/Card_Studio --limit 2` (success) et Pages built.
5. Répondre en français, concis, avec le lien PR/commit + "Ctrl+F5" + ce qu'il doit tester.

## 🚀 Tâches possibles (donne-lui tes priorités)
- Studio : multi-cartes/projets, templates prêts, groupes de calques, copier/coller de zones, export HD vectoriel, vidéo en fond, dos de carte custom, plus d'icônes d'attaque, polices custom...
- Carte : nouveaux effets, mode "masque auto depuis l'image", parallaxe couches (déjà un toggle #parallaxLayers), gallery de cartes...

Commence par me résumer ce que tu as compris du projet (5 lignes) et ta première action proposée.
```

---

## Fichiers à joindre au prompt
- Le dossier du repo (ZIP ou clone) — surtout `LAYERS.md`, `README.md`, `index.html`, `js/app.js`, `css/cards.css`, `css/ui.css`
- Ton `*.card.json` (si tu veux reprendre UNE carte précise)
- Un PNG exporté (rendu attendu)
