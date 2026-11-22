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
