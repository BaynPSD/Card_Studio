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

const EFFECTS = [
  { id: "basic", label: "Basique (non-holo)", rarity: "common" },
  { id: "holo", label: "Holo rare", rarity: "rare holo" },
  { id: "reverse", label: "Reverse holo", rarity: "reverse holo" },
  { id: "cosmos", label: "Cosmos / Galaxy", rarity: "rare holo cosmos" },
  { id: "amazing", label: "Amazing rare", rarity: "amazing rare" },
  { id: "radiant", label: "Radiant", rarity: "radiant rare" },
  { id: "rainbow", label: "Rainbow rare", rarity: "rare rainbow" },
  { id: "rainbow-alt", label: "Rainbow alt (VMAX)", rarity: "rare rainbow alt" },
  { id: "secret", label: "Secret rare (or)", rarity: "rare secret" },
  { id: "v", label: "Pokémon V", rarity: "rare holo v" },
  { id: "vfull", label: "V Full Art", rarity: "rare ultra", supertype: "pokémon" },
  { id: "vmax", label: "VMAX", rarity: "rare holo vmax", supertype: "pokémon" },
  { id: "vstar", label: "VSTAR", rarity: "rare holo vstar" },
  { id: "shinyv", label: "Shiny V", rarity: "rare shiny v" },
  { id: "shinyvmax", label: "Shiny VMAX", rarity: "rare shiny vmax" },
  { id: "tg", label: "Trainer Gallery", rarity: "trainer gallery rare holo" },
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
  card.dataset.subtypes = "basic";
  card.dataset.set = "";
  card.dataset.number = "";
  card.dataset.trainerGallery = "false";
  document.querySelectorAll("#effects button").forEach((b) => {
    b.classList.toggle("active", b.dataset.effect === id);
  });
}

EFFECTS.forEach((fx) => {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = fx.label;
  b.dataset.effect = fx.id;
  b.addEventListener("click", () => applyEffect(fx.id));
  effectsBox.appendChild(b);
});
applyEffect("holo");

/* ---------- upload ---------- */

const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const dropOverlay = document.getElementById("dropOverlay");

function randomizeSeeds() {
  card.style.setProperty("--seedx", String(Math.random()));
  card.style.setProperty("--seedy", String(Math.random()));
  card.style.setProperty(
    "--cosmosbg",
    Math.floor(Math.random() * 734) + "px " + Math.floor(Math.random() * 1280) + "px"
  );
}

function loadImageSource(src, name) {
  card.classList.add("loading");
  img.onload = () => {
    card.classList.remove("loading");
    randomizeSeeds();
  };
  img.src = src;
  fileName.textContent = name ? "🖼 " + name : "";
}

function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    alert("Choisis un fichier image (PNG, JPG…).");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => loadImageSource(reader.result, file.name);
  reader.readAsDataURL(file);
}

fileInput.addEventListener("change", (e) => {
  handleFile(e.target.files[0]);
  fileInput.value = "";
});

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
  handleFile(file);
});

img.addEventListener("load", () => card.classList.remove("loading"));
randomizeSeeds();

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

/* ---------- démo auto ---------- */

const demoBtn = document.getElementById("demoBtn");

function endShowcase() {
  if (showcaseRunning) {
    clearInterval(showcaseInterval);
    showcaseRunning = false;
    demoBtn.textContent = "▶ Démo auto";
    demoBtn.classList.remove("running");
  }
}

demoBtn.addEventListener("click", () => {
  if (showcaseRunning) {
    endShowcase();
    interactEnd();
    return;
  }
  showcaseRunning = true;
  demoBtn.textContent = "⏹ Stop démo";
  demoBtn.classList.add("running");
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
});

/* ---------- reset ---------- */

document.getElementById("resetBtn").addEventListener("click", () => {
  endShowcase();
  fileInput.value = "";
  fileName.textContent = "";
  loadImageSource("img/sample-card.png", "");
  applyEffect("holo");
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
