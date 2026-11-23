/* Card Studio — données de l'éditeur : micrographics, modèles de cartes, palettes.
   Repère carte : 747 × 1038 px (ratio 0.7197). Positions des modèles mesurées sur la carte ref ALI 001/020. */
"use strict";

const CARD_W = 747;
const CARD_H = 1038;
const ASSETS = {
  frame: "img/studio/fond-overlay.webp",
  logo: "img/studio/logo.webp",
  art: "img/studio/art-default.webp",
  ref: "img/studio/base-card.webp",
};

/* ---------- glyphes d'énergie (dans une boîte 0..100), currentColor ---------- */
function starPts(cx, cy, R, r, n = 5) {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const rr = i % 2 ? r : R;
    p.push((cx + rr * Math.cos(a)).toFixed(1) + "," + (cy + rr * Math.sin(a)).toFixed(1));
  }
  return p.join(" ");
}
const GLYPHS = {
  logo: { label: "Logo", svg: "" /* rendu par le moteur avec le logo du projet */ },
  inf: { label: "∞", svg: '<path d="M27 50C27 36 42 36 50 50C58 64 73 64 73 50C73 36 58 36 50 50C42 64 27 64 27 50Z" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="round"/>' },
  bolt: { label: "⚡", svg: '<polygon points="57,14 30,55 47,55 40,86 70,42 53,42" fill="currentColor"/>' },
  heart: { label: "♥", svg: '<path d="M50 80L25 55C14 44 21 27 36 27C43 27 48 32 50 36C52 32 57 27 64 27C79 27 86 44 75 55Z" fill="currentColor"/>' },
  star: { label: "★", svg: '<polygon points="' + starPts(50, 52, 32, 13) + '" fill="currentColor"/>' },
  diamond: { label: "◆", svg: '<polygon points="50,20 75,50 50,80 25,50" fill="currentColor"/>' },
  dot: { label: "●", svg: '<circle cx="50" cy="50" r="20" fill="currentColor"/>' },
  dice: { label: "🎲", svg: '<rect x="24" y="24" width="52" height="52" rx="10" fill="none" stroke="currentColor" stroke-width="7"/><circle cx="38" cy="38" r="5" fill="currentColor"/><circle cx="50" cy="50" r="5" fill="currentColor"/><circle cx="62" cy="62" r="5" fill="currentColor"/>' },
  coin: { label: "🪙", svg: '<circle cx="50" cy="50" r="27" fill="none" stroke="currentColor" stroke-width="7"/><text x="50" y="62" text-anchor="middle" font-size="34" font-weight="900" font-family="Poppins,Arial" fill="currentColor">$</text>' },
  eye: { label: "👁", svg: '<path d="M18 50C30 30 70 30 82 50C70 70 30 70 18 50Z" fill="none" stroke="currentColor" stroke-width="7"/><circle cx="50" cy="50" r="9" fill="currentColor"/>' },
  arrow: { label: "↗", svg: '<path d="M30 70L68 32M42 30H70V58" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>' },
  chart: { label: "📈", svg: '<polyline points="22,72 40,52 54,60 78,30" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>' },
};

/* jeton d'énergie seul (anneau + glyphe) en micrographic SVG */
function energyToken(g) {
  return '<circle cx="50" cy="50" r="42" fill="rgba(8,18,45,.35)" stroke="currentColor" stroke-width="6"/>' +
    (g === "logo" ? "{{LOGO_WHITE}}" : '<g transform="translate(50 50) scale(.62) translate(-50 -50)">' + GLYPHS[g].svg + "</g>");
}

const LAUREL_PATH = (fill) =>
  `<g fill="${fill}"><path d="M15 39 C6 32 4 20 9 3" fill="none" stroke="${fill}" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="7" cy="31" rx="2.4" ry="5" transform="rotate(-55 7 31)"/><ellipse cx="5" cy="23" rx="2.3" ry="4.8" transform="rotate(-35 5 23)"/><ellipse cx="5" cy="15" rx="2.2" ry="4.5" transform="rotate(-15 5 15)"/><ellipse cx="8" cy="7" rx="2" ry="4.2" transform="rotate(10 8 7)"/><ellipse cx="13" cy="27" rx="2.2" ry="4.4" transform="rotate(35 13 27)"/><ellipse cx="12.5" cy="18" rx="2" ry="4.2" transform="rotate(45 12.5 18)"/><ellipse cx="12.5" cy="10" rx="1.8" ry="3.8" transform="rotate(55 12.5 10)"/></g>`;

/* ---------- MICROGRAPHICS ----------
   kind "svg"   : markup 0..100 (currentColor) inséré comme calque SVG recolorable
   kind autres  : composants de carte éditables (attaque, badge, hp, filet) */
const MG_CATS = ["Tout", "Attaques", "Énergie", "Rareté", "HP & stats", "Déco", "Technique"];
const MICRO = [
  /* --- Attaques (composants) --- */
  { id: "atk1", name: "Attaque · 1 coût", cat: "Attaques", kind: "attack", wide: true, props: { cost: 1, name: "Prediction", dmg: "40" } },
  { id: "atk2", name: "Attaque · 2 coûts", cat: "Attaques", kind: "attack", wide: true, props: { cost: 2, name: "Outcome", dmg: "100" } },
  { id: "atk3", name: "Attaque · 3 coûts", cat: "Attaques", kind: "attack", wide: true, props: { cost: 3, name: "Amplify", dmg: "150+" } },
  { id: "atk0", name: "Talent (sans coût)", cat: "Attaques", kind: "attack", wide: true, props: { cost: 0, name: "Talent : Narrative", dmg: "" } },
  { id: "rule", name: "Filet séparateur", cat: "Attaques", kind: "rule", wide: true },
  { id: "flavor", name: "Texte d'ambiance", cat: "Attaques", kind: "flavor", wide: true },
  /* --- Énergie --- */
  ...Object.keys(GLYPHS).map((g) => ({ id: "en-" + g, name: "Énergie " + GLYPHS[g].label, cat: "Énergie", kind: "svg", svg: energyToken(g), w: 41, h: 41 })),
  /* --- Rareté --- */
  { id: "badge-ur", name: "Badge UR", cat: "Rareté", kind: "badge", props: { text: "UR" } },
  { id: "badge-sr", name: "Badge SR", cat: "Rareté", kind: "badge", props: { text: "SR" } },
  { id: "badge-sar", name: "Badge SAR", cat: "Rareté", kind: "badge", props: { text: "SAR" } },
  { id: "badge-r", name: "Badge R (sans lauriers)", cat: "Rareté", kind: "badge", props: { text: "R", laurels: false } },
  { id: "laurels", name: "Lauriers", cat: "Rareté", kind: "svg", w: 120, h: 52, svg: '<g transform="scale(1.4 2.5)">' + LAUREL_PATH("currentColor") + '</g><g transform="translate(100 0) scale(-1.4 2.5)">' + LAUREL_PATH("currentColor") + "</g>", vb: "0 0 100 100", color: "#efe3c8" },
  { id: "stars3", name: "Étoiles ★★★", cat: "Rareté", kind: "svg", w: 90, h: 30, vb: "0 0 300 100", svg: [50, 150, 250].map((x) => '<polygon points="' + starPts(x, 52, 44, 18) + '" fill="currentColor"/>').join("") },
  { id: "set-dia", name: "Symbole d'extension ◆", cat: "Rareté", kind: "svg", w: 22, h: 22, svg: '<polygon points="50,8 88,50 50,92 12,50" fill="none" stroke="currentColor" stroke-width="9"/><polygon points="50,30 70,50 50,70 30,50" fill="currentColor"/>' },
  { id: "holo-spark", name: "Étincelles holo", cat: "Rareté", kind: "svg", svg: '<path d="M50 8L56 44L92 50L56 56L50 92L44 56L8 50L44 44Z" fill="currentColor"/><path d="M80 14L82 22L90 24L82 26L80 34L78 26L70 24L78 22Z" fill="currentColor"/><path d="M20 70L22 77L29 79L22 81L20 88L18 81L11 79L18 77Z" fill="currentColor"/>' },
  /* --- HP & stats --- */
  { id: "hp", name: "HP 150 + rond ∞ (1 bloc)", cat: "HP & stats", kind: "hp", wide: true },
  { id: "hp-inf", name: "Rond ∞ (type)", cat: "HP & stats", kind: "svg", w: 59, h: 59, color: "#45e3c6", svg: '<circle cx="50" cy="50" r="45" fill="#0b1630" stroke="#e8eef8" stroke-width="6"/><path d="M24 50C24 33 42 33 50 50C58 67 76 67 76 50C76 33 58 33 50 50C42 67 24 67 24 50Z" fill="currentColor"/>' },
  { id: "hp-logo", name: "Rond logo (type)", cat: "HP & stats", kind: "svg", w: 59, h: 59, color: "#e8eef8", svg: '<circle cx="50" cy="50" r="45" fill="#0b1630" stroke="currentColor" stroke-width="6"/>{{LOGO_TEAL}}' },
  { id: "weak", name: "Faiblesse ×2", cat: "HP & stats", kind: "text", props: { text: "faiblesse ×2", size: 16, weight: 600, italic: false, ls: 1 } },
  { id: "number", name: "Numéro 001/020 ◆", cat: "HP & stats", kind: "text", props: { text: "001/020  ◆", size: 19.2, weight: 600, italic: false } },
  { id: "brand", name: "Marque Outcome", cat: "HP & stats", kind: "text", props: { text: "Outcome", size: 18.4, weight: 600, italic: false } },
  /* --- Déco (façon poster) --- */
  { id: "cross", name: "Mire", cat: "Déco", kind: "svg", svg: '<circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" stroke-width="3"/><path d="M50 8V92M8 50H92" stroke="currentColor" stroke-width="3"/>' },
  { id: "rings3", name: "Cercles entrelacés", cat: "Déco", kind: "svg", w: 90, h: 36, vb: "0 0 150 60", svg: '<g fill="none" stroke="currentColor" stroke-width="3.5"><circle cx="40" cy="30" r="25"/><circle cx="75" cy="30" r="25"/><circle cx="110" cy="30" r="25"/></g>' },
  { id: "globe", name: "Globe", cat: "Déco", kind: "svg", svg: '<g fill="none" stroke="currentColor" stroke-width="3"><circle cx="50" cy="50" r="40"/><ellipse cx="50" cy="50" rx="18" ry="40"/><path d="M10 50H90M16 30H84M16 70H84"/></g>' },
  { id: "orbit", name: "Orbite", cat: "Déco", kind: "svg", svg: '<ellipse cx="50" cy="50" rx="45" ry="14" fill="none" stroke="currentColor" stroke-width="3.5"/><circle cx="50" cy="50" r="7" fill="currentColor"/>' },
  { id: "spark4", name: "Étoile 4 branches", cat: "Déco", kind: "svg", svg: '<path d="M50 6C53 40 60 47 94 50C60 53 53 60 50 94C47 60 40 53 6 50C40 47 47 40 50 6Z" fill="currentColor"/>' },
  { id: "dashring", name: "Cercle pointillé", cat: "Déco", kind: "svg", svg: '<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="6 7"/>' },
  { id: "concentric", name: "Cercles concentriques", cat: "Déco", kind: "svg", svg: '<g fill="none" stroke="currentColor" stroke-width="3"><circle cx="50" cy="50" r="42"/><circle cx="50" cy="50" r="30"/><circle cx="50" cy="50" r="18"/><circle cx="50" cy="50" r="6"/></g>' },
  { id: "halftone", name: "Trame demi-teinte", cat: "Déco", kind: "svg", svg: (() => { let s = ""; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) s += `<circle cx="${12 + i * 15.2}" cy="${12 + j * 15.2}" r="${(1 + (i + j) * 0.55).toFixed(1)}" fill="currentColor"/>`; return s; })() },
  { id: "dots", name: "Grille de points", cat: "Déco", kind: "svg", svg: (() => { let s = ""; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) s += `<circle cx="${14 + i * 18}" cy="${14 + j * 18}" r="3.2" fill="currentColor"/>`; return s; })() },
  { id: "wave", name: "Onde", cat: "Déco", kind: "svg", w: 120, h: 40, vb: "0 0 150 50", svg: '<path d="M5 25 Q20 2 35 25 T65 25 T95 25 T125 25 T145 25" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' },
  { id: "chevrons", name: "Chevrons »»", cat: "Déco", kind: "svg", w: 90, h: 34, vb: "0 0 150 56", svg: '<g fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"><path d="M10 8L35 28L10 48"/><path d="M50 8L75 28L50 48"/><path d="M90 8L115 28L90 48"/></g>' },
  { id: "arrow", name: "Flèche ↗", cat: "Déco", kind: "svg", svg: GLYPHS.arrow.svg.replace('stroke-width="8"', 'stroke-width="6"') },
  { id: "hex", name: "Hexagone", cat: "Déco", kind: "svg", svg: '<polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="none" stroke="currentColor" stroke-width="4"/>' },
  { id: "checker", name: "Damier", cat: "Déco", kind: "svg", svg: (() => { let s = ""; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2 === 0) s += `<rect x="${5 + i * 15}" y="${5 + j * 15}" width="15" height="15" fill="currentColor"/>`; return s; })() },
  /* --- Technique --- */
  { id: "regmark", name: "Repère d'impression", cat: "Technique", kind: "svg", svg: '<g fill="none" stroke="currentColor" stroke-width="3"><circle cx="50" cy="50" r="24"/><path d="M50 10V90M10 50H90"/></g><circle cx="50" cy="50" r="8" fill="currentColor"/>' },
  { id: "corners", name: "Coins de visée", cat: "Technique", kind: "svg", svg: '<path d="M8 30V8H30M70 8H92V30M92 70V92H70M30 92H8V70" fill="none" stroke="currentColor" stroke-width="5"/>' },
  { id: "barcode", name: "Code-barres", cat: "Technique", kind: "svg", w: 90, h: 34, vb: "0 0 150 56", svg: (() => { let s = "", x = 4; const ws = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 1, 2, 4, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2, 4, 1, 1, 2]; ws.forEach((w, i) => { if (i % 2 === 0) s += `<rect x="${x}" y="4" width="${w * 1.8}" height="48" fill="currentColor"/>`; x += w * 1.8 + 1.2; }); return s; })() },
  { id: "ruler", name: "Règle graduée", cat: "Technique", kind: "svg", w: 140, h: 22, vb: "0 0 200 30", svg: (() => { let s = '<path d="M2 28H198" stroke="currentColor" stroke-width="2"/>'; for (let i = 0; i <= 20; i++) s += `<path d="M${2 + i * 9.8} 28V${i % 5 === 0 ? 6 : 16}" stroke="currentColor" stroke-width="2"/>`; return s; })() },
  { id: "plusgrid", name: "Grille de croix", cat: "Technique", kind: "svg", svg: (() => { let s = ""; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = 14 + i * 24, y = 14 + j * 24; s += `<path d="M${x - 5} ${y}H${x + 5}M${x} ${y - 5}V${y + 5}" stroke="currentColor" stroke-width="2.5"/>`; } return s; })() },
  { id: "jp", name: "Kanji デザイン", cat: "Technique", kind: "text", props: { text: "デザイン", font: "Noto Sans JP", size: 34, weight: 900, italic: false } },
  { id: "serial", name: "Code série", cat: "Technique", kind: "text", props: { text: "OUT-001 · V.01 · 2026", font: "JetBrains Mono", size: 12, weight: 600, italic: false, ls: 1.5 } },
];

/* ---------- palettes (fond de carte : couleur 1 → couleur 2) ---------- */
const PALETTES = [
  ["#16326c", "#08122b"], ["#0e5e6f", "#04202a"], ["#5b2a86", "#150a26"], ["#8a1c2b", "#1e0509"],
  ["#c2571a", "#2a0d02"], ["#1f6f43", "#04170c"], ["#b8b9c6", "#3a3c4a"], ["#111216", "#000000"],
];

/* ---------- modèles ----------
   texte : x,y = haut-gauche de la boîte ; ligne de base = y + 0.8 × taille */
const NAVY = "#0c1a36";
function baseLayers(o = {}) {
  return [
    { type: "rect", name: "Fond de carte", role: "bg", x: 0, y: 0, w: CARD_W, h: CARD_H, fill: o.bg1 || "#16326c", fill2: o.bg2 || "#08122b", angle: 180, radius: 0, locked: true },
    { type: "image", name: "Illustration", role: "art", x: 0, y: 0, w: CARD_W, h: o.artH || 746, src: o.art || ASSETS.art, fit: "cover", fx: { gray: 0, contrast: 1, bright: 1, sat: 1 } },
    { type: "rect", name: "Fondu bas", role: "fade", x: 0, y: 480, w: CARD_W, h: 558, fill: "rgba(12,27,61,0)", fill2: "#0c1b3d", angle: 180, stops: [0, 0.32], radius: 0 },
    { type: "image", name: "Cadre argent", role: "frame", x: 0, y: 0, w: CARD_W, h: CARD_H, src: ASSETS.frame, fit: "stretch", locked: true },
    { type: "image", name: "Logo", role: "logo", x: 35.7, y: 17, w: 57, h: 57, src: "{{LOGO}}", fit: "contain", white: true },
    { type: "text", name: "Marque", x: 90.4, y: 37.9, text: o.brand || "Outcome", font: "Poppins", size: 18.4, weight: 600, italic: false, color: "#ffffff" },
    { type: "text", name: "Nom", x: 183.8, y: 30.5, text: o.name || "ALI", font: "Poppins", size: 59.2, weight: 900, italic: true, ls: -0.6, color: NAVY },
    { type: "hp", name: "HP + icône", x: 497, y: 30.2, w: 214.5, h: 59, label: "HP", value: o.hp || "150", font: "Poppins", size: 50.4, color: "#ffffff", icon: "inf", iconColor: "#45e3c6" },
  ];
}
function footLayers(o = {}) {
  return [
    { type: "text", name: "Numéro", x: 62.7, y: 983.7, text: (o.num || "001/020") + "  ◆", font: "Poppins", size: 19.2, weight: 600, italic: false, color: "#ffffff" },
    { type: "badge", name: "Rareté", x: 566, y: 946, w: 149, h: 52, text: o.rar || "UR", font: "Poppins", size: 33, color: "#ffffff", laurels: true, laurelColor: "#efe3c8" },
  ];
}
function attackLayer(name, cost, nm, dmg, yc, glyph = "logo") {
  return { type: "attack", name, x: 60, y: yc - 25, w: 608.6, h: 50, cost, glyph, text: nm, dmg, font: "Poppins", size: 33.1, color: "#ffffff", ring: "#e6eefb", iconSize: 41, iconCx: 54.3, nameX: 147.7 };
}
const TEMPLATES = [
  {
    id: "ur2", name: "Outcome UR", sub: "2 attaques · ALI 001/020", num: "01",
    layers: () => [
      ...baseLayers({ name: "ALI" }),
      attackLayer("Attaque 1", 1, "Prediction", "40", 732.8),
      { type: "rule", name: "Filet 1", x: 112, y: 765.5, w: 553, h: 3, color: "#e1ebff" },
      attackLayer("Attaque 2", 2, "Outcome", "100", 804.5),
      { type: "rule", name: "Filet 2", x: 76.6, y: 844.5, w: 580, h: 3, color: "#e1ebff" },
      { type: "text", name: "Description", x: 84, y: 868.4, text: "A calculated bet, a decisive move.", font: "Poppins", size: 19.2, weight: 400, italic: true, color: "#dde5f5" },
      ...footLayers(),
    ],
  },
  {
    id: "ur2-jack", name: "Outcome UR", sub: "Narrative / Amplify · JACK 004/020", num: "02",
    layers: () => [
      ...baseLayers({ name: "JACK", bg1: "#3b1f7a", bg2: "#0d0a2a" }),
      attackLayer("Attaque 1", 1, "Narrative", "40", 732.8),
      { type: "rule", name: "Filet 1", x: 112, y: 765.5, w: 553, h: 3, color: "#e1ebff" },
      attackLayer("Attaque 2", 2, "Amplify", "100", 804.5),
      { type: "rule", name: "Filet 2", x: 76.6, y: 844.5, w: 580, h: 3, color: "#e1ebff" },
      { type: "text", name: "Description", x: 84, y: 868.4, text: "The outcome is inevitable.", font: "Poppins", size: 19.2, weight: 400, italic: true, color: "#dde5f5" },
      ...footLayers({ num: "004/020" }),
    ],
  },
  {
    id: "sr1", name: "Outcome SR", sub: "1 attaque · description longue", num: "03",
    layers: () => [
      ...baseLayers({ name: "NOVA", hp: "120", bg1: "#0e5e6f", bg2: "#04202a" }),
      attackLayer("Attaque", 2, "Signal Boost", "90", 745),
      { type: "rule", name: "Filet", x: 76.6, y: 785, w: 580, h: 3, color: "#e1ebff" },
      { type: "text", name: "Description", x: 84, y: 808, w: 580, wrap: true, lh: 1.35, text: "Si tu as la bonne lecture du marché, pioche 2 cartes. Les gagnants voient avant les autres.", font: "Poppins", size: 19.2, weight: 400, italic: true, color: "#dde5f5" },
      ...footLayers({ num: "007/020", rar: "SR" }),
    ],
  },
  {
    id: "full", name: "Full art", sub: "illustration seule · nom + rareté", num: "04",
    layers: () => [
      ...baseLayers({ name: "ALI", artH: CARD_H, art: ASSETS.art }).filter((l) => l.role !== "fade"),
      { type: "rect", name: "Fondu lisibilité", role: "fade", x: 0, y: 760, w: CARD_W, h: 278, fill: "rgba(8,18,45,0)", fill2: "rgba(8,18,45,.85)", angle: 180, radius: 0 },
      ...footLayers({ num: "020/020", rar: "SAR" }),
    ],
  },
  {
    id: "blank", name: "Carte vierge", sub: "fond + cadre + illustration", num: "05",
    layers: () => baseLayers({ name: "NOM" }).filter((l) => ["bg", "art", "fade", "frame"].includes(l.role)),
  },
];
