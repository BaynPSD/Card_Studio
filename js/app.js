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
  { id: "s151-pokeball", label: "Poké Ball holo", e151: true, rarity: "pokeball holo", ...P },
  { id: "s151-masterball", label: "Master Ball holo", e151: true, rarity: "masterball holo", ...P },
];

const settings = {
  rotMax: 14,
  glareStrength: 1,
};

const INTERACT = { stiffness: 0.066, damping: 0.25 };
const SNAP = { stiffness: 0.01, damping: 0.06 };

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

let interacting = false;
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
  endShowcase();
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
    springRotate.set({ x: 0, y: 0 }, SNAP);
    springGlare.set({ x: 50, y: 50, o: 0 }, SNAP);
    springBackground.set({ x: 50, y: 50 }, SNAP);
  }, 350);
}

rotator.addEventListener("pointermove", interact);
rotator.addEventListener("pointerdown", interact);
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
  s.setProperty("--pointer-from-center", round(fromCenter, 4));
  s.setProperty("--pointer-from-top", round(gy / 100, 4));
  s.setProperty("--pointer-from-left", round(gx / 100, 4));
  s.setProperty("--card-opacity", round(clamp(springGlare.value.o * settings.glareStrength, 0, 1.5), 4));
  s.setProperty("--rotate-x", round(springRotate.value.x, 3) + "deg");
  s.setProperty("--rotate-y", round(springRotate.value.y, 3) + "deg");
  s.setProperty("--background-x", round(springBackground.value.x, 3) + "%");
  s.setProperty("--background-y", round(springBackground.value.y, 3) + "%");

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
};

const slots = {
  card: { url: DEFAULT_FILES.card, thumb: DEFAULT_FILES.card, custom: false, blob: null },
  mask: { thumb: DEFAULT_FILES.mask, maskUrl: null, custom: false, blob: null },
  foil: { url: DEFAULT_FILES.foil, thumb: DEFAULT_FILES.foil, custom: false, blob: null },
};

function randomizeSeeds() {
  card.style.setProperty("--seedx", String(Math.random()));
  card.style.setProperty("--seedy", String(Math.random()));
  card.style.setProperty(
    "--cosmosbg",
    Math.floor(Math.random() * 734) + "px " + Math.floor(Math.random() * 1280) + "px"
  );
}

function applyImages() {
  card.classList.add("loading");
  img.onload = () => {
    card.classList.remove("loading");
    randomizeSeeds();
  };
  img.src = slots.card.url;
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
img.addEventListener("load", () => card.classList.remove("loading"));
applyDefaultMask();

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
  card.style.width = sizeInput.value + "px";
  sizeOut.textContent = sizeInput.value + "px";
});
glowInput.addEventListener("input", () => {
  card.style.setProperty("--card-glow", glowInput.value);
});

/* ---------- démo auto (activée par défaut, comme ribi-holo) ---------- */

const autoBox = document.getElementById("auto");

function endShowcase() {
  if (showcaseRunning) {
    clearInterval(showcaseInterval);
    showcaseRunning = false;
  }
}

function startShowcase() {
  if (showcaseRunning) return;
  showcaseRunning = true;
  let r = 0;
  const amp = settings.rotMax * 1.75;
  showcaseInterval = setInterval(() => {
    r += 0.05;
    springRotate.set(
      { x: Math.sin(r) * amp, y: Math.cos(r) * amp },
      { stiffness: 0.02, damping: 0.5 }
    );
    springGlare.set(
      { x: 55 + Math.sin(r) * 55, y: 55 + Math.cos(r) * 55, o: 0.8 },
      { stiffness: 0.02, damping: 0.5 }
    );
    springBackground.set(
      { x: 20 + Math.sin(r) * 20, y: 20 + Math.cos(r) * 20 },
      { stiffness: 0.02, damping: 0.5 }
    );
  }, 20);
}

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
  rotOut.textContent = "14°";
  glareOut.textContent = "100%";
  sizeOut.textContent = "360px";
  card.style.width = "360px";
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
