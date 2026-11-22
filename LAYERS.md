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
