/* Holo Card Studio — logique vanilla inspirée de Card.svelte du repo
   simeydotme/pokemon-cards-css (springs + variables CSS pilotées au pointeur) */

"use strict";

const round = (value, precision = 3) => parseFloat(value.toFixed(precision));
const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);
const adjust = (value, fromMin, fromMax, toMin, toMax) =>
  round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin));

const card = document.getElementById("card");
const rotator = document.getElementById("rotator");
const img = document.getElementById("cardImg");
const stage = document.getElementById("stage");

/* Presets fusionnés des deux moteurs embarqués via ribi-holo :
   - engine "css"  = simeydotme/pokemon-cards-css  (e151: false)
   - engine "151"  = simeydotme/pokemon-cards-151  (e151: true, couches glitter/glare2) */
const P = { supertype: "pokémon", subtypes: "basic" };
const EFFECTS = [
  { group: "Épée & Bouclier — pokemon-cards-css" },
  { id: "basic", label: "Basique (non-holo)", rarity: "common", ...P },
  { id: "reverse", label: "Reverse holo", rarity: "reverse holo", ...P },
  { id: "holo", label: "Holo rare", rarity: "rare holo", ...P },
  { id: "cosmos", label: "Cosmos / Galaxy", rarity: "rare holo cosmos", ...P },
  { id: "amazing", label: "Amazing rare", rarity: "amazing rare", ...P },
  { id: "radiant", label: "Radiant", rarity: "radiant rare", ...P },
  { id: "v", label: "Pokémon V", rarity: "rare holo v", subtypes: "basic v", supertype: "pokémon" },
  { id: "vfull", label: "V Full Art", rarity: "rare ultra", subtypes: "basic v", supertype: "pokémon" },
  { id: "vmax", label: "VMAX", rarity: "rare holo vmax", subtypes: "vmax", supertype: "pokémon" },
  { id: "vstar", label: "VSTAR", rarity: "rare holo vstar", subtypes: "vstar", supertype: "pokémon" },
  { id: "trainerfull", label: "Trainer Full Art", rarity: "rare ultra", supertype: "trainer", subtypes: "supporter" },
  { id: "rainbow", label: "Rainbow rare", rarity: "rare rainbow", subtypes: "basic v", supertype: "pokémon" },
  { id: "rainbow-alt", label: "Rainbow alt (VMAX)", rarity: "rare rainbow alt", subtypes: "vmax", supertype: "pokémon" },
  { id: "secret", label: "Secret rare (or)", rarity: "rare secret", ...P },
  { id: "shinyrare", label: "Shiny rare", rarity: "rare shiny", ...P },
  { id: "shinyv", label: "Shiny V", rarity: "rare shiny v", subtypes: "basic v", supertype: "pokémon" },
  { id: "shinyvmax", label: "Shiny VMAX", rarity: "rare shiny vmax", subtypes: "vmax", supertype: "pokémon" },
  { id: "tg-holo", label: "TG • Holo", rarity: "rare holo", gallery: true, number: "tg01", ...P },
  { id: "tg-v", label: "TG • V", rarity: "rare holo v", gallery: true, number: "tg01", subtypes: "basic v", supertype: "pokémon" },
  { id: "tg-vmax", label: "TG • VMAX", rarity: "rare holo vmax", gallery: true, number: "tg01", subtypes: "vmax", supertype: "pokémon" },
  { id: "tg-secret", label: "TG • Secret rare", rarity: "rare secret", gallery: true, number: "tg01", ...P },
  { group: "Écarlate & Violet — pokemon-cards-151" },
  { id: "s151-basic", label: "Basique", e151: true, rarity: "common", ...P },
  { id: "s151-reverse", label: "Reverse holo", e151: true, rarity: "common reverse holo", ...P },
  { id: "s151-holo", label: "Holo rare", e151: true, rarity: "rare holo", ...P },
  { id: "s151-radiant", label: "Radiant rare", e151: true, rarity: "radiant rare", ...P },
  { id: "s151-rainbow-alt", label: "Rainbow alt (VMAX)", e151: true, rarity: "rare rainbow alt", subtypes: "vmax", supertype: "pokémon" },
  { id: "s151-double", label: "Double rare (ex)", e151: true, rarity: "double rare", subtypes: "basic ex", supertype: "pokémon" },
  { id: "s151-ultra", label: "Ultra rare (Full Art ex)", e151: true, rarity: "ultra rare", subtypes: "basic ex", supertype: "pokémon" },
  { id: "s151-illu", label: "Illustration rare", e151: true, rarity: "illustration rare", ...P },
  { id: "s151-special", label: "Special illustration rare", e151: true, rarity: "special illustration rare", subtypes: "basic ex", supertype: "pokémon" },
  { id: "s151-hyper", label: "Hyper rare (or)", e151: true, rarity: "hyper rare", subtypes: "basic ex", supertype: "pokémon" },
  { id: "s151-pokeball", label: "Outcome Holo", e151: true, rarity: "pokeball holo", ...P },
  { id: "s151-masterball", label: "Master Ball holo", e151: true, rarity: "masterball holo", ...P },
];

const settings = {
  rotMax: 14,
  glareStrength: 1,
  size: 500,
};

const INTERACT = { stiffness: 0.066, damping: 0.25 };
const SNAP = { stiffness: 0.01, damping: 0.06 };
const POPOVER = { stiffness: 0.033, damping: 0.45 };
const SPIN = { stiffness: 0.012, damping: 0.27 };

class Spring {
  constructor(value, opts) {
    this.value = { ...value };
    this.target = { ...value };
    this.vel = {};
    for (const k in value) this.vel[k] = 0;
    this.stiffness = opts.stiffness;
    this.damping = opts.damping;
  }
  set(target, opts) {
    if (opts) {
      this.stiffness = opts.stiffness;
      this.damping = opts.damping;
    }
    Object.assign(this.target, target);
  }
  tick(f) {
    for (const k in this.value) {
      const d = this.target[k] - this.value[k];
      this.vel[k] = (this.vel[k] + d * this.stiffness * f) * Math.pow(this.damping, f);
      this.value[k] += this.vel[k] * f;
    }
  }
}

const springRotate = new Spring({ x: 0, y: 0 }, INTERACT);
const springGlare = new Spring({ x: 50, y: 50, o: 0 }, INTERACT);
const springBackground = new Spring({ x: 50, y: 50 }, INTERACT);
const springRotateDelta = new Spring({ x: 0, y: 0 }, POPOVER);
const springTranslate = new Spring({ x: 0, y: 0 }, POPOVER);
const springScale = new Spring({ v: 1 }, POPOVER);

let interacting = false;
let active = false;
let snapTimer = null;
let showcaseRunning = false;
let showcaseInterval = null;
let lastFrame = performance.now();

function updateSprings(background, rotate, glare) {
  springBackground.set(background, INTERACT);
  springRotate.set(rotate, INTERACT);
  springGlare.set(glare, INTERACT);
}

function interact(e) {
  if (card.classList.contains("edit")) return; // mode édition : pas de tilt 3D
  if (e.type === "touchmove" && e.touches[0]) {
    e.clientX = e.touches[0].clientX;
    e.clientY = e.touches[0].clientY;
  }
  const rect = rotator.getBoundingClientRect();
  const absolute = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
  const percent = {
    x: clamp(round((100 / rect.width) * absolute.x)),
    y: clamp(round((100 / rect.height) * absolute.y)),
  };
  const center = {
    x: percent.x - 50,
    y: percent.y - 50,
  };

  interacting = true;
  card.classList.add("interacting");
  if (snapTimer) {
    clearTimeout(snapTimer);
    snapTimer = null;
  }

  updateSprings(
    {
      x: adjust(percent.x, 0, 100, 37, 63),
      y: adjust(percent.y, 0, 100, 33, 67),
    },
    {
      x: round(-(center.x / 50) * settings.rotMax),
      y: round((center.y / 50) * settings.rotMax),
    },
    {
      x: round(percent.x),
      y: round(percent.y),
      o: 1,
    }
  );
}

function interactEnd() {
  if (snapTimer) clearTimeout(snapTimer);
  snapTimer = setTimeout(() => {
    interacting = false;
    card.classList.remove("interacting");
    const autoBox = document.getElementById("auto");
    if (autoBox && autoBox.checked) {
      startShowcase();
      return;
    }
    springRotate.set({ x: 0, y: 0 }, SNAP);
    springGlare.set({ x: 50, y: 50, o: 0 }, SNAP);
    springBackground.set({ x: 50, y: 50 }, SNAP);
  }, 350);
}

let downPos = null;
rotator.addEventListener("pointermove", interact);
rotator.addEventListener("pointerdown", (e) => {
  downPos = { x: e.clientX, y: e.clientY };
  interact(e);
});
rotator.addEventListener("pointerleave", interactEnd);
rotator.addEventListener("pointerout", interactEnd);

// orientation gyroscope (mobile)
let baseOrientation = null;
function orientate(e) {
  if (e.beta === null || e.gamma === null) return;
  if (!baseOrientation) baseOrientation = { beta: e.beta, gamma: e.gamma };
  const limit = { x: 16, y: 18 };
  const degrees = {
    x: clamp(e.gamma - baseOrientation.gamma, -limit.x, limit.x),
    y: clamp(e.beta - baseOrientation.beta, -limit.y, limit.y),
  };
  updateSprings(
    {
      x: adjust(degrees.x, -limit.x, limit.x, 37, 63),
      y: adjust(degrees.y, -limit.y, limit.y, 33, 67),
    },
    {
      x: round(-degrees.x * (settings.rotMax / 14)),
      y: round(degrees.y * (settings.rotMax / 14)),
    },
    {
      x: adjust(degrees.x, -limit.x, limit.x, 0, 100),
      y: adjust(degrees.y, -limit.y, limit.y, 0, 100),
      o: 1,
    }
  );
}
window.addEventListener("deviceorientation", orientate, true);
rotator.addEventListener("pointerdown", () => {
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    DeviceOrientationEvent.requestPermission().catch(() => {});
  }
}, { once: true });

function render(now) {
  const f = clamp((now - lastFrame) / 16.667, 0.25, 3);
  lastFrame = now;
  springRotate.tick(f);
  springGlare.tick(f);
  springBackground.tick(f);
  springRotateDelta.tick(f);
  springTranslate.tick(f);
  springScale.tick(f);

  const gx = springGlare.value.x;
  const gy = springGlare.value.y;
  const fromCenter = clamp(
    Math.sqrt((gy - 50) * (gy - 50) + (gx - 50) * (gx - 50)) / 50,
    0,
    1
  );

  const s = card.style;
  s.setProperty("--pointer-x", gx + "%");
  s.setProperty("--pointer-y", gy + "%");
  s.setProperty("--par-x", round((springGlare.value.x - 50) / 50, 3));
  s.setProperty("--par-y", round((springGlare.value.y - 50) / 50, 3));
  s.setProperty("--pointer-from-center", round(fromCenter, 4));
  s.setProperty("--pointer-from-top", round(gy / 100, 4));
  s.setProperty("--pointer-from-left", round(gx / 100, 4));
  s.setProperty("--card-opacity", round(clamp(springGlare.value.o * settings.glareStrength, 0, 1.5), 4));
  s.setProperty("--rotate-x", round(springRotate.value.x + springRotateDelta.value.x, 3) + "deg");
  s.setProperty("--rotate-y", round(springRotate.value.y + springRotateDelta.value.y, 3) + "deg");
  s.setProperty("--background-x", round(springBackground.value.x, 3) + "%");
  s.setProperty("--background-y", round(springBackground.value.y, 3) + "%");
  s.setProperty("--card-scale", round(springScale.value.v, 4));
  s.setProperty("--translate-x", round(springTranslate.value.x, 2) + "px");
  s.setProperty("--translate-y", round(springTranslate.value.y, 2) + "px");

  requestAnimationFrame(render);
}
requestAnimationFrame(render);

/* ---------- effets ---------- */

const effectsBox = document.getElementById("effects");
let currentEffect = "holo";

function applyEffect(id) {
  const fx = EFFECTS.find((e) => e.id === id);
  if (!fx) return;
  currentEffect = id;
  card.dataset.rarity = fx.rarity;
  card.dataset.supertype = fx.supertype || "pokémon";
  card.dataset.subtypes = fx.subtypes || "basic";
  card.dataset.set = fx.set || "";
  card.dataset.number = fx.number || "";
  card.dataset.trainerGallery = fx.gallery ? "true" : "false";
  card.classList.toggle("e151", !!fx.e151);
  document.querySelectorAll("#effects button").forEach((b) => {
    b.classList.toggle("active", b.dataset.effect === id);
  });
}

EFFECTS.forEach((fx) => {
  if (fx.group) {
    const h = document.createElement("h3");
    h.className = "effects-group";
    h.textContent = fx.group;
    effectsBox.appendChild(h);
    return;
  }
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = fx.label;
  b.dataset.effect = fx.id;
  b.addEventListener("click", () => applyEffect(fx.id));
  effectsBox.appendChild(b);
});
applyEffect("tg-holo");

/* ---------- masque auto (template fenêtre d'art, repris de ribi-holo) ---------- */

async function buildMask(src) {
  const image = await new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
  const MASK_MAX = 1024;
  const k = Math.min(1, MASK_MAX / Math.max(image.naturalWidth, image.naturalHeight));
  const w = Math.max(1, Math.round(image.naturalWidth * k));
  const h = Math.max(1, Math.round(image.naturalHeight * k));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  let translucent = 0;
  for (let i = 3; i < px.length; i += 4) if (px[i] < 250) translucent++;
  const hasAlpha = translucent > w * h * 0.005;
  for (let i = 0; i < px.length; i += 4) {
    const lum = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
    px[i + 3] = hasAlpha ? px[i + 3] : lum;
    px[i] = px[i + 1] = px[i + 2] = 255;
  }
  ctx.putImageData(data, 0, 0);
  const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
  return blob ? URL.createObjectURL(blob) : canvas.toDataURL("image/png");
}

async function applyDefaultMask() {
  try {
    const url = await buildMask("img/card_mask.webp");
    card.style.setProperty("--mask", `url("${url}")`);
    card.classList.add("masked");
  } catch (e) {
    console.warn("masque par défaut indisponible", e);
  }
}
applyDefaultMask();

/* ---------- slots : carte / masque / foil (comme ribi-holo) ---------- */

const fileName = document.getElementById("fileName");
const dropOverlay = document.getElementById("dropOverlay");

const DEFAULT_FILES = {
  card: "img/card.webp",
  mask: "img/card_mask.webp",
  foil: "img/card_foil.webp",
  back: "img/card_back.webp",
  fg: null,
};

const backImg = document.getElementById("cardBackImg");

const slots = {
  card: { url: DEFAULT_FILES.card, thumb: DEFAULT_FILES.card, custom: false, blob: null },
  mask: { thumb: DEFAULT_FILES.mask, maskUrl: null, custom: false, blob: null },
  foil: { url: DEFAULT_FILES.foil, thumb: DEFAULT_FILES.foil, custom: false, blob: null },
  back: { url: DEFAULT_FILES.back, thumb: DEFAULT_FILES.back, custom: false, blob: null },
  fg: { url: null, thumb: null, custom: false, blob: null },
};

function randomizeSeeds() {
  card.style.setProperty("--seedx", String(Math.random()));
  card.style.setProperty("--seedy", String(Math.random()));
  card.style.setProperty(
    "--cosmosbg",
    Math.floor(Math.random() * 734) + "px " + Math.floor(Math.random() * 1280) + "px"
  );
}

/* ---------- taille adaptative : la carte adopte le ratio de l'image ---------- */

function adaptCardAspect() {
  // le format de la carte est FIXE (747x1038 = 0.7197) — un upload ne doit jamais le changer
  card.style.setProperty("--card-aspect", "0.7197");
  fitCard();
}

function fitCard() {
  const aspect = parseFloat(getComputedStyle(card).getPropertyValue("--card-aspect")) || 0.718;
  const availW = Math.max(160, stage.clientWidth - 16);
  const availH = Math.max(160, stage.clientHeight - 24);
  let w = Math.min(settings.size, availW, availH * aspect);
  w = Math.max(160, Math.round(w));
  card.style.width = w + "px";
  card.style.setProperty("--st-fs", w / 100 + "px");
  const sizeOut = document.getElementById("sizeOut");
  if (sizeOut) sizeOut.textContent = w + "px";
}

window.addEventListener("resize", fitCard);

function applyImages() {
  card.classList.add("loading");
  img.onload = () => {
    card.classList.remove("loading");
    randomizeSeeds();
    adaptCardAspect();
  };
  img.src = slots.card.url;
  if (backImg && slots.back.url) backImg.src = slots.back.url;
  const studioColorMode = card.classList.contains("studio") && !slots.card.custom;
  const bg = studioColorMode ? null : slots.card.url || null;
  card.style.setProperty("--layer-bg", bg ? `url("${bg}")` : "none");
  if (slots.fg.url) card.style.setProperty("--layer-fg", `url("${slots.fg.url}")`);
  else card.style.removeProperty("--layer-fg");
  if (slots.foil.url) {
    card.style.setProperty("--foil", `url("${slots.foil.url}")`);
  } else {
    card.style.removeProperty("--foil");
  }
  if (slots.mask.maskUrl) {
    card.style.setProperty("--mask", `url("${slots.mask.maskUrl}")`);
    card.classList.add("masked");
  } else {
    card.classList.remove("masked");
  }
}

function paintSlots() {
  document.querySelectorAll(".slot").forEach((el) => {
    const name = el.dataset.slot;
    const s = slots[name];
    const im = el.querySelector("img");
    if (s.thumb) im.src = s.thumb;
    else im.removeAttribute("src");
    el.toggleAttribute("data-empty", name === "mask" ? !s.maskUrl : !s.thumb);
  });
}

async function setSlotFile(name, file) {
  if (!file || !file.type.startsWith("image/")) return;
  const blob = URL.createObjectURL(file);
  const s = slots[name];
  if (s.blob) URL.revokeObjectURL(s.blob);
  s.blob = blob;
  s.custom = true;
  if (name === "mask") {
    try {
      s.maskUrl = await buildMask(blob);
    } catch (e) {
      console.warn("Masque non traité", e);
      s.maskUrl = blob;
    }
    s.thumb = blob;
  } else {
    s.url = blob;
    s.thumb = blob;
  }
  paintSlots();
  applyImages();
  fileName.textContent = "🖼 " + file.name;
  if (name === "card") autoDeriveFromCard();
}

/* recrée automatiquement masque + foil à partir de l'image de la carte,
   sauf si l'utilisateur a uploadé un masque/foil perso */
async function autoDeriveFromCard() {
  if (!slots.card.custom) return;
  const src = slots.card.url;
  if (!slots.mask.custom) {
    try {
      slots.mask.maskUrl = await buildMask(src);
      slots.mask.thumb = slots.card.thumb;
    } catch (e) {
      console.warn("masque auto non dérivé", e);
    }
  }
  if (!slots.foil.custom) {
    slots.foil.url = src;
    slots.foil.thumb = slots.card.thumb;
  }
  paintSlots();
  applyImages();
}

function clearSlot(name) {
  const s = slots[name];
  if (s.blob) URL.revokeObjectURL(s.blob);
  s.blob = null;
  s.custom = false;
  if (name === "mask") {
    s.maskUrl = defaultMaskUrl;
    s.thumb = DEFAULT_FILES.mask;
  } else {
    s.url = s.thumb = DEFAULT_FILES[name];
  }
  paintSlots();
  applyImages();
  if (name === "fg" && parallaxLayersBox.checked) setLayersMode(false);
  if (name === "mask" || name === "foil") autoDeriveFromCard();
}

document.querySelectorAll(".slot").forEach((el) => {
  const name = el.dataset.slot;
  const input = el.querySelector("input");
  const drop = el.querySelector(".slot__drop");
  const clear = el.querySelector(".slot__clear");
  drop.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    setSlotFile(name, input.files[0]);
    input.value = "";
  });
  clear.addEventListener("click", () => clearSlot(name));
  ["dragenter", "dragover"].forEach((t) =>
    el.addEventListener(t, (e) => {
      e.preventDefault();
      el.classList.add("is-over");
    })
  );
  ["dragleave", "drop"].forEach((t) =>
    el.addEventListener(t, (e) => {
      e.preventDefault();
      el.classList.remove("is-over");
    })
  );
  el.addEventListener("drop", (e) => setSlotFile(name, e.dataTransfer.files[0]));
});

["dragover", "drop"].forEach((t) => window.addEventListener(t, (e) => e.preventDefault()));

["dragenter", "dragover"].forEach((ev) =>
  stage.addEventListener(ev, (e) => {
    e.preventDefault();
    stage.classList.add("dragging");
  })
);
["dragleave", "drop"].forEach((ev) =>
  stage.addEventListener(ev, (e) => {
    e.preventDefault();
    if (ev === "dragleave" && e.relatedTarget && stage.contains(e.relatedTarget)) return;
    stage.classList.remove("dragging");
  })
);
stage.addEventListener("drop", (e) => {
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  setSlotFile("card", file);
});

let defaultMaskUrl = null;
async function applyDefaultMask() {
  try {
    defaultMaskUrl = await buildMask(DEFAULT_FILES.mask);
    slots.mask.maskUrl = defaultMaskUrl;
    paintSlots();
    applyImages();
  } catch (e) {
    console.warn("masque par défaut indisponible", e);
  }
}
img.addEventListener("load", () => {
  card.classList.remove("loading");
  adaptCardAspect();
});
applyDefaultMask();
adaptCardAspect();

/* ---------- réglages ---------- */

const rotMaxInput = document.getElementById("rotMax");
const glareInput = document.getElementById("glare");
const sizeInput = document.getElementById("cardSize");
const glowInput = document.getElementById("glowColor");
const rotOut = document.getElementById("rotOut");
const glareOut = document.getElementById("glareOut");
const sizeOut = document.getElementById("sizeOut");

rotMaxInput.addEventListener("input", () => {
  settings.rotMax = parseFloat(rotMaxInput.value);
  rotOut.textContent = settings.rotMax + "°";
});
glareInput.addEventListener("input", () => {
  settings.glareStrength = parseFloat(glareInput.value);
  glareOut.textContent = Math.round(settings.glareStrength * 100) + "%";
});
sizeInput.addEventListener("input", () => {
  settings.size = parseInt(sizeInput.value, 10);
  fitCard();
});
glowInput.addEventListener("input", () => {
  card.style.setProperty("--card-glow", glowInput.value);
});

/* ---------- démo auto (activée par défaut, comme ribi-holo) ---------- */

const autoBox = document.getElementById("auto");
const textureBox = document.getElementById("texture");
textureBox.addEventListener("input", () => {
  card.classList.toggle("has-texture", textureBox.checked);
});
/* ---------- mode Studio (card maker) ---------- */

const studioBox = document.getElementById("studioBox");
studioBox.addEventListener("input", () => {
  card.classList.toggle("studio", studioBox.checked);
  applyImages();
});

/* onglets Carte holo / Studio */
const tabs = document.querySelectorAll(".tab");
tabs.forEach((t) =>
  t.addEventListener("click", () => {
    tabs.forEach((x) => x.classList.toggle("active", x === t));
    const isStudio = t.dataset.tab === "studio";
    document.getElementById("pane-card").hidden = isStudio;
    document.getElementById("pane-studio").hidden = !isStudio;
    if (studioBox.checked !== isStudio) {
      studioBox.checked = isStudio;
      card.classList.toggle("studio", isStudio);
      applyImages();
    }
  })
);

const ST_TEXT = {
  stNameIn: "stName",
  stBrandIn: "stBrand",
  stHpIn: "stHp",
  stAtk1In: "stAtk1",
  stDmg1In: "stDmg1",
  stAtk2In: "stAtk2",
  stDmg2In: "stDmg2",
  stDescIn: "stDesc",
  stNumIn: "stNum",
  stRarIn: "stRar",
  stWeakIn: "stWeak",
  stResIn: "stRes",
  stRetIn: "stRet",
};
for (const [inputId, targetId] of Object.entries(ST_TEXT)) {
  const input = document.getElementById(inputId);
  const target = document.getElementById(targetId);
  const prefix = targetId === "stHp" ? "HP " : "";
  target.textContent = prefix + input.value;
  input.addEventListener("input", () => {
    target.textContent = prefix + input.value;
  });
}

const ST_COLORS = {
  stFrameIn: "--st-frame",
  stHeadIn: "--st-head",
  stHeadTextIn: "--st-head-text",
  stTextIn: "--st-text",
};
for (const [inputId, varName] of Object.entries(ST_COLORS)) {
  const input = document.getElementById(inputId);
  // stHeadIn : pas de pill par défaut (transparent) — posée seulement si l'utilisateur choisit une couleur
  if (inputId !== "stHeadIn") card.style.setProperty(varName, input.value);
  input.addEventListener("input", () => {
    card.style.setProperty(varName, input.value);
  });
}

const stLogoFile = document.getElementById("stLogoFile");
stLogoFile.addEventListener("change", () => {
  const file = stLogoFile.files[0];
  if (!file) return;
  card.style.setProperty("--st-logo", `url("${URL.createObjectURL(file)}")`);
  card.style.setProperty("--st-logo-filter", "none"); // logo perso affiché tel quel
  stLogoFile.value = "";
});

/* uploads du studio : fond (slot carte) + illustration (slot perso) */
function bindCost(inputId, costId, rowId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  const cost = document.getElementById(costId);
  const row = document.getElementById(rowId);
  const apply = () => {
    const n = Math.max(0, Math.min(5, parseInt(input.value || "0", 10) || 0));
    const glyph = icon.value || "\u26a1";
    cost.innerHTML = "<i></i>".repeat(n);
    row.style.setProperty("--st-glyph", JSON.stringify(glyph));
    row.style.setProperty("--cost", String(n));
  };
  input.addEventListener("input", apply);
  icon.addEventListener("input", apply);
  apply();
}
bindCost("stCost1In", "stCost1", "stAtkRow1", "stIcon1In");
bindCost("stCost2In", "stCost2", "stAtkRow2", "stIcon2In");

/* ---------- fond de carte en couleur (dégradé façon types Pokémon) ---------- */
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
  return "#" + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function setStudioBg(hex) {
  /* teinte TRANSLUCIDE (alpha 0.65) : le fond de carte passe PAR-DESSUS l'illustration pleine carte
     (z art < z bg) -> l'art reste visible à travers la teinte, comme le motif ribi-holo sur toute la carte */
  const A = 0.65;
  const [r, g, b] = hexToRgb(hex);
  const stop = (amt) => {
    const s = hexToRgb(shade(hex, amt));
    return `rgba(${s[0]},${s[1]},${s[2]},${A})`;
  };
  const grad = `linear-gradient(160deg, ${stop(55)} 0%, rgba(${r},${g},${b},${A}) 45%, ${stop(-45)} 100%)`;
  card.style.setProperty("--st-bg-grad", grad);
  if (!slots.card.custom) card.style.setProperty("--layer-bg", "none");
  const inp = document.getElementById("stBgColor");
  if (inp) inp.value = hex;
}
const stBgColor = document.getElementById("stBgColor");
stBgColor.addEventListener("input", () => setStudioBg(stBgColor.value));
document.querySelectorAll("#bgSwatches button").forEach((b) =>
  b.addEventListener("click", () => setStudioBg(b.dataset.c))
);
setStudioBg(stBgColor.value || "#2f6fd0");

/* ---------- motif de fond overlay : opacité + filtre de teinte ---------- */
const stFondOp = document.getElementById("stFondOp");
const stFondOpVal = document.getElementById("stFondOpVal");
const applyFondOp = () => {
  const v = Math.max(0, Math.min(100, parseInt(stFondOp.value, 10) || 0)) / 100;
  card.style.setProperty("--st-fond-opacity", String(v));
  if (stFondOpVal) stFondOpVal.textContent = Math.round(v * 100) + "%";
};
stFondOp.addEventListener("input", applyFondOp);
applyFondOp();

function hexHue(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx === mn) return 0;
  const d = mx - mn;
  let h;
  if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round(h * 60);
}
const stFondColor = document.getElementById("stFondColor");
const applyFondColor = () => {
  const hex = (stFondColor.value || "#ffffff").toLowerCase();
  // blanc = aucun filtre (couleurs d'origine du motif) ; sinon teinte via sepia+hue-rotate
  const filter = hex === "#ffffff" ? "none" : `sepia(1) saturate(4) hue-rotate(${hexHue(hex)}deg) brightness(1.05)`;
  card.style.setProperty("--st-fond-filter", filter);
};
stFondColor.addEventListener("input", applyFondColor);
applyFondColor();

const showZonesBox = document.getElementById("showZones");
showZonesBox.addEventListener("input", () => {
  card.classList.toggle("show-zones", showZonesBox.checked);
});

const stBgFile = document.getElementById("stBgFile");
stBgFile.addEventListener("change", () => {
  const file = stBgFile.files[0];
  if (file) setSlotFile("card", file);
  stBgFile.value = "";
});
const stArtFile = document.getElementById("stArtFile");
stArtFile.addEventListener("change", () => {
  const file = stArtFile.files[0];
  if (file) setSlotFile("fg", file);
  stArtFile.value = "";
});

const parallaxBox = document.getElementById("parallax");
parallaxBox.addEventListener("input", () => {
  card.classList.toggle("parallax", parallaxBox.checked);
});

const parallaxLayersBox = document.getElementById("parallaxLayers");
function setLayersMode(on) {
  card.classList.toggle("parallax-layers", on);
  if (on) card.classList.add("parallax");
  else if (!parallaxBox.checked) card.classList.remove("parallax");
  parallaxLayersBox.checked = on;
}
parallaxLayersBox.addEventListener("input", () => {
  if (parallaxLayersBox.checked && !slots.fg.url) {
    parallaxLayersBox.checked = false;
    alert("Ajoute d'abord une couche avant : PNG transparent dans le slot 🎭 Perso, ou clique sur « ✂️ Découpe IA auto ».");
    return;
  }
  setLayersMode(parallaxLayersBox.checked);
});

/* découpe IA dans le navigateur (background-removal, modèle chargé via CDN) */
const cutBtn = document.getElementById("cutBtn");
let imglyLoading = null;
cutBtn.addEventListener("click", async () => {
  if (!slots.card.url) return;
  cutBtn.disabled = true;
  cutBtn.textContent = "⏳ Découpe IA… (1er chargement ~40 Mo)";
  try {
    if (!window.removeBackground) {
      imglyLoading =
        imglyLoading ||
        new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.7/dist/bundle.js";
          s.onload = res;
          s.onerror = () => rej(new Error("CDN indisponible"));
          document.head.appendChild(s);
        });
      await imglyLoading;
    }
    const blob = await window.removeBackground(slots.card.url, {
      publicPath: "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.7/dist/",
      progress: (p) => {
        cutBtn.textContent = "⏳ " + Math.round(p * 100) + "%";
      },
    });
    const url = URL.createObjectURL(blob);
    const s = slots.fg;
    if (s.blob) URL.revokeObjectURL(s.blob);
    s.blob = blob;
    s.custom = true;
    s.url = url;
    s.thumb = url;
    paintSlots();
    applyImages();
    setLayersMode(true);
    cutBtn.textContent = "✂️ Découpe IA auto (perso vs fond)";
  } catch (e) {
    console.error(e);
    alert("Découpe IA indisponible (hors ligne ?). Mets un PNG transparent dans le slot 🎭 Perso à la place.");
    cutBtn.textContent = "✂️ Découpe IA auto (perso vs fond)";
  } finally {
    cutBtn.disabled = false;
  }
});

function endShowcase() {
  if (showcaseRunning) {
    clearInterval(showcaseInterval);
    showcaseRunning = false;
  }
}

function startShowcase() {
  if (showcaseRunning) return;
  showcaseRunning = true;
  let phase = 0;
  showcaseInterval = setInterval(() => {
    if (interacting) return;
    phase += 0.02 * 0.35;
    const th = phase * Math.PI;
    const amp = settings.rotMax;
    const rot = { x: Math.cos(th) * amp, y: Math.sin(th) * amp * 0.6 };
    const px = clamp(50 - rot.x * 3.5, 0, 100);
    const py = clamp(50 + rot.y * 3.5, 0, 100);
    const soft = { stiffness: 0.02, damping: 0.5 };
    springRotate.set({ x: rot.x, y: rot.y }, soft);
    springGlare.set(
      { x: px, y: py, o: 1 },
      soft
    );
    springBackground.set(
      { x: adjust(px, 0, 100, 37, 63), y: adjust(py, 0, 100, 33, 67) },
      soft
    );
  }, 20);
}

/* ---------- zoom popover (clic sur la carte, comme ribi-holo) ---------- */

const veil = document.getElementById("veil");

function setCenter() {
  const rect = card.getBoundingClientRect();
  const view = document.documentElement;
  springTranslate.set({
    x: round(view.clientWidth / 2 - rect.x - rect.width / 2),
    y: round(view.clientHeight / 2 - rect.y - rect.height / 2),
  });
}

function zoomScale() {
  const w = card.offsetWidth;
  const h = card.offsetHeight;
  return Math.min((window.innerWidth / w) * 0.9, (window.innerHeight / h) * 0.9, 1.75);
}

function activate() {
  if (active) return;
  active = true;
  card.classList.add("active");
  veil.hidden = false;
  springRotateDelta.set({ x: 360, y: 0 }, SPIN);
  setCenter();
  springScale.set({ v: zoomScale() }, POPOVER);
}

function deactivate() {
  if (!active) return;
  active = false;
  card.classList.remove("active");
  veil.hidden = true;
  springRotateDelta.set({ x: 0, y: 0 }, POPOVER);
  springScale.set({ v: 1 }, POPOVER);
  springTranslate.set({ x: 0, y: 0 }, POPOVER);
  interactEnd();
}

rotator.addEventListener("pointerup", (e) => {
  if (card.classList.contains("edit")) { downPos = null; return; } // pas de zoom en mode édition
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
  downPos = null;
  if (moved < 8) {
    if (active) deactivate();
    else activate();
  }
});
veil.addEventListener("click", deactivate);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && active) deactivate();
});
let repositionTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(repositionTimer);
  repositionTimer = setTimeout(() => {
    if (active) setCenter();
  }, 150);
});

autoBox.addEventListener("input", () => {
  if (autoBox.checked) startShowcase();
  else {
    endShowcase();
    interactEnd();
  }
});

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  autoBox.checked = true;
  startShowcase();
} else {
  autoBox.checked = false;
}

/* ---------- thème clair / sombre ---------- */

const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
let themeMode = "dark";
function applyTheme() {
  const scheme = themeMode === "system" ? (themeMedia.matches ? "dark" : "light") : themeMode;
  document.documentElement.dataset.scheme = scheme;
  document.querySelectorAll(".theme button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.theme === themeMode))
  );
}
document.querySelectorAll(".theme button").forEach((b) =>
  b.addEventListener("click", () => {
    themeMode = b.dataset.theme;
    applyTheme();
  })
);
themeMedia.addEventListener("change", () => {
  if (themeMode === "system") applyTheme();
});
applyTheme();

/* ---------- reset ---------- */

document.getElementById("resetBtn").addEventListener("click", () => {
  endShowcase();
  fileName.textContent = "";
  Object.keys(slots).forEach((name) => {
    const s = slots[name];
    if (s.blob) URL.revokeObjectURL(s.blob);
    s.blob = null;
    s.custom = false;
    if (name === "mask") {
      s.maskUrl = defaultMaskUrl;
      s.thumb = DEFAULT_FILES.mask;
    } else {
      s.url = s.thumb = DEFAULT_FILES[name];
    }
  });
  paintSlots();
  applyImages();
  applyEffect("tg-holo");
  rotMaxInput.value = 14;
  glareInput.value = 1;
  sizeInput.value = 360;
  glowInput.value = "#ccfff5";
  settings.rotMax = 14;
  settings.glareStrength = 1;
  settings.size = 360;
  rotOut.textContent = "14°";
  glareOut.textContent = "100%";
  fitCard();
  card.style.setProperty("--card-glow", "#ccfff5");
  interactEnd();
});

/* ---------- export PNG ---------- */

let html2canvasPromise = null;
function loadHtml2Canvas() {
  if (html2canvasPromise) return html2canvasPromise;
  html2canvasPromise = new Promise((resolve, reject) => {
    if (window.html2canvas) return resolve(window.html2canvas);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.onload = () => resolve(window.html2canvas);
    s.onerror = () => reject(new Error("CDN injoignable"));
    document.head.appendChild(s);
  });
  return html2canvasPromise;
}

document.getElementById("exportBtn").addEventListener("click", async () => {
  const btn = document.getElementById("exportBtn");
  btn.disabled = true;
  try {
    endShowcase();
    updateSprings(
      { x: 45, y: 42 },
      { x: -9, y: 12 },
      { x: 38, y: 32, o: 1 }
    );
    await new Promise((res) => setTimeout(res, 900));
    const html2canvas = await loadHtml2Canvas();
    const canvas = await html2canvas(card, {
      scale: 2,
      backgroundColor: null,
      logging: false,
    });
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "carte-holo.png";
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    alert("Export indisponible (hors connexion ?). Fais plutôt une capture d'écran de la carte.");
  } finally {
    btn.disabled = false;
    interactEnd();
  }
});

/* ---------- mode édition directe : drag + resize des zones, échelle texte, zones perso ---------- */
const editModeBox = document.getElementById("editMode");
const EDIT_SEL = ".st-bg,.st-pill,.st-art,.st-frame,.st-brand,.st-name,.st-hp,.st-logo,.st-body,.st-typebar,.st-foot,.st-zone-new";

function zoneRect(el) {
  const c = card.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  return {
    x: ((b.x - c.x) / c.width) * 100,
    y: ((b.y - c.y) / c.height) * 100,
    w: (b.width / c.width) * 100,
    h: (b.height / c.height) * 100,
  };
}

function normalizeZone(el) {
  const r = zoneRect(el);
  el.style.inset = "auto";
  el.style.right = "auto";
  el.style.bottom = "auto";
  el.style.left = r.x + "%";
  el.style.top = r.y + "%";
  el.style.width = r.w + "%";
  el.style.height = r.h + "%";
}

function makeDraggable(el) {
  if (el.dataset.dragBound) return;
  el.dataset.dragBound = "1";
  const handle = document.createElement("div");
  handle.className = "st-handle";
  handle.title = "Redimensionner";
  el.appendChild(handle);

  if (!el.classList.contains("st-zone-new")) {
    el.addEventListener("pointerdown", (e) => {
      if (!card.classList.contains("edit") || e.target === handle) return;
      e.stopPropagation();
      e.preventDefault();
      normalizeZone(el);
      const c = card.getBoundingClientRect();
      const start = { x: e.clientX, y: e.clientY };
      const r0 = zoneRect(el);
      const move = (ev) => {
        const dx = ((ev.clientX - start.x) / c.width) * 100;
        const dy = ((ev.clientY - start.y) / c.height) * 100;
        el.style.left = r0.x + dx + "%";
        el.style.top = r0.y + dy + "%";
        if (typeof selectedZone !== "undefined" && el === selectedZone && typeof refreshInspector === "function") refreshInspector();
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  }

  handle.addEventListener("pointerdown", (e) => {
    if (!card.classList.contains("edit")) return;
    e.stopPropagation();
    e.preventDefault();
    normalizeZone(el);
    const c = card.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY };
    const r0 = zoneRect(el);
    const move = (ev) => {
      const dw = ((ev.clientX - start.x) / c.width) * 100;
      const dh = ((ev.clientY - start.y) / c.height) * 100;
      el.style.width = Math.max(4, r0.w + dw) + "%";
      el.style.height = Math.max(2, r0.h + dh) + "%";
      if (typeof selectedZone !== "undefined" && el === selectedZone && typeof refreshInspector === "function") refreshInspector();
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });
}

function setEdit(on) {
  card.classList.toggle("edit", on);
  if (on) {
    card.classList.add("show-zones");
    document.getElementById("showZones").checked = true;
    document.querySelectorAll(EDIT_SEL).forEach(makeDraggable);
  }
}
editModeBox.addEventListener("change", () => setEdit(editModeBox.checked));

/* échelle globale du texte */
const stScaleIn = document.getElementById("stScaleIn");
const stScaleVal = document.getElementById("stScaleVal");
const applyScale = () => {
  const v = Math.max(50, Math.min(200, parseInt(stScaleIn.value, 10) || 100));
  card.style.setProperty("--st-scale", String(v / 100));
  if (stScaleVal) stScaleVal.textContent = v + "%";
};
stScaleIn.addEventListener("input", applyScale);
applyScale();

/* ajouter une zone texte déplaçable */
const addZoneBtn = document.getElementById("addZoneBtn");
addZoneBtn.addEventListener("click", () => {
  if (!card.classList.contains("studio")) return;
  const st = document.querySelector(".st");
  const z = document.createElement("div");
  z.className = "st-zone-new";
  z.contentEditable = "true";
  z.spellcheck = false;
  z.textContent = "Nouveau texte";
  z.style.left = "25%";
  z.style.top = "30%";
  z.style.width = "45%";
  z.style.height = "8%";
  z.title = "Glisser la poignée orange pour déplacer/redimensionner · double-clic pour supprimer";
  st.appendChild(z);
  makeDraggable(z);
  if (typeof syncLayersPanel === "function") syncLayersPanel();
  if (!editModeBox.checked) {
    editModeBox.checked = true;
    setEdit(true);
  }
});

/* ---------- taille & couleur indépendantes PAR TEXTE (sliders + color pickers générés) ---------- */
const TEXT_STYLES = [
  ["Marque « Outcome »", "--st-k-brand", "--st-c-brand", "#ffffff"],
  ["Nom de la carte", "--st-k-name", "--st-c-name", "#ffffff"],
  ["HP", "--st-k-hp", "--st-c-hp", "#ffffff"],
  ["Noms d'attaques", "--st-k-atk", "--st-c-atk", "#ffffff"],
  ["Dégâts", "--st-k-dmg", "--st-c-dmg", "#ffffff"],
  ["Description", "--st-k-desc", "--st-c-desc", "#dfe6ff"],
  ["Barre de type", "--st-k-type", "--st-c-type", "#ffffff"],
  ["Pied de carte", "--st-k-foot", "--st-c-foot", "#ffffff"],
  ["Zones ajoutées", "--st-k-zone", "--st-c-zone", "#ffffff"],
];
const tsBox = document.getElementById("textStyles");
for (const [label, sizeVar, colorVar, defColor] of TEXT_STYLES) {
  const row = document.createElement("label");
  row.className = "field textstyle-row";
  const span = document.createElement("span");
  span.textContent = label;
  const range = document.createElement("input");
  range.type = "range";
  range.min = "50";
  range.max = "200";
  range.value = "100";
  range.setAttribute("aria-label", "Taille " + label);
  const pct = document.createElement("b");
  pct.textContent = "100%";
  const color = document.createElement("input");
  color.type = "color";
  color.value = defColor;
  color.setAttribute("aria-label", "Couleur " + label);
  range.addEventListener("input", () => {
    card.style.setProperty(sizeVar, String(range.value / 100));
    pct.textContent = range.value + "%";
  });
  color.addEventListener("input", () => {
    card.style.setProperty(colorVar, color.value);
  });
  card.style.setProperty(colorVar, defColor);
  row.append(span, range, pct, color);
  tsBox.appendChild(row);
}

/* ---------- UNDO / REDO (Ctrl+Z · Ctrl+Shift+Z · Ctrl+Y · Ctrl+V) ---------- */
const undoStack = [];
const redoStack = [];

function snapshotStudio() {
  const st = document.querySelector(".st");
  const clone = st ? st.cloneNode(true) : null;
  if (clone) clone.querySelectorAll(".st-handle").forEach((h) => h.remove());
  const inputs = {};
  document.querySelectorAll("#pane-studio input, #pane-studio select").forEach((el) => {
    inputs[el.id] = el.type === "checkbox" ? el.checked : el.value;
  });
  return JSON.stringify({
    cardStyle: card.getAttribute("style") || "",
    stHTML: clone ? clone.innerHTML : "",
    inputs,
  });
}

function restoreStudio(s) {
  const data = JSON.parse(s);
  card.setAttribute("style", data.cardStyle);
  const st = document.querySelector(".st");
  if (st && data.stHTML) {
    st.innerHTML = data.stHTML;
    document.querySelectorAll(EDIT_SEL).forEach(makeDraggable);
  }
  for (const [id, v] of Object.entries(data.inputs || {})) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = !!v;
    else el.value = v;
  }
  if (typeof syncLayersPanel === "function") syncLayersPanel();
  if (selectedZone && !selectedZone.isConnected) selectZone(null);
}

function pushUndo() {
  const s = snapshotStudio();
  if (undoStack.length && undoStack[undoStack.length - 1] === s) return;
  undoStack.push(s);
  if (undoStack.length > 100) undoStack.shift();
  redoStack.length = 0;
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshotStudio());
  restoreStudio(undoStack.pop());
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshotStudio());
  restoreStudio(redoStack.pop());
}

/* snapshot avant chaque action (clic sur champ/bouton/zone) */
document.addEventListener(
  "pointerdown",
  (e) => {
    const t = e.target;
    if (t.closest && (t.closest("input, select, button, a") || t.closest(EDIT_SEL))) pushUndo();
  },
  true
);

document.addEventListener("keydown", (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return;
  const tag = (e.target.tagName || "").toLowerCase();
  const typing = tag === "input" || tag === "textarea" || e.target.isContentEditable;
  const k = e.key.toLowerCase();
  if (k === "z" && !e.shiftKey) {
    e.preventDefault();
    undo();
  } else if ((k === "z" && e.shiftKey) || k === "y" || (k === "v" && (e.shiftKey || !typing))) {
    e.preventDefault();
    redo();
  }
});

document.getElementById("undoBtn").addEventListener("click", undo);
document.getElementById("redoBtn").addEventListener("click", redo);

/* snapshot initial + suppression de zone par double-clic (délégation, survit aux restaurations) */
setTimeout(pushUndo, 800);
setTimeout(syncLayersPanel, 900);
document.querySelector(".st").addEventListener("dblclick", (e) => {
  const z = e.target.closest && e.target.closest(".st-zone-new");
  if (z) {
    z.remove();
    if (typeof syncLayersPanel === "function") syncLayersPanel();
  }
});

/* ---------- inspecteur façon Figma : clic sur une zone (mode édition) -> panneau de propriétés ---------- */
const ZONE_META = {
  "st-bg": { label: "Fond de carte" },
  "st-pill": { label: "Pill header" },
  "st-art": { label: "Fenêtre d'art" },
  "st-frame": { label: "Cadre" },
  "st-brand": { label: "Marque « Outcome »", sizeVar: "--st-k-brand", colorVar: "--st-c-brand", textId: "stBrandIn" },
  "st-name": { label: "Nom de la carte", sizeVar: "--st-k-name", colorVar: "--st-c-name", textId: "stNameIn" },
  "st-hp": { label: "HP", sizeVar: "--st-k-hp", colorVar: "--st-c-hp", textId: "stHpIn" },
  "st-logo": { label: "Logo" },
  "st-body": { label: "Panneau attaques" },
  "st-typebar": { label: "Barre de type", sizeVar: "--st-k-type", colorVar: "--st-c-type" },
  "st-foot": { label: "Pied de carte", sizeVar: "--st-k-foot", colorVar: "--st-c-foot" },
  "st-zone-new": { label: "Zone perso", sizeVar: "--st-k-zone", colorVar: "--st-c-zone", textId: null },
};

let selectedZone = null;
const insp = {
  box: document.getElementById("inspector"),
  name: document.getElementById("inspName"),
  textRow: document.getElementById("inspTextRow"),
  text: document.getElementById("inspText"),
  X: document.getElementById("inspX"), Y: document.getElementById("inspY"),
  W: document.getElementById("inspW"), H: document.getElementById("inspH"),
  Xv: document.getElementById("inspXv"), Yv: document.getElementById("inspYv"),
  Wv: document.getElementById("inspWv"), Hv: document.getElementById("inspHv"),
  sizeRow: document.getElementById("inspSizeRow"), size: document.getElementById("inspSize"), sizeV: document.getElementById("inspSizeV"),
  colorRow: document.getElementById("inspColorRow"), color: document.getElementById("inspColor"),
  del: document.getElementById("inspDel"),
};

function zoneMeta(el) {
  for (const cls of el.classList) if (ZONE_META[cls]) return ZONE_META[cls];
  return { label: el.className || "zone" };
}

function refreshInspector() {
  if (!selectedZone || !insp.box) return;
  const r = zoneRect(selectedZone);
  insp.X.value = r.x; insp.Y.value = r.y; insp.W.value = r.w; insp.H.value = r.h;
  insp.Xv.textContent = r.x.toFixed(1) + "%";
  insp.Yv.textContent = r.y.toFixed(1) + "%";
  insp.Wv.textContent = r.w.toFixed(1) + "%";
  insp.Hv.textContent = r.h.toFixed(1) + "%";
  const meta = zoneMeta(selectedZone);
  if (meta.sizeVar) {
    const k = parseFloat(card.style.getPropertyValue(meta.sizeVar)) || 1;
    insp.size.value = Math.round(k * 100);
    insp.sizeV.textContent = Math.round(k * 100) + "%";
    insp.sizeRow.hidden = false;
  } else insp.sizeRow.hidden = true;
  if (meta.colorVar) {
    insp.color.value = card.style.getPropertyValue(meta.colorVar) || "#ffffff";
    insp.colorRow.hidden = false;
  } else insp.colorRow.hidden = true;
  if (meta.textId || selectedZone.classList.contains("st-zone-new")) {
    insp.text.value = meta.textId
      ? document.getElementById(meta.textId).value
      : selectedZone.textContent;
    insp.textRow.hidden = false;
  } else insp.textRow.hidden = true;
  insp.del.hidden = !selectedZone.classList.contains("st-zone-new");
}

function selectZone(el) {
  document.querySelectorAll(".st .selected").forEach((z) => z.classList.remove("selected"));
  selectedZone = el;
  if (!el) {
    if (insp.box) insp.box.hidden = true;
    return;
  }
  el.classList.add("selected");
  if (insp.box) {
    insp.box.hidden = false;
    insp.name.textContent = zoneMeta(el).label;
  }
  refreshInspector();
}

/* clic sur une zone en mode édition -> sélection (phase capture, avant le drag) */
document.querySelector(".st").addEventListener(
  "pointerdown",
  (e) => {
    if (!card.classList.contains("edit")) return;
    const z = e.target.closest(EDIT_SEL);
    selectZone(z || null);
  },
  true
);

/* application live des champs de l'inspecteur */
function inspApply() {
  if (!selectedZone) return;
  normalizeZone(selectedZone);
  selectedZone.style.left = insp.X.value + "%";
  selectedZone.style.top = insp.Y.value + "%";
  selectedZone.style.width = insp.W.value + "%";
  selectedZone.style.height = insp.H.value + "%";
  refreshInspector();
}
for (const k of ["X", "Y", "W", "H"]) insp[k].addEventListener("input", inspApply);

insp.size.addEventListener("input", () => {
  const meta = zoneMeta(selectedZone);
  if (meta.sizeVar) card.style.setProperty(meta.sizeVar, String(insp.size.value / 100));
  insp.sizeV.textContent = insp.size.value + "%";
});
insp.color.addEventListener("input", () => {
  const meta = zoneMeta(selectedZone);
  if (meta.colorVar) card.style.setProperty(meta.colorVar, insp.color.value);
});
insp.text.addEventListener("input", () => {
  if (!selectedZone) return;
  const meta = zoneMeta(selectedZone);
  if (meta.textId) {
    const inpEl = document.getElementById(meta.textId);
    inpEl.value = insp.text.value;
    inpEl.dispatchEvent(new Event("input", { bubbles: true }));
  } else {
    selectedZone.textContent = insp.text.value;
  }
});
insp.del.addEventListener("click", () => {
  if (selectedZone && selectedZone.classList.contains("st-zone-new")) {
    selectedZone.remove();
    selectZone(null);
  }
});

/* ---------- panneau de CALQUES à droite (style Photoshop/Figma) ---------- */
const layersPanel = document.getElementById("layersPanel");
const layersList = document.getElementById("layersList");

function layerLabel(el) {
  const meta = zoneMeta(el);
  return meta.label || el.className;
}

function buildLayers() {
  if (!layersList) return;
  const zones = [...document.querySelectorAll(EDIT_SEL)];
  // ordre = z-index croissant (les hauts de pile en bas, comme Figma/Photoshop)
  zones.sort((a, b) => {
    const za = parseInt(getComputedStyle(a).zIndex) || 0;
    const zb = parseInt(getComputedStyle(b).zIndex) || 0;
    return za - zb;
  });
  layersList.innerHTML = "";
  for (const el of zones) {
    const row = document.createElement("div");
    row.className = "layer-row" + (el === selectedZone ? " selected" : "") + (el.style.visibility === "hidden" ? " off" : "");
    row.dataset.zone = el.className;

    const eye = document.createElement("button");
    eye.className = "layer-eye";
    eye.textContent = el.style.visibility === "hidden" ? "🚫" : "👁";
    eye.title = "Afficher / masquer";
    eye.addEventListener("click", (e) => {
      e.stopPropagation();
      el.style.visibility = el.style.visibility === "hidden" ? "" : "hidden";
      buildLayers();
    });

    const name = document.createElement("span");
    name.className = "layer-name";
    name.textContent = layerLabel(el);

    const up = document.createElement("button");
    up.className = "layer-z";
    up.textContent = "▲";
    up.title = "Monter d'un niveau";
    up.addEventListener("click", (e) => {
      e.stopPropagation();
      const z = parseInt(el.style.zIndex || getComputedStyle(el).zIndex) || 0;
      el.style.zIndex = String(z + 1);
      buildLayers();
    });
    const down = document.createElement("button");
    down.className = "layer-z";
    down.textContent = "▼";
    down.title = "Descendre d'un niveau";
    down.addEventListener("click", (e) => {
      e.stopPropagation();
      const z = parseInt(el.style.zIndex || getComputedStyle(el).zIndex) || 0;
      el.style.zIndex = String(Math.max(0, z - 1));
      buildLayers();
    });

    row.append(eye, name, up, down);
    row._zone = el;
    /* clic = sélection ; glisser VERTICALEMENT = monter/descendre le calque dans l'ordre (z-index) */
    row.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return; /* boutons œil / ▲▼ gérés à part */
      e.preventDefault();
      if (!card.classList.contains("edit")) setEdit(true);
      document.querySelectorAll(".layer-row.selected").forEach((r) => r.classList.remove("selected"));
      row.classList.add("selected");
      selectZone(el);
      pushUndo(); /* snapshot avant reorder (no-op sur simple clic, dédoublonné) */
      const startY = e.clientY;
      let dragging = false;
      const move = (ev) => {
        if (!dragging && Math.abs(ev.clientY - startY) > 6) {
          dragging = true;
          row.classList.add("dragging");
        }
        if (!dragging) return;
        /* insérer la ligne sous le curseur (avant la 1ère ligne dont le milieu est dépassé) */
        const rows = [...layersList.querySelectorAll(".layer-row:not(.dragging)")];
        let before = null;
        for (const r of rows) {
          const bb = r.getBoundingClientRect();
          if (ev.clientY < bb.top + bb.height / 2) { before = r; break; }
        }
        if (before) layersList.insertBefore(row, before);
        else layersList.appendChild(row);
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        row.classList.remove("dragging");
        if (dragging) {
          /* ordre DOM des lignes = nouvel ordre de pile -> z-index croissant (bas de liste = haut de pile) */
          [...layersList.querySelectorAll(".layer-row")].forEach((r, i) => {
            if (r._zone) r._zone.style.zIndex = String(i + 1);
          });
        }
        if (typeof syncLayersPanel === "function") syncLayersPanel();
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
    layersList.appendChild(row);
  }
}

function syncLayersPanel() {
  if (!layersPanel) return;
  const studioOn = !document.getElementById("pane-studio").hidden;
  layersPanel.hidden = !studioOn;
  if (studioOn) buildLayers();
}

/* synchro : onglets, mode édition, ajout/suppression de zone, undo/redo */
document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => setTimeout(syncLayersPanel, 250)));
const _setEdit = setEdit;
setEdit = function (on) {
  _setEdit(on);
  setTimeout(syncLayersPanel, 50);
};
