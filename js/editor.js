/* Card Studio — éditeur de cartes (vanilla, 100 % statique).
   Modèle : project.layers[] (index 0 = derrière). Rendu : un seul <svg viewBox="0 0 747 1038">.
   Sélection / poignées / guides : overlay HTML au-dessus. Export : SVG autonome (images + polices embarquées) → PNG. */
"use strict";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const LS_KEY = "cardstudio.editor.v1";
const FONTS = ["Poppins", "Montserrat", "Exo 2", "Barlow Condensed", "Anton", "Bebas Neue", "Russo One", "Archivo Black", "Space Grotesk", "JetBrains Mono", "Noto Sans JP"];
const TYPE_LABEL = { text: "TEXTE", image: "IMAGE", rect: "FORME", ellipse: "FORME", rule: "FILET", svg: "MICROGRAPHIC", attack: "ATTAQUE", badge: "RARETÉ", hp: "HP" };
const TYPE_ICON = { text: "T", image: "🖼", rect: "□", ellipse: "○", rule: "—", svg: "✦", attack: "⚔", badge: "◈", hp: "♥" };
const GRID = CARD_W / 24;

const svgEl = $("#cardSvg");
const overlay = $("#overlay");
const wrap = $("#canvasWrap");
const stage = $("#stage");

let project = null;
let sel = []; /* ids sélectionnés */
let zoom = 1;
let hist = [];
let hIndex = -1;
let clipboard = null;
let editing = null;
let saveTimer = null;
let commitTimer = null;

/* ================= utilitaires ================= */
const uid = () => "l" + Math.random().toString(36).slice(2, 9);
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const r2 = (v) => Math.round(v * 10) / 10;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const byId = (id) => project.layers.find((l) => l.id === id);
const selLayers = () => sel.map(byId).filter(Boolean);
function toast(msg, ms = 2200) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.hidden = true), ms);
}
function logoUrl() { return project.logo || ASSETS.logo; }

function withDefaults(l) {
  const d = { id: uid(), rot: 0, opacity: 1, hidden: false, locked: false, x: 0, y: 0, w: 100, h: 100 };
  const o = Object.assign(d, JSON.parse(JSON.stringify(l)));
  if (o.type === "text") Object.assign(o, Object.assign({ font: "Poppins", size: 24, weight: 600, italic: false, ls: 0, lh: 1.15, color: "#ffffff", align: "left", wrap: false, shadow: false }, o));
  if (o.type === "svg" && !o.svg) {
    const mg = MICRO.find((m) => m.id === o.mg);
    if (mg) { o.svg = mg.svg; o.vb = mg.vb || "0 0 100 100"; }
  }
  if (o.type === "svg") o.vb = o.vb || "0 0 100 100";
  return o;
}
function projectFromTemplate(t) {
  return {
    app: "card-studio-editor", v: 1, name: t.name + (t.sub ? " — " + t.sub.split("·").pop().trim() : ""),
    logo: project ? project.logo : null, uploads: project ? project.uploads : [],
    finish: { grain: 0 }, showGrid: false, snapGrid: false,
    layers: t.layers().map(withDefaults),
  };
}

/* ================= mesure du texte ================= */
const mctx = document.createElement("canvas").getContext("2d");
function fontStr(font, size, weight, italic) { return `${italic ? "italic " : ""}${weight || 400} ${size}px "${font || "Poppins"}"`; }
function textW(str, font, size, weight, italic, ls = 0) {
  mctx.font = fontStr(font, size, weight, italic);
  try { mctx.letterSpacing = ls + "px"; } catch (e) {}
  return mctx.measureText(str).width;
}
function textLines(l) {
  const paras = String(l.text ?? "").split("\n");
  if (!l.wrap) return paras;
  const out = [];
  for (const p of paras) {
    const words = p.split(/(\s+)/);
    let line = "";
    for (const w of words) {
      const t = line + w;
      if (line && textW(t.trimEnd(), l.font, l.size, l.weight, l.italic, l.ls) > l.w) { out.push(line.trimEnd()); line = w.trimStart(); }
      else line = t;
    }
    out.push(line.trimEnd());
  }
  return out;
}
/* recalcule la boîte des calques à taille automatique (texte non contraint, HP, badge) */
function autoSize(l) {
  if (l.type === "text") {
    const lines = textLines(l);
    if (!l.wrap) {
      const nw = Math.max(8, ...lines.map((s) => textW(s, l.font, l.size, l.weight, l.italic, l.ls))) + 2;
      if (l.align === "right") l.x += l.w - nw;
      else if (l.align === "center") l.x += (l.w - nw) / 2;
      l.w = nw;
    }
    l.h = l.size * (1 + (lines.length - 1) * (l.lh || 1.15)) + l.size * 0.12;
    l._lines = lines;
  } else if (l.type === "hp") {
    const nw = textW(l.label || "", l.font, l.size * 0.4, 800, true) + l.size * 0.12 + textW(l.value || "", l.font, l.size, 800, true, -1) + 4;
    l.x += l.w - nw;
    l.w = nw;
    l.h = l.size;
  } else if (l.type === "badge") {
    const lw = l.laurels ? l.h * 0.5 + 2 : 0;
    const inner = Math.max(l.size * 2.82, textW(l.text || "", l.font, l.size, 900, true) + l.size * 0.9);
    const nw = inner + 2 * lw;
    l.x += (l.w - nw) / 2;
    l.w = nw;
  }
}

/* ================= rendu SVG ================= */
function gradVec(a) {
  const r = (a * Math.PI) / 180;
  return { x1: 50 - 50 * Math.sin(r), y1: 50 + 50 * Math.cos(r), x2: 50 + 50 * Math.sin(r), y2: 50 - 50 * Math.cos(r) };
}
function logoImg(x, y, s, idp, white) {
  return `<image href="${esc(logoUrl())}" x="${x}" y="${y}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid meet"${white ? ` filter="url(#${idp}-white)"` : ""}/>`;
}
function mgMarkup(markup, idp) {
  return String(markup || "")
    .replace(/\{\{LOGO_WHITE\}\}/g, logoImg(19, 19, 62, idp, true))
    .replace(/\{\{LOGO_TEAL\}\}/g, logoImg(20, 20, 60, idp, false));
}
function glyphMarkup(g, cx, cy, d, idp) {
  const s = d * 0.62;
  if (g === "logo") return logoImg(r2(cx - s / 2), r2(cy - s / 2), r2(s), idp, true);
  const gl = GLYPHS[g] || GLYPHS.inf;
  return `<svg x="${r2(cx - s / 2)}" y="${r2(cy - s / 2)}" width="${r2(s)}" height="${r2(s)}" viewBox="0 0 100 100" color="#ffffff" overflow="visible">${gl.svg}</svg>`;
}
function textAttrs(font, size, weight, italic, ls, fill) {
  return `font-family="${esc(font)}" font-size="${r2(size)}" font-weight="${weight}" font-style="${italic ? "italic" : "normal"}"${ls ? ` letter-spacing="${ls}"` : ""} fill="${esc(fill)}"`;
}

function renderLayer(l, idp, defs) {
  const { x, y, w, h } = l;
  let body = "";
  const hit = `<rect x="${x}" y="${y}" width="${Math.max(w, 1)}" height="${Math.max(h, 1)}" fill="transparent" pointer-events="all"/>`;
  switch (l.type) {
    case "image": {
      const par = l.fit === "stretch" ? "none" : `${l.alignX || "xMid"}${l.alignY || "YMid"} ${l.fit === "contain" ? "meet" : "slice"}`;
      let filt = "";
      if (l.white) filt = ` filter="url(#${idp}-white)"`;
      else if (l.fx && (l.fx.gray || l.fx.contrast !== 1 || l.fx.bright !== 1 || l.fx.sat !== 1)) {
        const f = l.fx, c = f.contrast ?? 1, b = f.bright ?? 1, sat = (f.sat ?? 1) * (1 - (f.gray || 0));
        const fn = (t) => `<feFunc${t} type="linear" slope="${(c * b).toFixed(3)}" intercept="${((0.5 - 0.5 * c) * b).toFixed(3)}"/>`;
        defs.push(`<filter id="${idp}-fx-${l.id}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="${sat.toFixed(3)}"/><feComponentTransfer>${fn("R")}${fn("G")}${fn("B")}</feComponentTransfer></filter>`);
        filt = ` filter="url(#${idp}-fx-${l.id})"`;
      }
      const src = l.src === "{{LOGO}}" ? logoUrl() : l.src;
      body = `<image href="${esc(src)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="${par}"${filt}/>`;
      break;
    }
    case "rect":
    case "ellipse": {
      let fill = l.fill || "#ffffff";
      if (l.fill2) {
        const v = gradVec(l.angle ?? 180), st = l.stops || [0, 1];
        defs.push(`<linearGradient id="${idp}-g-${l.id}" x1="${v.x1}%" y1="${v.y1}%" x2="${v.x2}%" y2="${v.y2}%"><stop offset="${st[0]}" stop-color="${esc(l.fill)}"/><stop offset="${st[1]}" stop-color="${esc(l.fill2)}"/></linearGradient>`);
        fill = `url(#${idp}-g-${l.id})`;
      }
      const stroke = l.strokeW ? ` stroke="${esc(l.stroke || "#ffffff")}" stroke-width="${l.strokeW}"` : "";
      body = l.type === "rect"
        ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${l.radius || 0}" fill="${fill}"${stroke}/>`
        : `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${fill}"${stroke}/>`;
      break;
    }
    case "rule": {
      const c = esc(l.color || "#e1ebff");
      defs.push(`<linearGradient id="${idp}-g-${l.id}"><stop offset="0" stop-color="${c}" stop-opacity=".35"/><stop offset=".15" stop-color="${c}" stop-opacity=".9"/><stop offset=".85" stop-color="${c}" stop-opacity=".9"/><stop offset="1" stop-color="${c}" stop-opacity=".2"/></linearGradient>`);
      body = hit + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="url(#${idp}-g-${l.id})"/>`;
      break;
    }
    case "svg":
      body = hit + `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${l.vb || "0 0 100 100"}" preserveAspectRatio="none" color="${esc(l.color || "#ffffff")}" overflow="visible">${mgMarkup(l.svg, idp)}</svg>`;
      break;
    case "text": {
      const lines = l._lines || textLines(l);
      const anchor = l.align === "center" ? "middle" : l.align === "right" ? "end" : "start";
      const ax = l.align === "center" ? x + w / 2 : l.align === "right" ? x + w : x;
      const lh = l.size * (l.lh || 1.15);
      const tsp = lines.map((s, i) => `<tspan x="${r2(ax)}" y="${r2(y + l.size * 0.8 + i * lh)}">${esc(s) || " "}</tspan>`).join("");
      body = hit + `<text text-anchor="${anchor}" ${textAttrs(l.font, l.size, l.weight, l.italic, l.ls, l.color)}${l.shadow ? ` filter="url(#${idp}-sh)"` : ""} xml:space="preserve">${tsp}</text>`;
      break;
    }
    case "hp":
      body = hit + `<text x="${r2(x + w)}" y="${r2(y + l.size * 0.8)}" text-anchor="end" ${textAttrs(l.font, l.size, 800, true, 0, l.color)}><tspan font-size="${r2(l.size * 0.4)}">${esc(l.label)}</tspan><tspan dx="${r2(l.size * 0.12)}" letter-spacing="-1">${esc(l.value)}</tspan></text>`;
      break;
    case "badge": {
      const lw = l.laurels ? h * 0.5 : 0, g = l.laurels ? 2 : 0;
      const bx = x + lw + g, bw = w - 2 * (lw + g), by = y + h * 0.07, bh = h * 0.86, rx = bh * 0.2;
      let lau = "";
      if (l.laurels) {
        const lp = LAUREL_PATH(esc(l.laurelColor || "#efe3c8"));
        lau = `<svg x="${x}" y="${y}" width="${lw}" height="${h}" viewBox="0 0 20 40" preserveAspectRatio="none">${lp}</svg>` +
          `<g transform="translate(${r2(2 * x + w)} 0) scale(-1 1)"><svg x="${x}" y="${y}" width="${lw}" height="${h}" viewBox="0 0 20 40" preserveAspectRatio="none">${lp}</svg></g>`;
      }
      body = hit + lau +
        `<rect x="${r2(bx)}" y="${r2(by)}" width="${r2(bw)}" height="${r2(bh)}" rx="${r2(rx)}" fill="rgba(8,18,45,.55)" stroke="${esc(l.color)}" stroke-width="${r2(l.size * 0.07)}"/>` +
        `<rect x="${r2(bx + l.size * 0.12)}" y="${r2(by + l.size * 0.12)}" width="${r2(bw - l.size * 0.24)}" height="${r2(bh - l.size * 0.24)}" rx="${r2(rx * 0.7)}" fill="none" stroke="rgba(210,222,245,.5)" stroke-width="${r2(l.size * 0.045)}"/>` +
        `<text x="${r2(bx + bw / 2)}" y="${r2(y + h / 2 + l.size * 0.35)}" text-anchor="middle" ${textAttrs(l.font, l.size, 900, true, 0, l.color)}>${esc(l.text)}</text>`;
      break;
    }
    case "attack": {
      const d = l.iconSize, gap = d * 0.18, cy = h / 2, n = clamp(l.cost | 0, 0, 6);
      const tot = n * d + Math.max(0, n - 1) * gap;
      const start = Math.max(l.iconCx - tot / 2, d * 0.1); /* jamais hors de la ligne */
      const nameX = Math.max(l.nameX, start + tot + d * 0.45); /* le nom recule si les jetons débordent */
      let icons = "";
      for (let i = 0; i < n; i++) {
        const cx = start + d / 2 + i * (d + gap), sw = d * 0.085;
        icons += `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(d / 2 - sw / 2)}" fill="rgba(8,18,45,.35)" stroke="${esc(l.ring || "#e6eefb")}" stroke-width="${r2(sw)}"/>` + glyphMarkup(l.glyph || "logo", cx, cy, d, idp);
      }
      const base = r2(cy + l.size * 0.35);
      body = `<g transform="translate(${r2(x)} ${r2(y)})"><rect width="${w}" height="${h}" fill="transparent" pointer-events="all"/>${icons}` +
        `<text x="${r2(nameX)}" y="${base}" ${textAttrs(l.font, l.size, 800, true, -0.3, l.color)} filter="url(#${idp}-sh)">${esc(l.text)}</text>` +
        (l.dmg ? `<text x="${r2(w)}" y="${base}" text-anchor="end" ${textAttrs(l.font, l.size, 800, true, 0, l.color)} filter="url(#${idp}-sh)">${esc(l.dmg)}</text>` : "") + "</g>";
      break;
    }
  }
  const cx = x + w / 2, cy = y + h / 2;
  const tr = l.rot ? ` transform="rotate(${r2(l.rot)} ${r2(cx)} ${r2(cy)})"` : "";
  const op = l.opacity !== 1 ? ` opacity="${l.opacity}"` : "";
  const pe = l.locked ? ` pointer-events="none"` : "";
  return `<g data-id="${l.id}"${tr}${op}${pe}>${body}</g>`;
}

function renderSVG(p, idp) {
  const defs = [
    `<clipPath id="${idp}-clip"><path d="M55,0H692A55,58 0 0 1 747,58V992A48,46 0 0 1 699,1038H48A48,46 0 0 1 0,992V58A55,58 0 0 1 55,0Z"/></clipPath>`,
    `<filter id="${idp}-white" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>`,
    `<filter id="${idp}-sh" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="1.3" stdDeviation="2" flood-color="#000014" flood-opacity=".5"/></filter>`,
    `<filter id="${idp}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>`,
  ];
  let body = "";
  for (const l of p.layers) {
    if (l.hidden) continue;
    body += renderLayer(l, idp, defs);
  }
  const g = p.finish && p.finish.grain ? `<rect width="${CARD_W}" height="${CARD_H}" filter="url(#${idp}-grain)" opacity="${p.finish.grain}" style="mix-blend-mode:overlay" pointer-events="none"/>` : "";
  return `<defs>${defs.join("")}</defs><g clip-path="url(#${idp}-clip)">${body}${g}</g>`;
}

function renderCanvas() {
  for (const l of project.layers) autoSize(l);
  svgEl.innerHTML = renderSVG(project, "c");
  drawOverlay();
}
function render() {
  renderCanvas();
  renderLayersPanel();
  renderInspector();
  $("#metaName").textContent = (project.name || "CARTE").toUpperCase();
  $("#docName").value = project.name || "";
}

/* ================= historique + sauvegarde ================= */
function snapshot() {
  return JSON.stringify(project, (k, v) => (k.startsWith("_") ? undefined : v));
}
function commit() {
  clearTimeout(commitTimer);
  const s = snapshot();
  if (hist[hIndex] === s) return;
  hist = hist.slice(0, hIndex + 1);
  hist.push(s);
  if (hist.length > 120) hist.shift();
  hIndex = hist.length - 1;
  scheduleSave();
}
function commitSoon() { clearTimeout(commitTimer); commitTimer = setTimeout(commit, 450); }
function restore(s) {
  project = JSON.parse(s);
  sel = sel.filter((id) => byId(id));
  render();
  scheduleSave();
}
function undo() { if (hIndex > 0) { hIndex--; restore(hist[hIndex]); } }
function redo() { if (hIndex < hist.length - 1) { hIndex++; restore(hist[hIndex]); } }
function scheduleSave() {
  $("#saveState").textContent = "… enregistrement";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(LS_KEY, snapshot());
      $("#saveState").textContent = "✓ Enregistré sur cet appareil";
    } catch (e) {
      $("#saveState").textContent = "⚠ Trop lourd pour l'autosave — pense à 💾 Enregistrer";
    }
  }, 500);
}

/* ================= zoom ================= */
function setZoom(z) {
  zoom = clamp(z, 0.15, 3);
  svgEl.setAttribute("width", r2(CARD_W * zoom));
  svgEl.setAttribute("height", r2(CARD_H * zoom));
  wrap.style.width = CARD_W * zoom + "px";
  wrap.style.height = CARD_H * zoom + "px";
  $("#zoomVal").textContent = Math.round(zoom * 100) + "%";
  drawOverlay();
}
function zoomFit() {
  const r = stage.getBoundingClientRect();
  setZoom(Math.min((r.width - 50) / CARD_W, (r.height - 50) / CARD_H));
}

/* ================= overlay : sélection, poignées, guides ================= */
function boxStyle(el, l) {
  el.style.left = l.x * zoom + "px";
  el.style.top = l.y * zoom + "px";
  el.style.width = l.w * zoom + "px";
  el.style.height = l.h * zoom + "px";
  el.style.transform = l.rot ? `rotate(${l.rot}deg)` : "";
}
const HANDLES = { nw: [0, 0], n: [0.5, 0], ne: [1, 0], e: [1, 0.5], se: [1, 1], s: [0.5, 1], sw: [0, 1], w: [0, 0.5] };
const CURSORS = { nw: "nwse-resize", se: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize" };
function drawOverlay() {
  overlay.querySelectorAll(".selbox,.grid-ov").forEach((e) => e.remove());
  if (project.showGrid) {
    const g = document.createElement("div");
    g.className = "grid-ov";
    g.style.backgroundSize = `${GRID * zoom}px ${GRID * zoom}px`;
    overlay.prepend(g);
  }
  const ls = selLayers();
  for (const l of ls) {
    const b = document.createElement("div");
    b.className = "selbox" + (ls.length > 1 || l.locked ? " multi" : "");
    boxStyle(b, l);
    if (ls.length === 1 && !l.locked) {
      for (const [k, [fx, fy]] of Object.entries(HANDLES)) {
        if (l.type === "text" && !l.wrap && (k === "n" || k === "s")) continue;
        const h = document.createElement("i");
        h.className = "h";
        h.dataset.h = k;
        h.style.left = fx * 100 + "%";
        h.style.top = fy * 100 + "%";
        h.style.cursor = CURSORS[k];
        b.appendChild(h);
      }
      const stem = document.createElement("i");
      stem.className = "stem";
      const rot = document.createElement("i");
      rot.className = "h rot";
      rot.dataset.h = "rot";
      rot.style.left = "50%";
      rot.style.top = "-26px";
      rot.title = "Rotation (Shift = pas de 15°)";
      b.append(stem, rot);
    }
    overlay.appendChild(b);
  }
}
function clearGuides() { overlay.querySelectorAll(".guide").forEach((g) => g.remove()); }
function showGuide(kind, v) {
  const g = document.createElement("div");
  g.className = "guide " + kind;
  if (kind === "v") g.style.left = v * zoom + "px";
  else g.style.top = v * zoom + "px";
  overlay.appendChild(g);
}

/* ================= interactions sur la toile ================= */
function cardPt(e) {
  const r = svgEl.getBoundingClientRect();
  return { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom };
}
function layerFromEvent(e) {
  const g = e.target.closest && e.target.closest("[data-id]");
  return g ? byId(g.dataset.id) : null;
}
function select(ids, additive = false) {
  if (additive) {
    for (const id of ids) sel = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id];
  } else sel = ids;
  drawOverlay();
  renderLayersPanel();
  renderInspector();
}

function snapMove(boxes, dx, dy, shift) {
  /* boxes : positions de départ ; renvoie dx/dy aimantés + guides */
  if (shift) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
  const minX = Math.min(...boxes.map((b) => b.x)) + dx, maxX = Math.max(...boxes.map((b) => b.x + b.w)) + dx;
  const minY = Math.min(...boxes.map((b) => b.y)) + dy, maxY = Math.max(...boxes.map((b) => b.y + b.h)) + dy;
  const guides = [];
  if (project.snapGrid) {
    dx += Math.round(minX / GRID) * GRID - minX;
    dy += Math.round(minY / GRID) * GRID - minY;
    return { dx, dy, guides };
  }
  const thr = 6 / zoom;
  const xs = [0, CARD_W / 2, CARD_W], ys = [0, CARD_H / 2, CARD_H];
  for (const l of project.layers) {
    if (sel.includes(l.id) || l.hidden || (l.w >= CARD_W - 1 && l.h >= CARD_H - 1)) continue;
    xs.push(l.x, l.x + l.w / 2, l.x + l.w);
    ys.push(l.y, l.y + l.h / 2, l.y + l.h);
  }
  const best = (cands, vals) => {
    let bd = thr + 1, bv = null, off = 0;
    for (const c of cands) for (const v of vals) { const d = c - v; if (Math.abs(d) < Math.abs(bd)) { bd = d; bv = c; off = d; } }
    return Math.abs(bd) <= thr ? { off, line: bv } : null;
  };
  if (!(shift && dx === 0)) {
    const sx = best(xs, [minX, (minX + maxX) / 2, maxX]);
    if (sx) { dx += sx.off; guides.push(["v", sx.line]); }
  }
  if (!(shift && dy === 0)) {
    const sy = best(ys, [minY, (minY + maxY) / 2, maxY]);
    if (sy) { dy += sy.off; guides.push(["h", sy.line]); }
  }
  return { dx, dy, guides };
}

function startDrag(e, onMove, onUp) {
  const start = { x: e.clientX, y: e.clientY };
  let moved = false;
  const mv = (ev) => {
    const dx = (ev.clientX - start.x) / zoom, dy = (ev.clientY - start.y) / zoom;
    if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 3) return;
    moved = true;
    onMove(dx, dy, ev);
  };
  const up = (ev) => {
    window.removeEventListener("pointermove", mv);
    window.removeEventListener("pointerup", up);
    clearGuides();
    onUp && onUp(moved, ev);
  };
  window.addEventListener("pointermove", mv);
  window.addEventListener("pointerup", up);
}

svgEl.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || editing) return;
  const l = layerFromEvent(e);
  if (!l) { select([]); return; }
  e.preventDefault();
  if (e.shiftKey) { select([l.id], true); return; }
  if (!sel.includes(l.id)) select([l.id]);
  const movers = selLayers().filter((x) => !x.locked);
  const starts = movers.map((x) => ({ x: x.x, y: x.y, w: x.w, h: x.h }));
  startDrag(e, (dx, dy, ev) => {
    const s = snapMove(starts, dx, dy, ev.shiftKey);
    movers.forEach((m, i) => { m.x = r2(starts[i].x + s.dx); m.y = r2(starts[i].y + s.dy); });
    renderCanvas();
    clearGuides();
    s.guides.forEach(([k, v]) => showGuide(k, v));
    syncGeomFields();
  }, (moved) => { if (moved) { commit(); renderInspector(); } });
});
stage.addEventListener("pointerdown", (e) => {
  if (e.target === stage || e.target === wrap) select([]);
});

/* poignées : redimensionner / tourner */
overlay.addEventListener("pointerdown", (e) => {
  const h = e.target.closest(".h");
  if (!h) return;
  e.preventDefault();
  e.stopPropagation();
  const l = selLayers()[0];
  if (!l) return;
  const k = h.dataset.h;
  const s0 = JSON.parse(JSON.stringify(l));
  const cx = s0.x + s0.w / 2, cy = s0.y + s0.h / 2;
  if (k === "rot") {
    startDrag(e, (dx, dy, ev) => {
      const p = cardPt(ev);
      let a = (Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI + 90;
      if (ev.shiftKey) a = Math.round(a / 15) * 15;
      a = ((a + 540) % 360) - 180;
      l.rot = Math.abs(a) < 1.5 ? 0 : r2(a);
      renderCanvas();
      syncGeomFields();
    }, (m) => m && commit());
    return;
  }
  const uniform = ["text", "attack", "hp", "badge"].includes(l.type) && k.length === 2;
  const rad = (-(s0.rot || 0) * Math.PI) / 180;
  startDrag(e, (dx, dy, ev) => {
    /* delta dans le repère du calque (tient compte de la rotation) */
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
    let nx = s0.x, ny = s0.y, nw = s0.w, nh = s0.h;
    if (k.includes("e")) nw = s0.w + lx;
    if (k.includes("w")) { nw = s0.w - lx; nx = s0.x + lx; }
    if (k.includes("s")) nh = s0.h + ly;
    if (k.includes("n")) { nh = s0.h - ly; ny = s0.y + ly; }
    if (uniform || (ev.shiftKey && k.length === 2)) {
      const f = Math.max(nw / s0.w, nh / s0.h);
      nw = s0.w * f; nh = s0.h * f;
      if (k.includes("w")) nx = s0.x + s0.w - nw;
      if (k.includes("n")) ny = s0.y + s0.h - nh;
    }
    nw = Math.max(6, nw); nh = Math.max(3, nh);
    applyResize(l, s0, k, nx, ny, nw, nh, uniform);
    renderCanvas();
    syncGeomFields();
  }, (m) => { if (m) { commit(); renderInspector(); } });
});
function applyResize(l, s0, k, nx, ny, nw, nh, uniform) {
  const f = nw / s0.w;
  if (l.type === "text") {
    if (uniform) { l.size = r2(s0.size * f); l.x = r2(nx); l.y = r2(ny); if (s0.wrap) l.w = r2(nw); }
    else if (k === "e" || k === "w") { l.wrap = true; l.w = r2(nw); l.x = r2(nx); }
    return;
  }
  if (l.type === "attack") {
    if (uniform) {
      for (const p of ["size", "iconSize", "iconCx", "nameX"]) l[p] = r2(s0[p] * f);
      l.w = r2(nw); l.h = r2(s0.h * f); l.x = r2(nx); l.y = r2(ny);
    } else if (k === "e" || k === "w") { l.w = r2(nw); l.x = r2(nx); }
    return;
  }
  if (l.type === "hp" || l.type === "badge") {
    const ff = (k === "n" || k === "s") ? nh / s0.h : f;
    l.size = r2(s0.size * ff); l.h = r2(s0.h * ff); l.w = r2(s0.w * ff);
    l.x = r2(k.includes("w") ? s0.x + s0.w - l.w : nx); l.y = r2(k.includes("n") ? s0.y + s0.h - l.h : ny);
    return;
  }
  l.x = r2(nx); l.y = r2(ny); l.w = r2(nw); l.h = r2(nh);
}

/* survol */
svgEl.addEventListener("pointermove", (e) => {
  overlay.querySelectorAll(".hoverbox").forEach((x) => x.remove());
  const l = layerFromEvent(e);
  if (!l || sel.includes(l.id) || e.buttons) return;
  const b = document.createElement("div");
  b.className = "hoverbox";
  boxStyle(b, l);
  overlay.appendChild(b);
});
svgEl.addEventListener("pointerleave", () => overlay.querySelectorAll(".hoverbox").forEach((x) => x.remove()));

/* ================= édition de texte en place (double-clic) ================= */
svgEl.addEventListener("dblclick", (e) => {
  const l = layerFromEvent(e);
  if (!l || l.locked) return;
  if (l.type === "image" || l.type === "svg") { if (l.type === "image") pickImageFor(l); return; }
  let field = "text";
  if (l.type === "hp") field = "value";
  if (l.type === "attack" && l.dmg) {
    const p = cardPt(e);
    if (p.x - l.x > l.w - textW(l.dmg, l.font, l.size, 800, true) - 16) field = "dmg";
  }
  if (!["text", "attack", "hp", "badge"].includes(l.type)) return;
  startInlineEdit(l, field);
});
function startInlineEdit(l, field) {
  if (editing) return;
  const ta = document.createElement("textarea");
  ta.className = "inline-edit";
  ta.value = l[field] ?? "";
  ta.spellcheck = false;
  let bx = l.x, by = l.y, bw = l.w, bh = l.h, size = l.size, weight = l.weight || 800, italic = l.type !== "text" || l.italic;
  if (l.type === "attack") {
    if (field === "dmg") { bw = Math.max(80, textW(l.dmg, l.font, l.size, 800, true) + 30); bx = l.x + l.w - bw; }
    else { bx = l.x + l.nameX - 4; bw = l.w - l.nameX - 70; }
  }
  if (l.type === "badge") weight = 900;
  Object.assign(ta.style, {
    left: bx * zoom + "px", top: by * zoom + "px", width: Math.max(bw, 60) * zoom + "px", height: Math.max(bh, size * 1.3) * zoom + "px",
    font: `${italic ? "italic " : ""}${weight} ${size * zoom}px/${(l.lh || 1.15)} "${l.font}"`,
    letterSpacing: (l.ls || 0) * zoom + "px", color: l.color || "#fff", textAlign: field === "dmg" ? "right" : l.align || "left",
  });
  overlay.appendChild(ta);
  editing = { l, field, ta, before: ta.value };
  ta.focus();
  ta.select();
  const multi = l.type === "text";
  ta.addEventListener("input", () => { l[field] = ta.value; renderCanvas(); ta.style.height = Math.max(l.h, size * 1.3) * zoom + "px"; if (l.type === "text" && !l.wrap) ta.style.width = (l.w + size) * zoom + "px"; });
  ta.addEventListener("keydown", (ev) => {
    ev.stopPropagation();
    if (ev.key === "Escape") { l[field] = editing.before; endInlineEdit(); }
    if (ev.key === "Enter" && (!multi || !ev.shiftKey) && !(multi && ev.altKey)) { if (!multi || !ev.shiftKey) { ev.preventDefault(); endInlineEdit(); } }
  });
  ta.addEventListener("blur", () => endInlineEdit());
}
function endInlineEdit() {
  if (!editing) return;
  const { ta } = editing;
  editing = null;
  ta.remove();
  renderCanvas();
  renderInspector();
  renderLayersPanel();
  commit();
}

/* ================= panneau Calques ================= */
function renderLayersPanel() {
  const ul = $("#layerList");
  const n = project.layers.length;
  $("#layerCount").textContent = n;
  $("#layerCount2").textContent = n;
  ul.innerHTML = "";
  [...project.layers].reverse().forEach((l) => {
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.id = l.id;
    li.className = (sel.includes(l.id) ? "on " : "") + (l.hidden ? "hidden-l" : "");
    li.innerHTML = `<span class="ico">${TYPE_ICON[l.type] || "•"}</span><span class="nm">${esc(l.name || TYPE_LABEL[l.type])}</span>` +
      `<button class="lb eye" title="Afficher / masquer" aria-label="Afficher ou masquer">${l.hidden ? "◌" : "👁"}</button>` +
      `<button class="lb lock ${l.locked ? "act" : ""}" title="${l.locked ? "Déverrouiller" : "Verrouiller"}" aria-label="Verrouiller">${l.locked ? "🔒" : "🔓"}</button>`;
    li.addEventListener("click", (e) => {
      if (e.target.closest(".eye")) { l.hidden = !l.hidden; renderCanvas(); renderLayersPanel(); commit(); return; }
      if (e.target.closest(".lock")) { l.locked = !l.locked; renderCanvas(); renderLayersPanel(); renderInspector(); commit(); return; }
      if (e.target.tagName === "INPUT") return;
      select([l.id], e.shiftKey);
    });
    li.addEventListener("dblclick", (e) => {
      if (e.target.closest(".lb")) return;
      const nm = li.querySelector(".nm");
      nm.innerHTML = `<input value="${esc(l.name || "")}" />`;
      const inp = nm.querySelector("input");
      inp.focus();
      inp.select();
      const done = () => { l.name = inp.value.trim() || l.name; renderLayersPanel(); commit(); };
      inp.addEventListener("keydown", (ev) => { ev.stopPropagation(); if (ev.key === "Enter") inp.blur(); if (ev.key === "Escape") { inp.value = l.name; inp.blur(); } });
      inp.addEventListener("blur", done);
    });
    li.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", l.id); e.dataTransfer.effectAllowed = "move"; });
    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      const r = li.getBoundingClientRect();
      li.classList.toggle("drop-before", e.clientY < r.top + r.height / 2);
      li.classList.toggle("drop-after", e.clientY >= r.top + r.height / 2);
    });
    li.addEventListener("dragleave", () => li.classList.remove("drop-before", "drop-after"));
    li.addEventListener("drop", (e) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      const before = li.classList.contains("drop-before");
      li.classList.remove("drop-before", "drop-after");
      if (!id || id === l.id) return;
      const moving = byId(id);
      project.layers = project.layers.filter((x) => x.id !== id);
      let idx = project.layers.findIndex((x) => x.id === l.id);
      /* liste affichée inversée : "avant" visuel = au-dessus = index + 1 */
      project.layers.splice(before ? idx + 1 : idx, 0, moving);
      render();
      commit();
    });
    ul.appendChild(li);
  });
}

/* ================= inspecteur ================= */
const ins = $("#inspector");
function h(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function box(title, tag) {
  const b = h(`<div class="card-box"><div class="ins-head"><h3>${title}</h3>${tag ? `<span class="tag">${tag}</span>` : ""}</div></div>`);
  ins.appendChild(b);
  return b;
}
function onEdit(fn, heavy) { return (v) => { fn(v); heavy ? render() : renderCanvas(); commitSoon(); }; }
function fNum(parent, label, get, set, step = 1, cls) {
  const el = h(`<label class="num ${cls || ""}"><i>${label}</i><input type="number" step="${step}" /></label>`);
  const inp = el.querySelector("input");
  inp.value = r2(get());
  inp.dataset.geom = label;
  inp.addEventListener("input", () => { if (inp.value !== "") onEdit(set)(parseFloat(inp.value)); });
  /* glisser sur l'étiquette = régler (façon Figma) */
  el.querySelector("i").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const v0 = get(), x0 = e.clientX;
    const mv = (ev) => { const v = r2(v0 + ((ev.clientX - x0) * step) / (ev.shiftKey ? 0.1 : 1)); set(v); inp.value = v; renderCanvas(); };
    const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); commit(); };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
  });
  el._get = get;
  parent.appendChild(el);
  return el;
}
function fText(parent, label, get, set, area) {
  const el = h(`<label class="f"><span>${label}</span>${area ? '<textarea class="in"></textarea>' : '<input class="in" />'}</label>`);
  const inp = el.querySelector("input,textarea");
  inp.value = get() ?? "";
  inp.addEventListener("input", () => onEdit(set)(inp.value));
  inp.addEventListener("change", () => renderLayersPanel());
  parent.appendChild(el);
  return inp;
}
function fColor(parent, label, get, set) {
  const v = get() || "#ffffff";
  const isHex = /^#[0-9a-f]{6}$/i.test(v);
  const el = h(`<div class="f">${label ? `<span>${label}</span>` : ""}<label class="colorf"><input type="color" value="${isHex ? v : "#ffffff"}" /><input type="text" value="${esc(v)}" spellcheck="false" /></label></div>`);
  const [c, t] = el.querySelectorAll("input");
  c.addEventListener("input", () => { t.value = c.value; onEdit(set)(c.value); });
  t.addEventListener("change", () => { if (/^#[0-9a-f]{6}$/i.test(t.value)) c.value = t.value; onEdit(set)(t.value); });
  parent.appendChild(el);
}
function fRange(parent, label, get, set, min, max, step, fmt = (v) => v) {
  const el = h(`<div class="rng"><div class="top"><span>${label}</span><b></b></div><input type="range" min="${min}" max="${max}" step="${step}" /></div>`);
  const inp = el.querySelector("input"), out = el.querySelector("b");
  inp.value = get();
  out.textContent = fmt(get());
  inp.addEventListener("input", () => { out.textContent = fmt(+inp.value); onEdit(set)(+inp.value); });
  parent.appendChild(el);
}
function fToggle(parent, label, get, set, heavy) {
  const el = h(`<div class="tog"><span>${label}</span><label class="switch"><input type="checkbox" /><span></span></label></div>`);
  const inp = el.querySelector("input");
  inp.checked = !!get();
  inp.addEventListener("change", () => onEdit(set, heavy)(inp.checked));
  parent.appendChild(el);
}
function fSelect(parent, label, opts, get, set, heavy) {
  const el = h(`<label class="f">${label ? `<span>${label}</span>` : ""}<select class="sel"></select></label>`);
  const s = el.querySelector("select");
  for (const o of opts) { const [v, t] = Array.isArray(o) ? o : [o, o]; s.add(new Option(t, v)); }
  s.value = get();
  s.addEventListener("change", () => onEdit(set, heavy)(s.value));
  parent.appendChild(el);
  return s;
}
function row(parent, cls = "grid2") { const r = h(`<div class="${cls}"></div>`); parent.appendChild(r); return r; }
function fontField(parent, l) {
  fSelect(parent, "", FONTS, () => l.font, (v) => { l.font = v; document.fonts.load(fontStr(v, 40, l.weight || 800, l.italic)).then(() => renderCanvas()); });
}
function syncGeomFields() {
  const l = selLayers()[0];
  if (!l) return;
  const map = { X: l.x, Y: l.y, L: l.w, H: l.h, "°": l.rot || 0, Aa: l.size };
  ins.querySelectorAll("input[data-geom]").forEach((i) => { const k = i.dataset.geom; if (k in map && document.activeElement !== i) i.value = r2(map[k]); });
}

function renderInspector() {
  if (editing) return;
  ins.innerHTML = "";
  const ls = selLayers();
  if (ls.length === 0) return renderImageLab();
  if (ls.length > 1) return renderMulti(ls);
  const l = ls[0];
  const titles = { text: "PROPRIÉTÉS TEXTE", attack: "ATTAQUE", hp: "HP", badge: "BADGE DE RARETÉ", image: "IMAGE", rect: "FORME", ellipse: "FORME", rule: "FILET", svg: "MICROGRAPHIC" };
  const b = box("✥ " + titles[l.type], l.locked ? "🔒 VERROUILLÉ" : TYPE_LABEL[l.type]);
  if (l.locked) {
    b.appendChild(h(`<p class="hint">Calque verrouillé : déverrouille-le pour le modifier.</p>`));
    const btn = h(`<button class="bigbtn">🔓 Déverrouiller</button>`);
    btn.onclick = () => { l.locked = false; render(); commit(); };
    b.appendChild(btn);
    if (l.type !== "image") return;
  }
  switch (l.type) {
    case "text": {
      fText(b, "Texte", () => l.text, (v) => (l.text = v), true);
      fontField(b, l);
      const r = row(b);
      fNum(r, "Aa", () => l.size, (v) => (l.size = Math.max(4, v)), 0.5);
      fNum(r, "↔", () => l.ls || 0, (v) => (l.ls = v), 0.1);
      const br = h(`<div class="btnrow"></div>`);
      b.appendChild(br);
      const wsel = h(`<select class="sel" style="width:auto;flex:1" title="Graisse">${[300, 400, 500, 600, 700, 800, 900].map((w) => `<option ${w === +l.weight ? "selected" : ""}>${w}</option>`).join("")}</select>`);
      wsel.onchange = () => onEdit(() => (l.weight = +wsel.value))();
      br.appendChild(wsel);
      const it = h(`<button class="tbtn ${l.italic ? "on" : ""}" title="Italique"><i>I</i></button>`);
      it.onclick = () => { l.italic = !l.italic; it.classList.toggle("on"); renderCanvas(); commitSoon(); };
      br.appendChild(it);
      for (const [a, ic] of [["left", "⇤"], ["center", "↔"], ["right", "⇥"]]) {
        const ab = h(`<button class="tbtn ${l.align === a ? "on" : ""}" title="Aligner">${ic}</button>`);
        ab.onclick = () => { l.align = a; renderInspector(); renderCanvas(); commitSoon(); };
        br.appendChild(ab);
      }
      fToggle(b, "Ajuster à la largeur (retour à la ligne)", () => l.wrap, (v) => (l.wrap = v), true);
      fRange(b, "Interligne", () => l.lh || 1.15, (v) => (l.lh = v), 0.7, 2.2, 0.05, (v) => v.toFixed(2) + "×");
      fColor(b, "Couleur", () => l.color, (v) => (l.color = v));
      fToggle(b, "Ombre portée", () => l.shadow, (v) => (l.shadow = v));
      break;
    }
    case "attack": {
      const r = row(b);
      const n1 = fText(r, "Nom de l'attaque", () => l.text, (v) => (l.text = v));
      fText(r, "Dégâts", () => l.dmg, (v) => (l.dmg = v));
      n1.closest(".f").style.margin = "0";
      b.appendChild(h(`<span class="lab">Coût en énergie</span>`));
      const cr = h(`<div class="btnrow"></div>`);
      for (let i = 0; i <= 5; i++) {
        const cb = h(`<button class="tbtn ${i === (l.cost | 0) ? "on" : ""}">${i}</button>`);
        cb.onclick = () => { l.cost = i; renderInspector(); renderCanvas(); commitSoon(); };
        cr.appendChild(cb);
      }
      b.appendChild(cr);
      b.appendChild(h(`<span class="lab">Symbole des jetons</span>`));
      const gr = h(`<div class="glyphs"></div>`);
      for (const g of Object.keys(GLYPHS)) {
        const gb = h(`<button class="${l.glyph === g ? "on" : ""}" title="${GLYPHS[g].label}">${g === "logo" ? `<img src="${esc(logoUrl())}" alt="logo">` : `<svg viewBox="0 0 100 100" width="16" height="16" color="#fff">${GLYPHS[g].svg}</svg>`}</button>`);
        gb.onclick = () => { l.glyph = g; renderInspector(); renderCanvas(); commitSoon(); };
        gr.appendChild(gb);
      }
      b.appendChild(gr);
      fontField(b, l);
      const r2_ = row(b);
      fNum(r2_, "Aa", () => l.size, (v) => (l.size = Math.max(6, v)), 0.5);
      fNum(r2_, "◯", () => l.iconSize, (v) => (l.iconSize = Math.max(8, v)), 0.5);
      const r3 = row(b);
      fNum(r3, "↦ nom", () => l.nameX, (v) => (l.nameX = v), 1);
      fNum(r3, "↦ jetons", () => l.iconCx, (v) => (l.iconCx = v), 1);
      const r4 = row(b);
      fColor(r4, "Texte", () => l.color, (v) => (l.color = v));
      fColor(r4, "Anneaux", () => l.ring, (v) => (l.ring = v));
      break;
    }
    case "hp": {
      const r = row(b);
      fText(r, "Étiquette", () => l.label, (v) => (l.label = v));
      fText(r, "Valeur", () => l.value, (v) => (l.value = v));
      fontField(b, l);
      fNum(row(b), "Aa", () => l.size, (v) => (l.size = Math.max(6, v)), 0.5);
      fColor(b, "Couleur", () => l.color, (v) => (l.color = v));
      break;
    }
    case "badge": {
      fText(b, "Rareté", () => l.text, (v) => (l.text = v));
      fSelect(b, "", ["C", "U", "R", "RR", "SR", "SAR", "UR", "HR", "SSR"].map((x) => [x, "Préréglage : " + x]), () => l.text, (v) => (l.text = v), true);
      fontField(b, l);
      fNum(row(b), "Aa", () => l.size, (v) => { const f = v / l.size; l.size = Math.max(6, v); l.h *= f; }, 0.5);
      const r = row(b);
      fColor(r, "Couleur", () => l.color, (v) => (l.color = v));
      fColor(r, "Lauriers", () => l.laurelColor, (v) => (l.laurelColor = v));
      fToggle(b, "Lauriers", () => l.laurels, (v) => (l.laurels = v));
      break;
    }
    case "image": {
      if (!l.locked) {
        const up = h(`<button class="bigbtn">↑ Remplacer l'image</button>`);
        up.onclick = () => pickImageFor(l);
        b.appendChild(up);
      }
      fSelect(b, "Remplissage", [["cover", "Remplir (recadré)"], ["contain", "Tout voir"], ["stretch", "Étirer"]], () => l.fit || "cover", (v) => (l.fit = v));
      const r = row(b);
      fSelect(r, "Ancrage X", [["xMin", "Gauche"], ["xMid", "Centre"], ["xMax", "Droite"]], () => l.alignX || "xMid", (v) => (l.alignX = v));
      fSelect(r, "Ancrage Y", [["YMin", "Haut"], ["YMid", "Milieu"], ["YMax", "Bas"]], () => l.alignY || "YMid", (v) => (l.alignY = v));
      fToggle(b, "Teinter en blanc (logo)", () => l.white, (v) => (l.white = v));
      if (!l.white) {
        l.fx = l.fx || { gray: 0, contrast: 1, bright: 1, sat: 1 };
        fToggle(b, "Noir & blanc", () => l.fx.gray >= 1, (v) => (l.fx.gray = v ? 1 : 0));
        fRange(b, "Contraste", () => l.fx.contrast, (v) => (l.fx.contrast = v), 0.5, 2, 0.01, (v) => Math.round(v * 100) + "%");
        fRange(b, "Luminosité", () => l.fx.bright, (v) => (l.fx.bright = v), 0.4, 1.8, 0.01, (v) => Math.round(v * 100) + "%");
        fRange(b, "Saturation", () => l.fx.sat, (v) => (l.fx.sat = v), 0, 2.5, 0.01, (v) => Math.round(v * 100) + "%");
      }
      if (l.locked) return;
      break;
    }
    case "rect":
    case "ellipse": {
      fToggle(b, "Dégradé", () => !!l.fill2, (v) => (l.fill2 = v ? l.fill2 || "#08122b" : null), true);
      const r = row(b);
      fColor(r, l.fill2 ? "Couleur 1" : "Remplissage", () => l.fill, (v) => (l.fill = v));
      if (l.fill2) fColor(r, "Couleur 2", () => l.fill2, (v) => (l.fill2 = v));
      if (l.fill2) fRange(b, "Angle", () => l.angle ?? 180, (v) => (l.angle = v), 0, 360, 1, (v) => v + "°");
      if (l.type === "rect") fRange(b, "Arrondi", () => l.radius || 0, (v) => (l.radius = v), 0, 200, 1, (v) => v + "px");
      const r2b = row(b);
      fColor(r2b, "Contour", () => l.stroke, (v) => (l.stroke = v));
      fNum(r2b, "ép.", () => l.strokeW || 0, (v) => (l.strokeW = Math.max(0, v)), 0.5).style.alignSelf = "end";
      break;
    }
    case "rule":
      fColor(b, "Couleur", () => l.color, (v) => (l.color = v));
      fRange(b, "Épaisseur", () => l.h, (v) => (l.h = v), 1, 12, 0.5, (v) => v + "px");
      break;
    case "svg": {
      fColor(b, "Couleur", () => l.color, (v) => (l.color = v));
      const up = h(`<button class="bigbtn">⟨/⟩ Remplacer par mon SVG</button>`);
      up.onclick = () => { pendingSvgTarget = l; $("#svgFile").click(); };
      b.appendChild(up);
      break;
    }
  }
  /* géométrie + actions communes */
  const g = box("⌗ POSITION", "PX");
  const r1 = row(g);
  fNum(r1, "X", () => l.x, (v) => (l.x = v));
  fNum(r1, "Y", () => l.y, (v) => (l.y = v));
  const r2r = row(g);
  fNum(r2r, "L", () => l.w, (v) => { if (l.type === "text") { l.wrap = true; } l.w = Math.max(4, v); });
  fNum(r2r, "H", () => l.h, (v) => (l.h = Math.max(2, v)));
  const r3 = row(g);
  fNum(r3, "°", () => l.rot || 0, (v) => (l.rot = v));
  fNum(r3, "%", () => Math.round(l.opacity * 100), (v) => (l.opacity = clamp(v / 100, 0, 1)));
  g.appendChild(h(`<span class="lab">Aligner sur la carte</span>`));
  const al = h(`<div class="btnrow"></div>`);
  for (const [k, ic] of [["l", "⇤"], ["cx", "↔"], ["r", "⇥"], ["t", "⤒"], ["cy", "↕"], ["b", "⤓"]]) {
    const btn = h(`<button class="tbtn">${ic}</button>`);
    btn.onclick = () => { alignTo([l], k, { x: 0, y: 0, w: CARD_W, h: CARD_H }); };
    al.appendChild(btn);
  }
  g.appendChild(al);
  fRange(g, "Opacité", () => l.opacity, (v) => (l.opacity = v), 0, 1, 0.01, (v) => Math.round(v * 100) + "%");
  g.appendChild(actionsRow());
}
function actionsRow() {
  const a = h(`<div class="actions">
    <button data-a="back" title="Descendre (Ctrl+[)">⤓</button>
    <button data-a="front" title="Monter (Ctrl+])">⤒</button>
    <button data-a="dup" title="Dupliquer (Ctrl+D)">⧉</button>
    <button data-a="lock" title="Verrouiller">🔒</button>
    <button data-a="del" class="danger" title="Supprimer (Suppr)">🗑</button></div>`);
  a.onclick = (e) => {
    const k = e.target.closest("button")?.dataset.a;
    if (k === "back") arrange(-1);
    if (k === "front") arrange(1);
    if (k === "dup") duplicate();
    if (k === "lock") { selLayers().forEach((l) => (l.locked = !l.locked)); render(); commit(); }
    if (k === "del") removeSel();
  };
  return a;
}
function renderMulti(ls) {
  const b = box(`✥ ${ls.length} CALQUES`, "SÉLECTION");
  b.appendChild(h(`<span class="lab">Aligner entre eux</span>`));
  const al = h(`<div class="btnrow"></div>`);
  const bb = bbox(ls);
  for (const [k, ic] of [["l", "⇤"], ["cx", "↔"], ["r", "⇥"], ["t", "⤒"], ["cy", "↕"], ["b", "⤓"]]) {
    const btn = h(`<button class="tbtn">${ic}</button>`);
    btn.onclick = () => alignTo(selLayers(), k, bbox(selLayers()));
    al.appendChild(btn);
  }
  b.appendChild(al);
  b.appendChild(h(`<p class="hint">Glisse pour les déplacer ensemble. Shift + clic pour ajouter / retirer.</p>`));
  b.appendChild(actionsRow());
  void bb;
}
function bbox(ls) {
  const x = Math.min(...ls.map((l) => l.x)), y = Math.min(...ls.map((l) => l.y));
  return { x, y, w: Math.max(...ls.map((l) => l.x + l.w)) - x, h: Math.max(...ls.map((l) => l.y + l.h)) - y };
}
function alignTo(ls, k, r) {
  for (const l of ls) {
    if (l.locked) continue;
    if (k === "l") l.x = r.x;
    if (k === "cx") l.x = r2(r.x + r.w / 2 - l.w / 2);
    if (k === "r") l.x = r2(r.x + r.w - l.w);
    if (k === "t") l.y = r.y;
    if (k === "cy") l.y = r2(r.y + r.h / 2 - l.h / 2);
    if (k === "b") l.y = r2(r.y + r.h - l.h);
  }
  renderCanvas();
  syncGeomFields();
  commit();
}

/* ---------- Image Lab (rien de sélectionné) ---------- */
function roleLayer(role) { return project.layers.find((l) => l.role === role); }
function renderImageLab() {
  const art = roleLayer("art");
  const b = box("✺ IMAGE LAB", "ILLUSTRATION");
  const up = h(`<button class="bigbtn">↑ Importer une illustration</button>`);
  up.onclick = () => (art ? pickImageFor(art, true) : addImage());
  b.appendChild(up);
  const imgs = [{ src: ASSETS.art, name: "Défaut" }, { src: ASSETS.ref, name: "Carte ALI" }, ...(project.uploads || [])];
  const grid = h(`<div class="lab-grid"></div>`);
  imgs.forEach((im) => {
    const bt = h(`<button title="${esc(im.name)}"><span>${esc(im.name)}</span></button>`);
    bt.style.backgroundImage = `url("${im.src}")`;
    bt.onclick = () => { if (art) { setArt(art, im.src); } };
    grid.appendChild(bt);
  });
  b.appendChild(grid);
  const sp = h(`<div class="split"><span>${imgs.length} IMAGES</span><span><button class="linkbtn" id="logoUp">Logo : importer</button>${project.logo ? ' · <button class="linkbtn" id="logoReset">réinitialiser</button>' : ""}</span></div>`);
  b.appendChild(sp);
  sp.querySelector("#logoUp").onclick = () => pickFile("image/*", async (f) => { project.logo = await fileToDataURL(f, 800); render(); commit(); toast("Logo remplacé partout (en-tête + jetons d'attaque)"); });
  const lr = sp.querySelector("#logoReset");
  if (lr) lr.onclick = () => { project.logo = null; render(); commit(); };

  const f = box("◐ FINITION");
  if (art) {
    art.fx = art.fx || { gray: 0, contrast: 1, bright: 1, sat: 1 };
    fToggle(f, "Illustration noir & blanc", () => art.fx.gray >= 1, (v) => (art.fx.gray = v ? 1 : 0));
    fRange(f, "Contraste", () => art.fx.contrast, (v) => (art.fx.contrast = v), 0.5, 2, 0.01, (v) => Math.round(v * 100) + "%");
    fRange(f, "Saturation", () => art.fx.sat, (v) => (art.fx.sat = v), 0, 2.5, 0.01, (v) => Math.round(v * 100) + "%");
  }
  fRange(f, "Grain d'impression", () => project.finish.grain || 0, (v) => (project.finish.grain = v), 0, 0.6, 0.01, (v) => Math.round((v / 0.6) * 100) + "%");

  const s = box("⚙ RÉGLAGES CARTE");
  const frame = roleLayer("frame");
  fSelect(s, "Cadre", [["silver", "Argent Outcome"], ["none", "Aucun"], ["custom", "Importer un cadre PNG…"]],
    () => (!frame || frame.hidden ? "none" : frame.src === ASSETS.frame ? "silver" : "custom"),
    (v) => {
      if (!frame) return;
      if (v === "none") frame.hidden = true;
      if (v === "silver") { frame.hidden = false; frame.src = ASSETS.frame; }
      if (v === "custom") pickFile("image/png,image/webp", async (file) => { frame.hidden = false; frame.src = await fileToDataURL(file, 2200); render(); commit(); });
    }, true);
  const bg = roleLayer("bg");
  if (bg) {
    const r = row(s);
    fColor(r, "Fond haut", () => bg.fill, (v) => (bg.fill = v));
    fColor(r, "Fond bas", () => bg.fill2 || bg.fill, (v) => (bg.fill2 = v));
  }
  fToggle(s, "Afficher la grille", () => project.showGrid, (v) => { project.showGrid = v; drawOverlay(); });
  fToggle(s, "Aimanter à la grille", () => project.snapGrid, (v) => (project.snapGrid = v));
  s.appendChild(h(`<p class="hint">Astuce : clique sur un élément de la carte pour voir ses propriétés. Ctrl+Z annule tout.</p>`));
}

/* ================= fichiers & images ================= */
let pendingSvgTarget = null;
function pickFile(accept, cb) {
  const i = document.createElement("input");
  i.type = "file";
  i.accept = accept;
  i.onchange = () => i.files[0] && cb(i.files[0]);
  i.click();
}
function fileToDataURL(file, maxSide = 2000) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => {
      if (!/^image\/(png|jpe?g|webp)/.test(file.type)) return res(fr.result);
      const im = new Image();
      im.onload = () => {
        const sc = Math.min(1, maxSide / Math.max(im.width, im.height));
        if (sc === 1 && file.size < 1.5e6) return res(fr.result);
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * sc);
        c.height = Math.round(im.height * sc);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL(file.type === "image/jpeg" ? "image/jpeg" : "image/webp", 0.92));
      };
      im.onerror = () => res(fr.result);
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function setArt(l, src) {
  l.src = src;
  l.fit = "cover";
  l.x = 0; l.y = 0; l.w = CARD_W; l.h = CARD_H;
  const fade = roleLayer("fade");
  if (fade && src !== ASSETS.art) { fade.y = 600; fade.h = 438; fade.fill = "rgba(8,18,45,0)"; fade.fill2 = "rgba(8,18,45,.82)"; fade.stops = [0, 0.55]; }
  if (src === ASSETS.art) { l.h = 746; if (fade) { fade.y = 480; fade.h = 558; fade.fill = "rgba(12,27,61,0)"; fade.fill2 = "#0c1b3d"; fade.stops = [0, 0.32]; } }
  render();
  commit();
}
function pickImageFor(l, isArt) {
  pickFile("image/*", async (f) => {
    const src = await fileToDataURL(f);
    project.uploads = [{ src, name: f.name.replace(/\.[^.]+$/, "").slice(0, 14) }, ...(project.uploads || [])].slice(0, 6);
    if (isArt || l.role === "art") setArt(l, src);
    else { l.src = src; render(); commit(); }
  });
}
function addLayer(l, center = true) {
  const o = withDefaults(l);
  if (center) { autoSize(o); o.x = r2((CARD_W - o.w) / 2); o.y = r2((CARD_H - o.h) / 2); }
  /* inséré sous le cadre s'il s'agit d'une image, sinon tout devant */
  project.layers.push(o);
  sel = [o.id];
  render();
  commit();
  return o;
}
function addImage() {
  pickFile("image/*", async (f) => {
    const src = await fileToDataURL(f);
    const im = new Image();
    im.onload = () => {
      const w = 360, hh = (w * im.height) / im.width;
      addLayer({ type: "image", name: f.name.slice(0, 24), src, w, h: hh, fit: "contain", fx: { gray: 0, contrast: 1, bright: 1, sat: 1 } });
    };
    im.src = src;
  });
}
$("#svgFile").addEventListener("change", async (e) => {
  for (const f of e.target.files) {
    const txt = await f.text();
    const doc = new DOMParser().parseFromString(txt, "image/svg+xml");
    const root = doc.querySelector("svg");
    if (!root) continue;
    root.querySelectorAll("script,foreignObject").forEach((n) => n.remove());
    [...root.querySelectorAll("*")].forEach((n) => [...n.attributes].forEach((a) => { if (/^on/i.test(a.name)) n.removeAttribute(a.name); }));
    const vb = root.getAttribute("viewBox") || `0 0 ${parseFloat(root.getAttribute("width")) || 100} ${parseFloat(root.getAttribute("height")) || 100}`;
    const [, , vw, vh] = vb.split(/[\s,]+/).map(Number);
    if (pendingSvgTarget) {
      Object.assign(pendingSvgTarget, { svg: root.innerHTML, vb });
      pendingSvgTarget = null;
      render();
      commit();
    } else {
      const w = 160, hh = (w * vh) / vw || 160;
      addLayer({ type: "svg", name: f.name.replace(/\.svg$/i, "").slice(0, 24), svg: root.innerHTML, vb, w, h: hh, color: "#ffffff" });
    }
  }
  e.target.value = "";
});

/* ================= actions ================= */
function removeSel() {
  const ls = selLayers().filter((l) => !l.locked);
  if (!ls.length) return;
  project.layers = project.layers.filter((l) => !ls.includes(l));
  sel = [];
  render();
  commit();
}
function duplicate(src = selLayers(), offset = 14) {
  const ids = [];
  for (const l of src) {
    const c = JSON.parse(JSON.stringify(l));
    c.id = uid();
    c.x += offset;
    c.y += offset;
    c.locked = false;
    c.name = (l.name || "") + " copie";
    project.layers.splice(project.layers.indexOf(l) + 1 + ids.length, 0, c);
    ids.push(c.id);
  }
  sel = ids;
  render();
  commit();
}
function arrange(dir) {
  const ls = selLayers();
  if (!ls.length) return;
  const arr = project.layers;
  const order = dir > 0 ? [...ls].sort((a, b) => arr.indexOf(b) - arr.indexOf(a)) : [...ls].sort((a, b) => arr.indexOf(a) - arr.indexOf(b));
  for (const l of order) {
    const i = arr.indexOf(l), j = clamp(i + dir, 0, arr.length - 1);
    if (i === j || ls.includes(arr[j])) continue;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  render();
  commit();
}

/* ================= bibliothèque ================= */
let mgCat = "Tout";
function mgPreview(m) {
  if (m.kind === "svg") return `<svg viewBox="${m.vb || "0 0 100 100"}" color="${m.color || "currentColor"}" preserveAspectRatio="xMidYMid meet">${mgMarkup(m.svg, "c")}</svg>`;
  const tmp = { project: null };
  void tmp;
  if (m.kind === "attack") {
    const l = withDefaults({ type: "attack", x: 0, y: 0, w: 300, h: 50, cost: m.props.cost, glyph: "logo", text: m.props.name, dmg: m.props.dmg, font: "Poppins", size: 30, color: "#fff", ring: "#e6eefb", iconSize: 36, iconCx: 46, nameX: 108 });
    return `<svg viewBox="-6 -6 312 62">${renderLayer(l, "c", [])}</svg>`;
  }
  if (m.kind === "badge") {
    const l = withDefaults({ type: "badge", x: 0, y: 0, w: 149, h: 52, text: m.props.text, font: "Poppins", size: 33, color: "#fff", laurels: m.props.laurels !== false, laurelColor: "#efe3c8" });
    autoSize(l);
    return `<svg viewBox="${l.x - 4} -4 ${l.w + 8} 60">${renderLayer(l, "c", [])}</svg>`;
  }
  if (m.kind === "hp") return `<svg viewBox="0 0 200 60"><text x="196" y="46" text-anchor="end" font-family="Poppins" font-weight="800" font-style="italic" font-size="46" fill="#fff"><tspan font-size="18">HP</tspan><tspan dx="6">150</tspan></text></svg>`;
  if (m.kind === "rule") return `<svg viewBox="0 0 200 60"><rect x="6" y="28" width="188" height="4" rx="2" fill="#e1ebff"/></svg>`;
  if (m.kind === "flavor") return `<svg viewBox="0 0 200 60"><text x="8" y="38" font-family="Poppins" font-style="italic" font-size="17" fill="#dde5f5">A calculated bet…</text></svg>`;
  if (m.kind === "text") return `<svg viewBox="0 0 100 100"><text x="50" y="60" text-anchor="middle" font-family="${esc(m.props.font || "Poppins")}" font-weight="${m.props.weight || 600}" font-size="${Math.min(30, 160 / Math.max(3, m.props.text.length))}" fill="currentColor">${esc(m.props.text)}</text></svg>`;
  return "";
}
function renderLibrary() {
  const cats = $("#mgCats");
  cats.innerHTML = "";
  for (const c of MG_CATS) {
    const b = h(`<button class="${c === mgCat ? "on" : ""}">${c}</button>`);
    b.onclick = () => { mgCat = c; renderLibrary(); };
    cats.appendChild(b);
  }
  const grid = $("#mgGrid");
  grid.innerHTML = "";
  const list = MICRO.filter((m) => mgCat === "Tout" || m.cat === mgCat);
  $("#mgCount").textContent = MICRO.length;
  for (const m of list) {
    const b = h(`<button class="mg" title="${esc(m.name)}"${m.wide ? " data-wide" : ""}>${mgPreview(m)}</button>`);
    b.onclick = () => addMicro(m);
    grid.appendChild(b);
  }
  const upl = h(`<button class="mg" title="Importer tes SVG"><svg viewBox="0 0 100 100"><path d="M50 70V30M32 46L50 28L68 46M26 76H74" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg><span class="lbl">Tes SVG</span></button>`);
  upl.onclick = () => { pendingSvgTarget = null; $("#svgFile").click(); };
  grid.appendChild(upl);
}
function nextAttackY() {
  const atks = project.layers.filter((l) => l.type === "attack");
  if (!atks.length) return 708;
  const last = atks.reduce((a, b) => (a.y > b.y ? a : b));
  return clamp(last.y + 72, 40, CARD_H - 120);
}
function addMicro(m) {
  if (m.kind === "svg") return addLayer({ type: "svg", name: m.name, mg: m.id, svg: m.svg, vb: m.vb || "0 0 100 100", w: m.w || 70, h: m.h || 70, color: m.color || "#ffffff" });
  if (m.kind === "attack") {
    const y = nextAttackY();
    /* pousse vers le bas ce qui est sous la nouvelle attaque (filets, description) */
    for (const l of project.layers) if ((l.type === "text" || l.type === "rule") && l.y >= y - 10 && l.y < 935 && l.w < CARD_W - 10) l.y = r2(l.y + 72);
    return addLayer({ type: "attack", name: "Attaque", x: 60, y, w: 608.6, h: 50, cost: m.props.cost, glyph: "logo", text: m.props.name, dmg: m.props.dmg, font: "Poppins", size: 33.1, color: "#ffffff", ring: "#e6eefb", iconSize: 41, iconCx: 54.3, nameX: 147.7 }, false);
  }
  if (m.kind === "rule") return addLayer({ type: "rule", name: "Filet", x: 76.6, y: nextAttackY() - 12, w: 580, h: 3, color: "#e1ebff" }, false);
  if (m.kind === "badge") return addLayer({ type: "badge", name: "Rareté " + m.props.text, x: 566, y: 946, w: 149, h: 52, text: m.props.text, font: "Poppins", size: 33, color: "#ffffff", laurels: m.props.laurels !== false, laurelColor: "#efe3c8" }, false);
  if (m.kind === "hp") return addLayer({ type: "hp", name: "HP", x: 497, y: 36.5, w: 140, h: 50.4, label: "HP", value: "150", font: "Poppins", size: 50.4, color: "#ffffff" }, false);
  if (m.kind === "flavor") return addLayer({ type: "text", name: "Description", x: 84, y: 868.4, text: "A calculated bet, a decisive move.", font: "Poppins", size: 19.2, weight: 400, italic: true, color: "#dde5f5" }, false);
  if (m.kind === "text") return addLayer(Object.assign({ type: "text", name: m.name, font: "Poppins", color: "#ffffff" }, m.props));
}
$$(".add-grid button").forEach((b) =>
  b.addEventListener("click", () => {
    const k = b.dataset.add;
    if (k === "text") addLayer({ type: "text", name: "Texte", text: "Nouveau texte", font: "Poppins", size: 40, weight: 800, italic: true, color: "#ffffff" });
    if (k === "rect") addLayer({ type: "rect", name: "Forme", w: 220, h: 140, fill: "#b9bdff", radius: 12 });
    if (k === "image") addImage();
    if (k === "svg") { pendingSvgTarget = null; $("#svgFile").click(); }
  })
);

/* ================= styles : modèles + palette ================= */
function renderStyles() {
  const g = $("#tplGrid");
  g.innerHTML = "";
  $("#tplCount").textContent = TEMPLATES.length;
  TEMPLATES.forEach((t, i) => {
    const p = { layers: t.layers().map(withDefaults), finish: {}, logo: project.logo };
    p.layers.forEach(autoSize);
    const b = h(`<button class="tpl"><div class="thumb"><svg viewBox="0 0 ${CARD_W} ${CARD_H}">${renderSVG(p, "t" + i)}</svg><span class="num">${t.num}</span></div><b>${esc(t.name)}</b><small>${esc(t.sub)}</small></button>`);
    b.onclick = () => {
      project = projectFromTemplate(t);
      sel = [];
      render();
      commit();
      toast("Modèle appliqué — Ctrl+Z pour revenir en arrière");
    };
    g.appendChild(b);
  });
  renderPalette();
}
let palMode = "solid";
function renderPalette() {
  const p = $("#palette");
  p.innerHTML = "";
  PALETTES.forEach(([a, b]) => {
    const s = h(`<button title="${a} → ${b}"></button>`);
    s.style.background = palMode === "grad" ? `linear-gradient(160deg, ${a}, ${b})` : a;
    s.onclick = () => applyPalette(a, b);
    p.appendChild(s);
  });
  $$("#palMode button").forEach((x) => x.classList.toggle("on", x.dataset.m === palMode));
}
$$("#palMode button").forEach((x) => x.addEventListener("click", () => { palMode = x.dataset.m; renderPalette(); }));
function applyPalette(a, b) {
  const ls = selLayers();
  if (ls.length) {
    for (const l of ls) {
      if (l.type === "rect" || l.type === "ellipse") { l.fill = a; l.fill2 = palMode === "grad" ? b : null; }
      else if (l.type === "badge") l.color = a;
      else l.color = a;
    }
  } else {
    const bg = roleLayer("bg");
    if (bg) { bg.fill = a; bg.fill2 = palMode === "grad" ? b : shade(a); }
  }
  render();
  commit();
}
function shade(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.round(v * 0.35).toString(16).padStart(2, "0");
  return "#" + f(n >> 16) + f((n >> 8) & 255) + f(n & 255);
}
$("#shuffleBtn").addEventListener("click", () => {
  const [a, b] = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const bg = roleLayer("bg");
  if (bg) { bg.fill = a; bg.fill2 = b; }
  const hpIco = project.layers.find((l) => l.mg === "hp-inf");
  if (hpIco) hpIco.color = ["#45e3c6", "#ffcf5a", "#ff7ab8", "#8fd3ff", "#b6ff7a"][Math.floor(Math.random() * 5)];
  render();
  commit();
});
$$(".tabs button").forEach((b) =>
  b.addEventListener("click", () => {
    $$(".tabs button").forEach((x) => x.classList.toggle("on", x === b));
    $$(".tabpane").forEach((p) => (p.hidden = p.dataset.pane !== b.dataset.tab));
  })
);

/* ================= projet : enregistrer / ouvrir ================= */
function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
const fileBase = () => (project.name || "carte").replace(/[^\w\-]+/g, "_").replace(/_+/g, "_").slice(0, 40) || "carte";
async function saveProject() {
  /* images relatives (assets) gardées en chemin ; uploads déjà en dataURL → projet portable */
  download(new Blob([snapshot()], { type: "application/json" }), fileBase() + ".card.json");
  toast("Projet enregistré (.card.json)");
}
function openProject() { $("#projFile").click(); }
$("#projFile").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!data.layers) throw new Error("format");
    project = Object.assign({ finish: { grain: 0 }, uploads: [] }, data);
    project.layers = project.layers.map(withDefaults);
    sel = [];
    render();
    commit();
    toast("Projet ouvert");
  } catch (err) {
    toast("⚠ Ce fichier n'est pas un projet de l'éditeur (.card.json)");
  }
  e.target.value = "";
});
$("#saveProjBtn").onclick = saveProject;
$("#openBtn").onclick = openProject;
$("#openBtn2").onclick = openProject;
$("#docName").addEventListener("input", (e) => { project.name = e.target.value; $("#metaName").textContent = project.name.toUpperCase(); commitSoon(); });

/* ================= export ================= */
const dataCache = new Map();
async function toDataURL(url) {
  if (url.startsWith("data:")) return url;
  if (dataCache.has(url)) return dataCache.get(url);
  const blob = await (await fetch(url)).blob();
  const d = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
  dataCache.set(url, d);
  return d;
}
function usedFonts() {
  const m = new Map();
  const add = (font, weight, italic, str) => {
    const k = font + "|" + weight + "|" + (italic ? 1 : 0);
    m.set(k, (m.get(k) || "") + str);
  };
  for (const l of project.layers) {
    if (l.hidden) continue;
    if (l.type === "text") add(l.font, l.weight || 400, l.italic, l.text);
    if (l.type === "hp") add(l.font, 800, true, (l.label || "") + (l.value || ""));
    if (l.type === "badge") add(l.font, 900, true, l.text || "");
    if (l.type === "attack") add(l.font, 800, true, (l.text || "") + (l.dmg || ""));
    if (l.type === "svg" && /<text/.test(l.svg)) add("Poppins", 900, false, "$");
  }
  return m;
}
async function fontFaceCSS() {
  let css = "";
  for (const [k, chars] of usedFonts()) {
    const [font, weight, it] = k.split("|");
    const fam = font.replace(/ /g, "+");
    const text = encodeURIComponent([...new Set(chars + " ")].join(""));
    const tries = [`${fam}:ital,wght@${it},${weight}`, `${fam}:wght@${weight}`, fam];
    for (const q of tries) {
      try {
        const r = await fetch(`https://fonts.googleapis.com/css2?family=${q}&text=${text}`);
        if (!r.ok) continue;
        const t = await r.text();
        const url = (t.match(/url\((https:[^)]+)\)/) || [])[1];
        if (!url) continue;
        const d = await toDataURL(url);
        css += `@font-face{font-family:"${font}";font-weight:${weight};font-style:${it === "1" ? "italic" : "normal"};src:url(${d});}`;
        break;
      } catch (e) { /* hors ligne : police système */ }
    }
  }
  return css;
}
async function buildExportSVG() {
  for (const l of project.layers) autoSize(l);
  let inner = renderSVG(project, "x");
  const urls = [...new Set([...inner.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&")))].filter((u) => !u.startsWith("data:"));
  for (const u of urls) {
    const d = await toDataURL(new URL(u, location.href).href);
    inner = inner.split(`href="${esc(u)}"`).join(`href="${d}"`);
  }
  const css = await fontFaceCSS();
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${CARD_W} ${CARD_H}" width="${CARD_W}" height="${CARD_H}"><style>${css}</style>${inner}</svg>`;
}
async function renderPNG(scale, type = "image/png", q) {
  const svg = await buildExportSVG();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const im = new Image();
  im.src = url;
  await im.decode();
  await new Promise((r) => setTimeout(r, 120));
  const c = document.createElement("canvas");
  c.width = Math.round(CARD_W * scale);
  c.height = Math.round(CARD_H * scale);
  c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return { canvas: c, blob: await new Promise((r) => c.toBlob(r, type, q)), svg };
}
function exportErr(e) {
  console.warn(e);
  $("#expMsg").textContent = location.protocol === "file:" ? "⚠ En local (file://) le navigateur bloque l'export : ouvre l'éditeur depuis le site GitHub Pages." : "⚠ Export impossible : " + (e.message || e);
}
const modal = $("#exportModal");
$("#exportBtn").onclick = () => { $("#expMsg").textContent = ""; modal.hidden = false; };
modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest("[data-close]")) modal.hidden = true; });
$("#expScale").onchange = () => { const s = +$("#expScale").value; $("#expDims").textContent = `${CARD_W * s} × ${CARD_H * s}`; };
$("#expPng").onclick = async () => {
  $("#expMsg").textContent = "Rendu en cours…";
  try { const { blob } = await renderPNG(+$("#expScale").value); download(blob, fileBase() + ".png"); $("#expMsg").textContent = "✓ PNG téléchargé"; } catch (e) { exportErr(e); }
};
$("#expSvg").onclick = async () => {
  $("#expMsg").textContent = "Préparation du SVG…";
  try { download(new Blob([await buildExportSVG()], { type: "image/svg+xml" }), fileBase() + ".svg"); $("#expMsg").textContent = "✓ SVG téléchargé"; } catch (e) { exportErr(e); }
};
$("#expProj").onclick = saveProject;
async function sendToHolo() {
  toast("Préparation de l'aperçu holo…");
  try {
    const { canvas } = await renderPNG(2);
    localStorage.setItem("cardstudio.holo", canvas.toDataURL("image/webp", 0.92));
    location.href = "index.html#from-editor";
  } catch (e) { exportErr(e); toast("⚠ Aperçu holo impossible ici (ouvre le site en ligne)"); }
}
$("#expHolo").onclick = sendToHolo;
$("#holoBtn").onclick = sendToHolo;

/* ================= clavier ================= */
document.addEventListener("keydown", (e) => {
  const t = e.target;
  if (t.closest && t.closest("input,textarea,select,[contenteditable]")) return;
  const mod = e.ctrlKey || e.metaKey;
  const k = e.key;
  if (mod && k.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && k.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
  if (mod && k.toLowerCase() === "s") { e.preventDefault(); saveProject(); return; }
  if (mod && k.toLowerCase() === "d") { e.preventDefault(); duplicate(); return; }
  if (mod && k.toLowerCase() === "c") { clipboard = JSON.stringify(selLayers()); return; }
  if (mod && k.toLowerCase() === "v" && clipboard) {
    const ls = JSON.parse(clipboard).map((l) => Object.assign(l, { id: uid(), x: l.x + 14, y: l.y + 14 }));
    project.layers.push(...ls);
    sel = ls.map((l) => l.id);
    render();
    commit();
    return;
  }
  if (mod && k.toLowerCase() === "a") { e.preventDefault(); select(project.layers.filter((l) => !l.locked && !l.hidden).map((l) => l.id)); return; }
  if (mod && k === "]") { e.preventDefault(); arrange(1); return; }
  if (mod && k === "[") { e.preventDefault(); arrange(-1); return; }
  if (k === "Delete" || k === "Backspace") { e.preventDefault(); removeSel(); return; }
  if (k === "Escape") { select([]); modal.hidden = true; return; }
  if (k === "Enter" && sel.length === 1) { const l = selLayers()[0]; if (["text", "attack", "hp", "badge"].includes(l.type) && !l.locked) { e.preventDefault(); startInlineEdit(l, l.type === "hp" ? "value" : "text"); } return; }
  if (k.startsWith("Arrow") && sel.length) {
    e.preventDefault();
    const d = e.shiftKey ? 10 : 1;
    for (const l of selLayers()) {
      if (l.locked) continue;
      if (k === "ArrowLeft") l.x -= d;
      if (k === "ArrowRight") l.x += d;
      if (k === "ArrowUp") l.y -= d;
      if (k === "ArrowDown") l.y += d;
    }
    renderCanvas();
    syncGeomFields();
    commitSoon();
    return;
  }
  if (k === "+" || k === "=") setZoom(zoom * 1.15);
  if (k === "-") setZoom(zoom / 1.15);
  if (k === "0") zoomFit();
});
$("#undoBtn").onclick = undo;
$("#redoBtn").onclick = redo;
$("#zoomIn").onclick = () => setZoom(zoom * 1.15);
$("#zoomOut").onclick = () => setZoom(zoom / 1.15);
$("#zoomFit").onclick = zoomFit;
stage.addEventListener("wheel", (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); } }, { passive: false });
window.addEventListener("resize", () => zoomFit());
/* glisser une image sur la carte = nouvelle illustration */
stage.addEventListener("dragover", (e) => e.preventDefault());
stage.addEventListener("drop", async (e) => {
  e.preventDefault();
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if (!f || !f.type.startsWith("image/")) return;
  const src = await fileToDataURL(f);
  project.uploads = [{ src, name: f.name.slice(0, 14) }, ...(project.uploads || [])].slice(0, 6);
  const art = roleLayer("art");
  if (art) setArt(art, src);
});

/* ================= démarrage ================= */
(function init() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch (e) {}
  if (saved && saved.layers) {
    project = Object.assign({ finish: { grain: 0 }, uploads: [] }, saved);
    project.layers = project.layers.map(withDefaults);
  } else {
    project = null;
    project = projectFromTemplate(TEMPLATES[0]);
  }
  renderLibrary();
  renderStyles();
  render();
  commit();
  zoomFit();
  /* re-mesure quand les polices web sont prêtes */
  document.fonts.ready.then(() => { renderCanvas(); renderStyles(); });
  document.fonts.addEventListener && document.fonts.addEventListener("loadingdone", () => renderCanvas());
})();
