# 🗺️ Composition exacte d'une carte — référence `karl/pokecardmaker.net` (Sword & Shield)

Étudié depuis [github.com/karl/pokecardmaker.net](https://github.com/karl/pokecardmaker.net)
(`src/features/cardEditor/cardStyles/` + `cardOptions/*/data.ts` + `public/assets/cards/baseSets/swordAndShield/`).

## Canvas

- **747 × 1038 px**, ratio `0.7197` (le Studio utilise `--card-aspect: 0.7197`)
- coins arrondis **30 px** = 4% de la largeur (2,9% de la hauteur)
- fond blanc de secours inset **4 px**, radius 30 px
- **font-size de base = 16 px à 747 px de large** → `1em = largeur / 46,69` (Studio : `--st-fs = largeur / 100`)

## Empilement des couches (z-order)

```
z -10  fond blanc inset 4px, radius 30
z  -2  BackgroundImg   (fond perso)  inset 4px, radius 30
z  -1  ImgLayer1       (ART)         inset 4px, radius 30   ← derrière le cadre
z  -1  CardImage       (cadre avec trou transparent = fenêtre d'art)  pleine taille
z  10  CardContent     (texte/blocs, positionnés en absolu)
z   2  ImgLayer2       (overlay)     pleine taille, radius 21 px
```

⚠️ principe clé : **le cadre est une image PNG avec un trou transparent** ; l'illustration passe
**derrière** le cadre (ImgLayer1), donc jamais recadrée par le texte.

## Blocs de contenu (position absolue, % de la carte 747×1038)

| Bloc | top | left | width | height | notes |
|------|-----|------|-------|--------|-------|
| **NameBar** (nom, supertype Pokémon) | 3.3% | 19% | 53% | 6% | Trainer : top 6.7%, left 6.3%, width 87.3% |
| **HP** | 3.5% | — | — | — | `right: 13.2%` (size lg : top 2.5%, right 13.8%) |
| **Fenêtre d'art** (trou du cadre) | 9.85% | 8% | 84% | 37.3% | = `inset(9.85% 8% 52.85% 8%)`, mesuré 10.02%→47.30% |
| **Moves** (attaques) | 53% | 5% | 90% | 30.5% | gap 0.5em ; V : bottom 14.5% à la place |
| **TypeBar** (faiblesse/résistance/retraite) | bottom 11.2% | 4.2% | 88.8% | 3% | weakness left 13.3%, résistance 42.5% |
| **Description** (Trainer) | 54% | 11.9% | 77% | 31.7% | line-height 2.2em, font 1.635em |
| **CardInfo** (set, numéro, rareté) | bottom 3.6% | 6.6% | — | — | |

## Dans notre Studio

Le template (`css/cards.css`, bloc « mode Studio ») applique exactement ces valeurs :
`.st-head` 3.3/19/53/6%, `.st-hp` top 3.5% right 13.2%, `.st-art` inset 9.85% 8% 52.85% 8%,
`.st-body` 53/5/90/30.5%, `.st-foot` bottom 3.6% left 6.6%, cadre radius 4%/2.9%.

- 🖼 **Fond** (slot Studio « Fond de carte ») = BackgroundImg → `--layer-bg`
- 🎨 **Illustration** (slot « Illustration ») = ImgLayer1 → `--layer-fg`, affiché dans `.st-art`
- 🎭 logo, textes, couleurs = blocs CardContent éditables
- case **🗺️ Contours des zones** = overlay de debug coloré par couche (comme le bloc Debug de karl)

## Ta carte de base perso (1062×1482, ratio 0.716)

Mesurée sur ton image : bannière 5/2/90/10%, art 5/12/90/77%, panneau 5/78.5/90/95.5%,
pied ~98%, cadre argent `#d9d9e3`. Si tu préfères coller à **ta** carte plutôt qu'au standard
S&S, dis-le et je rebascule les % du template sur ces valeurs.

## ✅ Composition active du Studio = ta carte de référence (image 2, 1062×1482)

- Police : **Barlow Condensed** (Google Fonts, fallback Arial Narrow) — header/attaques en condensé bold ; description en Barlow
- Header 0–11.5% : texte **blanc sur le fond** (pill transparente par défaut, colorable via « Bannière haut ») ; nom 2.9em/800, HP « HP 150 » blanc à droite (right 13.2%) ; logo cyan 8% à droite
- Fenêtre d'art : inset **12% 5% 23% 5%** (12→77%)
- Typebar : **70–75%**
- Panneau attaques : **78.5–95.5%**, fond navy `rgba(18,44,84,.85)`
- Pied : bottom 1.5%, blanc
- Cadre : argent `#b6b8c9`, radius 4%/2.9%
- Fond propre par défaut : `img/studio/fond.webp` (ta carte avec ces zones vidées)

## Icônes d'attaque (style ref strip 425×130)
- Cercle **contour blanc** 2px (`border: .16em solid #fff`), fond transparent, `border-radius: 50%`
- Symbole blanc **flat** à l'intérieur via `::before { content: var(--st-glyph) }` + `filter: brightness(0) invert(1)` (blanc garanti même pour les émojis 🎲⭐🪙)
- Proportions mesurées sur la ref : Ø cercle ≈ 1.2× cap du nom (1.9em), trait ≈ 0.067×Ø, symbole ≈ 0.5×Ø (1.35em), gap entre icônes ≈ 0.6em
- `--cost` = nombre réel d'icônes (plus de min 4) → nom attaque à `left: calc(2.8% + cost*9%)`

## Header : lockup marque en HAUT À GAUCHE (ref image 530x692)
- Pill blanche 5–95% × 1.5–11.5% ; à l'intérieur, de gauche à droite : **logo bolt 7% (left 6.5%, centré verticalement)** + **texte marque "Outcome" éditable (stBrandIn, 1.35em, left 13.5%)** + **nom (left 32%, max avant HP)** + **HP à droite (right 12%)**
- Le logo n'est PLUS à droite ; upload "Logo" (stLogoFile) remplace le bolt du lockup haut-gauche

## Motif de fond (asset utilisateur 1062x1482, 85% transparent) — DANS le fond opaque
- Asset : `img/studio/fond-overlay.webp` (webp q80, alpha conservé)
- Le motif va en `.card.studio .st-bg::after` : au-dessus du dégradé opaque (`::before`), sous pill/art/frame/textes (z1 < z2..4) => fond jamais transparent, header propre comme la ref
- Contrôles Studio : 🎨 `stFondColor` (teinte → `filter: sepia(1) saturate(4) hue-rotate(Xdeg)` ; #ffffff = couleurs d'origine) + slider `stFondOp` (opacité 0–100%, défaut 25%)
- Vars : `--st-fond-opacity`, `--st-fond-filter`, `--st-fond-img` (posées sur #card)

## Illustration par défaut
- `img/studio/art-default.webp` = crop de la carte envoyée (x 10–90%, y 19–72%) : personnage gants de boxe sur dégradé bleu
- `.st-art { background-image: var(--layer-fg, url("../img/studio/art-default.webp")) }` → upload "Illustration" (--layer-fg) prioritaire

## Header final (comme la ref, PAS de pill blanche par défaut)
- `.st-pill` transparent par défaut (`--st-head` non posé au chargement) ; pill colorée seulement si "Bannière haut" choisi
- Texte header BLANC sur le fond opaque : `.st-head`/`.st-hp` color `var(--st-head-text, #ffffff)` ; stHeadTextIn défaut #ffffff
- Lockup haut gauche : logo bolt blanc (filter brightness(0) invert(1) par défaut ; upload logo => `--st-logo-filter: none`) left 6.5% w 7%, "Outcome" (stBrandIn) left 13.5%, nom left 32%, HP right 12%
- Fond opaque : dégradé `--st-bg-grad` + motif `fond-overlay.webp` en `.st-bg::after`

## Cadre + header — positions exactes carte image 2 (1062x1482)
- Cadre `.st-frame` OPAQUE : bord `calc(st-fs*2.3) solid var(--st-frame, #eceaf2)`, plus de fond translucide ni d'ombre (le voile "désopacifié" est supprimé) ; stFrameIn défaut #eceaf2
- Header (ref) : logo bolt x 2–5% (left 2%, w 4.5%, aspect 3/4), "Outcome" ~7% (st-brand left 2.5% du head), nom ~24% (st-name left 21% du head), HP jusqu'à ~98% (st-hp right 2.5%)

## Header FINAL (mesuré sur carte image 2) — PAS de lockup à gauche
- "Outcome" (stBrandIn) petit blanc à gauche ~5-7% (st-brand left 1% du head, 1.6em)
- Nom "ALI" GROS blanc 2.6em à ~24% (st-name left 21% du head)
- "HP 150" blanc 1.4em à droite ~85% (st-hp right 15%)
- Logo bolt CYAN tout à droite ~90-98% (st-logo right 2%, w 8%, plus de filtre blanc par défaut)
- Pas de pill par défaut ; texte blanc sur fond opaque

## Header FINAL (vérifié = ref image 2) : [Outcome ~5%] [bolt CYAN 10.6-12.5%] [ALI 2.6em ~24%] ... [HP 150 right 10% + ♥ vert #3ddc84]
- logo.webp recolorié cyan #5af0d2 ; plus de filtre blanc
- art-default.webp = crop haute res (935x934) de la carte ref 1062x1482 (x 6-94%, y 13-76%) → illustration nette

## Mode édition directe (✏️ editMode)
- Cases/poignées : chaque zone du template (`.st > div` + `.st-zone-new`) devient draggable (pointerdown → left/top en %) et redimensionnable via la poignée orange `.st-handle` (bas-droite)
- `normalizeZone` convertit inset/right/bottom en left/top/width/height en % au début du drag
- Slider « Taille du texte » (stScaleIn 50–200%) → `--st-scale` multiplié dans `.card .st { font-size: calc(st-fs*2.1407*var(--st-scale,1)) }`
- Bouton « ➕ Ajouter une zone texte » → `.st-zone-new` contenteditable, draggable, double-clic = supprimer
- En mode edit : tilt 3D et zoom désactivés (guards dans interact/pointerup) + `.card.edit .st * { pointer-events:auto }`

## Blocs indépendants
- `.st-brand` (Outcome) et `.st-name` (ALI) sont des enfants DIRECTS de `.st` (plus dans .st-head, qui est display:none) → draggables séparément en mode édition ; positions card-level : brand left 5% top 6.5%, name left 24% top 6.5%

## Taille & couleur par texte (indépendantes)
- Panneau Studio → « Tailles & couleurs par texte » : 9 lignes (Marque, Nom, HP, Noms attaques, Dégâts, Description, Typebar, Pied, Zones ajoutées), chacune = slider 50–200% + color picker
- Vars par élément sur #card : `--st-k-*` (échelle) et `--st-c-*` (couleur) ; CSS : ex. `.st-name { font-size: calc(2.6em * var(--st-k-name,1)); color: var(--st-c-name, ...) }`
- Le slider global « Taille du texte » (--st-scale) reste dispo en plus

## Undo / Redo
- Raccourcis : Ctrl+Z (annuler), Ctrl+Shift+Z / Ctrl+Y / Ctrl+V (rétablir, Ctrl+V seulement hors champ texte)
- Boutons ↩️ Annuler / ↪️ Rétablir dans le panneau Studio
- Snapshot = style inline de #card (toutes les vars --st-*) + innerHTML de .st (sans les .st-handle) + valeurs des champs #pane-studio
- pushUndo au pointerdown sur tout élément interactif (dédoublonné), snapshot initial à 800ms ; restauration ré-attache les handlers de drag (makeDraggable) et la délégation dblclick-delete sur .st

## Interface façon Figma + tailles
- Logo blanc par défaut (filter brightness(0) invert(1) ; upload logo = tel quel)
- Carte par défaut 500px (cardSize 240–720, settings.size 500) ; stage min-height 820px, fitCard marges 16/24
- Inspecteur 🎯 (mode édition) : clic sur une zone → panneau avec X/Y/L/H (%), texte, taille texte, couleur, supprimer (zones perso) ; se met à jour pendant le drag ; ZONE_META mappe chaque zone à ses vars --st-k-*/--st-c-*

## UX simplifiée façon Photoshop/Figma
- Panneau Studio réorganisé en <details> repliables : 🎯 Sélection (ouvert), 📝 Textes (ouvert), 🔤 Tailles & couleurs par texte, 🎨 Couleurs/fond/images ; en haut : mode studio, ✏️ édition, taille texte, ➕ zone, ↩️↪️ undo/redo
- Panneau 🧅 CALQUES à droite (#layersPanel, visible onglet Studio uniquement) : liste des zones triées par z-index, 👁 show/hide, clic = sélection (sync inspecteur), ▲▼ = ordre de pile ; sync sur onglet/édition/ajout/suppression/undo-redo (buildLayers/syncLayersPanel)

## Illustration pleine carte (zone rouge du mock)
- `.st-art { inset: 0; border: none; border-radius: 0; background-size: cover; background-position: center }` (dernier bloc, gagne à spécificité égale)
- L'art remplit TOUTE la carte ; `.st` (overflow:hidden + border-radius 4%/2.9%) clippe l'art aux coins arrondis → contour continu
- Par-dessus : `.st-frame` (cadre, z3) et `.st-body` attaques (z4) ; header (brand/name/hp/logo z4) lisible par-dessus l'art
- Vérifié en headless : rect(.st-art) == rect(.st) == rect(#card), computed inset 0 / border 0 / cover ; pixels juste à l'intérieur du cadre = couleurs de l'illu, pas le fond

## Glisser depuis le panneau Calques
- pointerdown sur une ligne de calque (hors boutons 👁▲▼) = sélection + drag : déplacer la souris déplace la zone sur la carte en live (left/top en % du déplacement souris / taille carte), inspecteur sync, pushUndo au début, syncLayersPanel au relâchement ; Ctrl+Z annule
- CSS : .layer-row cursor grab/grabbing, user-select none, touch-action none

## Calques : réordonner par drag + attaques sans fond
- Glisser une ligne du panneau Calques VERTICALEMENT = monter/descendre le calque dans l'ordre (au drop, z-index réassigné selon l'ordre DOM des lignes, bas de liste = haut de pile) ; simple clic = sélection seule ; Ctrl+Z annule ; .layer-row.dragging = feedback visuel
- `.st-body { background: transparent; border-radius: 0 }` (dernier bloc) : panneau attaques SANS fond navy — texte blanc + icônes cerclées directement sur l'illustration (ref utilisateur)

## Ordre des couches : art DERRIÈRE le fond
- `.card .st-art { z-index: 0 }` (< `.st-bg` z1, dernier bloc) : l'illu pleine carte est la couche du dessous, le fond de carte (teinte + motif overlay) recouvre toute la carte par-dessus
- La teinte du fond est translucide (alpha 0.65 dans setStudioBg) pour laisser voir l'art à travers ; le color picker change la teinte, le slider d'opacité du motif règle le pattern
- Ordre dans le panneau Calques : Fenêtre d'art en bas, puis Fond de carte, puis le reste

## Fond séparé en 2 calques + plus de voiles holo en studio
- `.st-bg` (z0) = couleur/gradient de fond OPAQUE, SOUS l'illustration -> la couleur ne touche que le fond
- `.st-art` (z1) = illu pleine carte par-dessus la couleur
- `.st-fond` (z2, nouveau calque "Motif de fond") = pattern par-dessus l'art sur toute la carte (opacité --st-fond-opacity, teinte --st-fond-filter) ; l'ancien `.st-bg::after` est désactivé (content:none)
- `.card.studio` : shine/glare/glitter/glare2 en opacity 0 !important et texture display none -> plus de reflet blanc par-dessus la carte en studio (le glare radial suivait la souris, c'était le « voile blanc » même à opacité motif = 2)
- Ordre panneau Calques : Fond de carte / Fenêtre d'art / Motif de fond / Pill / Cadre / textes...

## Panneau Calques : convention Figma/Photoshop (haut de liste = devant)
- buildLayers trie par z-index DÉCROISSANT : la ligne du HAUT = couche de DEVANT. Avant c'était l'inverse -> tirer "Fenêtre d'art" en haut la mettait DERNIÈRE le fond opaque => carte blanche, art invisible (le bug des captures)
- Au drop du drag : z-index réassigné tel que haut de liste = z max (n - i) ; ▲ = z+1 (monte), ▼ = z-1 ; Ctrl+Z annule
- Bonus : .st-atk-name tronqué proprement (nowrap + ellipsis) si le nom d'attaque est trop long

## Illustration DANS son cadre (fenêtre), fond visible autour
- `.st-art { inset: 13% 5.5% 24% 5.5%; border: 0.5fs rgba(255,255,255,.85); border-radius: 1.2fs; background-size: cover; background-color: rgba(0,0,0,.18) }` (dernier bloc, annule le pleine carte)
- z inchangé : fond 0 < art 1 < motif 2 < cadre 3 < textes 4 -> le fond de carte reste visible autour de la fenêtre d'art
- Fenêtre mesurée en headless : x 6.9%, y 12.3%, L 90.2%, H 65.7% de la carte

## Cadrage de l'illustration (zoom + position + fit)
- Contrôles panneau Studio (groupe images) : #stArtFit (cover "Remplir" / contain "Tout voir"), #stArtZoom 50-300%, #stArtPosX/Y 0-100%
- applyArtCrop() calcule background-size en px (cover ou contain × zoom) + background-position X% Y% sur .st-art ; recalculé au resize (fitCard + ResizeObserver), après upload illustration (loadArtNatural via --layer-fg) et après undo/redo
- Testé headless : image 1200x600 -> cover 875x438 (rempli, rogné) / contain 446x223 (entière, bandes) / zoom 150 -> 1408x704

## Audit UX (raccourcis & workflow façon Photoshop/Figma)
- Nudge au clavier : flèches = ±1% sur la zone sélectionnée, Shift = ±10% ; Suppr = supprimer zone perso ; Ctrl+D = dupliquer zone perso ; Ctrl+S = sauvegarder projet .json ; Ctrl+Z/Y déjà en place
- Alignement Figma : boutons ⇤↔⇥⤒↕⤓ dans l'inspecteur (aligné sur la carte) + ↺ reset position de la zone
- Snap + guides magenta pendant le drag (ancres 0/50/100%, tolérance 1.1%) — .st-guide-v/h dans .st, nettoyés au pointerup
- Clic droit sur une zone (mode édition) = menu contextuel (monter/descendre/reset/dupliquer/supprimer)
- Zone perso : drag = déplacer (maintenant draggables comme les autres), double-clic = éditer le texte (contentEditable), Suppr = supprimer
- Drop contextuel : image sur la stage en studio = illustration ; sur une ligne de calque = assignée (Fond→fond, Art→illu, Logo→logo)
- Projet : 💾 Projet / 📂 Ouvrir (.card.json = cardStyle + stHTML + tous les champs) + autosave localStorage toutes les 4 s + bannière « Reprendre » au chargement
- Export : qualité 1×/2×/3× + nom de fichier depuis le nom de la carte
- ✨ Aperçu effet holo : toggle .preview-holo qui réactive shine/glare à 0.5 par-dessus le template studio
- Barre d'astuce contextuelle #studioHint selon sélection/mode

## Studio : carte plate + taille de police partout
- Studio = plus de rotation 3D : guards dans interact()/interactEnd()/startShowcase()/pointerup-zoom + CSS `.card.studio { --rotate-x/y: 0deg !important; --card-scale: 1 !important; --translate-x/y: 0 !important }` (testé : souris bougée + démo auto -> computed rotate 0deg, transform identity ; l'onglet Carte garde la rotation)
- Inspecteur : "Panneau attaques" a maintenant sizeVar --st-k-atk / colorVar --st-c-atk -> slider taille + couleur visibles dès la sélection (toutes les zones texte ont leur taille dans l'inspecteur)

## Projet 100% portable (transfert vers Claude/autre IA)
- `.card.json` v2 = state (cardStyle + stHTML + tous les champs) + `images` embarquées en dataURL (card/fond, fg/illustration, back/dos, logo perso ; images > 6 Mo ignorées)
- saveProject/loadProjectJSON async ; slots gardent maintenant le vrai File (`s.file`) en plus de l'URL objet (`s.blob`) ; logo idem (logoFile)
- Ctrl+S ou 💾 Projet = téléchargement ; 📂 Ouvrir = réimport ; autosave localStorage aussi en v2
- Testé headless : upload illu -> projectJSON (images.fg dataURL) -> reset -> loadProjectJSON -> nom + illustration restaurés

## 🎴 Gabarit Outcome (case `#stTplOutcome`, cochée par défaut) — reproduit ALI 001/020 & JACK 004/020
- 3 couches seulement : `.st-art` illustration PLEINE CARTE (z1) → `.st-fond` = cadre argent `fond-overlay.webp` (PNG à trou, z2, `background-size:100% 100%`) → textes (z4). `.st-pill`, `.st-frame`, `.st-typebar` masqués.
- Tout est dans UN bloc CSS en fin de `cards.css`, scopé `.card.studio.tpl-outcome` ; décocher = ancien template intact.
- Positions mesurées sur la ref 1062×1482 (en % carte) : logo bolt centre 8.6/4.4 ; « Outcome » left 12.1 / y 4.45 ; NOM navy `#0c1a36` 900 italic 3.7em left 24.6 / y 5.5 ; HP (« HP » 0.4× + nombre 3.15em) right 4.6 / y 5.7 + rond ∞ teal Ø 7.9 %L ; attaques : body 5/66.5/90/20, lignes centrées 70.6 % et 77.5 %, filets 73.9 % et 81.5 %, noms left 27.8 %, dégâts right 10.5 % ; description italique y 84.5 % ; numéro + ◆ left 8.4 / y 95.6 ; badge UR centre 85.75/93.65 + lauriers SVG.
- Police : Poppins (Google Fonts). Icônes d'attaque : option « Logo Outcome » (`glyph-logo`, mask du logo, suit le logo uploadé).
- Sans illustration uploadée : `art-default.webp` calé en haut + fondu navy (il contient du texte incrusté de la ref) ; avec upload : classe `st-has-art`, léger assombrissement bas pour la lisibilité.
- Validé en headless : ref ALI passée en illustration → les textes du gabarit tombent sur les textes incrustés (écart < 1 %).
- Corrigé : doublon `applyDefaultMask()` appelé avant `DEFAULT_FILES` (ReferenceError TDZ en console).

## Coins, poignées 4 coins, double-clic texte (gabarit Outcome)
- Coins : `.card.studio.tpl-outcome .card__front { clip-path: inset(0 round 7.4% 7.4% 6.4% 6.4% / 5.6% 5.6% 4.4% 4.4%) }` + même radius sur `.st` = contour EXACT du cadre PNG (mesuré sur son alpha) → plus d'illu qui dépasse dans les angles.
- Redimensionner : 4 poignées orange `.st-rh` (nw/ne/sw/se) posées DANS la zone, visibles seulement sur le calque sélectionné (clic carte ou panneau Calques) → marchent aussi pour les calques pleine carte (illu, cadre). Shift = proportions. Marque / Nom / HP : la poignée agrandit le TEXTE (`--st-k-brand/name/hp`). Ancienne `.st-handle` masquée. Ctrl+Z annule.
- `normalizeZone` met `transform:none` (plus de saut au 1er drag des zones centrées en translateY(-50%)) et ne fige pas L/H des textes auto (marque, nom, HP).
- Double-clic sur n'importe quel texte de la carte (nom, marque, HP, attaques, dégâts, description, numéro, rareté…) = édition directe, Entrée = valider, Échap = annuler ; le champ du panneau suit. Marche avec ou sans mode édition.

# 🎴 ÉDITEUR DE CARTES (`editor.html`) — façon Pressroom « Poster Studio »
Page séparée, 100 % statique : `editor.html` + `css/editor.css` + `js/editor-data.js` (micrographics, modèles, palettes) + `js/editor.js` (moteur).
L'ancien Studio (onglet de `index.html`) reste intact ; `index.html` a un lien vers l'éditeur.

## Modèle
- `project = { name, logo (dataURL|null), uploads[], finish:{grain}, showGrid, snapGrid, layers[] }` — `layers[0]` = derrière.
- Calque : `{ id, type, name, x, y, w, h, rot, opacity, hidden, locked, role? , ...props }` en px du repère carte **747 × 1038** (ratio 0.7197).
- Types : `image` (src, fit cover/contain/stretch, alignX/Y, white, fx{gray,contrast,bright,sat}) · `text` (text, font, size, weight, italic, ls, lh, align, wrap, color, shadow ; ligne de base = y + 0.8 × size) · `rect`/`ellipse` (fill, fill2 dégradé, angle, radius, stroke) · `rule` (filet dégradé) · `svg` (markup 0..100 currentColor, vb, color) · **`attack`** (cost 0-6, glyph, text, dmg, size, iconSize, iconCx, nameX, ring) · **`badge`** (rareté + lauriers) · **`hp`** (label + value, aligné à droite).
- Rôles : `bg` (fond), `art` (illustration), `fade` (fondu), `frame` (cadre argent `fond-overlay.webp`), `logo`. Placeholders SVG : `{{LOGO}}`, `{{LOGO_WHITE}}`, `{{LOGO_TEAL}}` = logo du projet (upload « Logo » = partout, jetons d'attaque compris).
- Rendu : un seul `<svg viewBox="0 0 747 1038">` découpé par le contour du cadre (coins 55×58 haut / 48×46 bas). Overlay HTML = sélection, 8 poignées + rotation, guides magenta, édition en place.

## UX (calquée sur Pressroom, adaptée aux cartes)
- Haut : nom du projet, « ✓ Enregistré sur cet appareil » (autosave localStorage), ↶ ↷, 📂, 🃏 Holo, **Export** (PNG 1-4×, SVG autonome polices+images embarquées, projet `.card.json`, ✨ Voir en holo).
- Gauche : **Styles** (5 modèles : Outcome UR ALI, UR JACK, SR 1 attaque, Full art, Carte vierge + palette uni/dégradé) · **Bibliothèque** (Texte, Forme, Image, SVG + **MICROGRAPHICS** : Attaques 1/2/3/0 coûts, filet, ambiance · Énergie (12 jetons) · Rareté (UR/SR/SAR/R, lauriers, ★★★, symbole d'extension, étincelles) · HP & stats · Déco · Technique + import de tes SVG) · **Calques** (haut = devant, glisser = réordonner, 👁, 🔒, double-clic = renommer).
- Centre : carte, zoom − / + / ajuster (Ctrl+molette), « Palette au hasard », astuce « Glisse tout. Double-clic sur un texte pour l'éditer. Shift pour contraindre. »
- Droite : rien de sélectionné = **Image Lab** (importer illustration, mes images, logo) + **Finition** (N&B, contraste, saturation, grain) + **Réglages carte** (cadre argent/aucun/PNG perso, fond haut/bas, grille, aimantation) ; sinon **inspecteur** du calque (champs spécifiques + X/Y/L/H/°/% avec glisser-régler sur l'étiquette, aligner sur la carte, ⤓ ⤒ ⧉ 🔒 🗑).
- Attaque : double-clic sur le nom = éditer le nom, sur les dégâts = éditer les dégâts ; coût 0-5 et symbole des jetons dans l'inspecteur ; coin = tout agrandir, bord = élargir la ligne.
- Raccourcis : Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y, Ctrl+C / V / D, Ctrl+A, Ctrl+[ / ], Suppr, flèches (Shift ×10), Entrée = éditer le texte, Échap, + / − / 0, Ctrl+S.
- « Voir en holo » : rendu 2× webp → `localStorage["cardstudio.holo"]` → `index.html#from-editor` charge la carte dans la visionneuse 3D.
- Export ne marche qu'en http(s) (GitHub Pages) : en `file://` le navigateur bloque fetch/canvas → message explicite.
- Clic = sélectionner + déplacer. Un calque verrouillé reste cliquable (cadre pointillé, pas de poignées, ne bouge plus). Mini-barre flottante au-dessus de la sélection : 🔓 Verrouiller / 🔒 Verrouillé, ⤓ ⤒, ⧉, 🗑. Ctrl+L = verrouiller/déverrouiller. Alt+clic = sélectionner le calque du dessous (cycle dans la pile, verrouillés compris).
- **HP** (type `hp`) = « HP » + valeur en 1 bloc de texte. Le **rond d'icône** est un calque séparé (type `token`) : `icon` (`inf` | `logo` = logo du projet | `bolt`/`heart`/`star`/`diamond` | `custom` + `iconSrc` image recadrée en rond | `none`), `iconColor`, `iconRing` ; reste rond au redimensionnement ; double-clic = importer une image. `migrate()` sépare l'ancien bloc fusionné et convertit les anciens micrographics « Rond ∞ / Rond logo » en `token`.
