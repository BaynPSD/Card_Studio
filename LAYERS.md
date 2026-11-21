# 🗺️ Carte des couches — carte de base (1062×1482, ratio 0.716)

Image de base : `img/studio/base-card.webp` (fournie par BaynPSD).
Positions en % de la carte (x, y, largeur, hauteur), mesurées sur l'image.

| # | Couche | Position (gauche, haut, droite, bas) | Aspect / couleur mesurée | Asset à recréer |
|---|--------|--------------------------------------|--------------------------|-----------------|
| 1 | **Fond général** | 0, 0, 100, 100 | dégradé bleu foncé (ex. `#1b4694` → `#0b3d91`) avec reflets lumineux | PNG pleine carte `fond.png` → slot 📤 Carte |
| 2 | **Bordure / cadre extérieur** | 0, 0, 100, 100 | contour argenté `#d9d9e3`, épaisseur ≈ 1.5–2% de la largeur, coins arrondis ~4.5%/3.5% | PNG transparent avec juste le contour `cadre.png` (ou couleur via le sélecteur « Cadre ») |
| 3 | **Bannière haute (nom + HP)** | 5%, 2%, 95%, 10% | fond blanc `#f2f2f6`, coins très arrondis (pill), texte foncé `#1a2340` | texte éditable (champs Nom / HP) + couleur via « Bannière haut » / « Texte bannière » |
| 4 | **Logo haut droite** | ~84%, 2.5%, 93%, 11.5% (≈ 9% de large) | cercle + symbole (éclair) | `img/studio/logo.webp` par défaut, remplaçable via champ « Logo » |
| 5 | **Fenêtre d'illustration (art)** | 5%, 12%, 95%, 77% | rectangle coins arrondis, fine bordure blanche interne | PNG de l'illustration → slot 🎭 Perso (affiché dans la fenêtre via `clip-path: var(--clip)`) |
| 6 | **Panneau attaques/texte** | 5%, 78.5%, 95%, 95.5% | fond noir semi-transparent `rgba(8,10,20,.55)`, coins arrondis | textes éditables (Attaque 1 + dégâts, description, Attaque 2 + dégâts) |
| 7 | **Pied de carte (numéro / rareté)** | 6%, 98.2%, 94%, 100% | texte clair `#f4f6ff` sur le fond | champs Numéro / Rareté |

## Ordre d'empilement (du fond vers le dessus)

```
1 fond.png            (slot 📤 Carte)
2 cadre (bordure)     (sélecteur couleur ou PNG transparent)
3 fenêtre d'art       (slot 🎭 Perso, clipée à la zone #5)
4 bannière + logo     (textes éditables + logo)
5 panneau attaques    (textes éditables)
6 pied                (numéro + rareté)
7 effets holo         (shine / glare / texture — par-dessus tout)
```

## Pour recréer chaque couche facilement

Exporte chaque couche en **PNG transparent** de 1062×1482 (ou 660×921, même ratio 0.716) :
- `fond.png` → slot **📤 Carte**
- `illustration.png` (perso sur fond transparent) → slot **🎭 Perso**
- `cadre.png` (contour seul, transparent ailleurs) → à brancher si besoin (actuellement couleur unie)
- logo → champ **Logo** de l'onglet Studio
- textes → champs de l'onglet Studio (rien à exporter)

Le template Studio applique automatiquement les positions du tableau ci-dessus.
