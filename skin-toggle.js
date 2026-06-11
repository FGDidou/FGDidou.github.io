const STORAGE_PREFIX = "vfg-skin-mode";
const LEGACY_PREFIX = "vfg-skin-skyblog";
const INIT_FLAG = "__vfgSkinToggleInit";
const CLICK_DEBOUNCE_MS = 450;

const SKINS = [
  "default",
  "skyblog",
  "y2k",
  "weebkawai",
  "brutaliste",
  "terminal",
  "candy-chaos",
  "wireframe",
];

const RANDOM_SKINS = SKINS.filter((id) => id !== "default");

const SKIN_CLASS = {
  skyblog: "skin-skyblog",
  y2k: "skin-y2k",
  weebkawai: "skin-weebkawai",
  brutaliste: "skin-brutaliste",
  terminal: "skin-terminal",
  "candy-chaos": "skin-candy-chaos",
  wireframe: "skin-wireframe",
};

const LABELS = {
  default: "Skin: Normal",
  skyblog: "°o° Skyblog",
  y2k: "⌨ Y2K Arena",
  weebkawai: "♡ Weeb Kawaii",
  brutaliste: "▣ Brutaliste",
  terminal: "▓ Terminal",
  "candy-chaos": "🍬 Candy Chaos",
  wireframe: "⊞ Wireframe",
};

const TITLES = {
  default: "Cliquer pour Skyblog",
  skyblog: "Cliquer pour Y2K Arena (forum · IRC · MSN · Habbo)",
  y2k: "Cliquer pour Weeb Kawaii",
  weebkawai: "Cliquer pour Brutaliste (moche · pratique · moderne)",
  brutaliste: "Cliquer pour Terminal (CRT · monospace · clavier)",
  terminal: "Cliquer pour Candy Chaos (HSL procédural · grille)",
  "candy-chaos": "Cliquer pour Wireframe (layout debug)",
  wireframe: "Cliquer pour revenir au mode normal",
};

const CANDY_ACCENT_HUES = [8, 52, 142, 208, 286, 334];
const CANDY_ACCENT_KEY = "vfg-skin-candy-accent";

function loadCandyAccent(appId) {
  try {
    const stored = localStorage.getItem(`${CANDY_ACCENT_KEY}:${appId}`);
    if (stored != null && CANDY_ACCENT_HUES.includes(Number(stored))) return stored;
  } catch {
    /* ignore */
  }
  return String(CANDY_ACCENT_HUES[0]);
}

function rotateCandyAccent(appId) {
  const prev = Number(loadCandyAccent(appId));
  const idx = CANDY_ACCENT_HUES.indexOf(prev);
  const next = CANDY_ACCENT_HUES[(idx + 1) % CANDY_ACCENT_HUES.length];
  try {
    localStorage.setItem(`${CANDY_ACCENT_KEY}:${appId}`, String(next));
  } catch {
    /* ignore */
  }
  return String(next);
}

function randomCandyAccent(appId) {
  const next = CANDY_ACCENT_HUES[Math.floor(Math.random() * CANDY_ACCENT_HUES.length)];
  try {
    localStorage.setItem(`${CANDY_ACCENT_KEY}:${appId}`, String(next));
  } catch {
    /* ignore */
  }
  return String(next);
}

export function pickRandomSkin() {
  return RANDOM_SKINS[Math.floor(Math.random() * RANDOM_SKINS.length)];
}

export function loadSkinMode(appId) {
  try {
    let mode = localStorage.getItem(`${STORAGE_PREFIX}:${appId}`);
    if (!mode) {
      const legacy = localStorage.getItem(`${LEGACY_PREFIX}:${appId}`);
      if (legacy === "1") mode = "skyblog";
    }
    return SKINS.includes(mode) ? mode : "default";
  } catch {
    return "default";
  }
}

export function saveSkinMode(mode, appId) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}:${appId}`, mode);
  } catch {
    /* ignore */
  }
}

export function applySkinMode(mode, appId) {
  document.body.classList.remove(...Object.values(SKIN_CLASS), "skin-off");
  const cls = SKIN_CLASS[mode];
  if (cls) document.body.classList.add(cls);
  document.body.dataset.skin = mode;
  if (mode === "default") document.body.classList.add("skin-off");
  if (mode === "candy-chaos" && appId) {
    document.body.style.setProperty("--cc-accent-h", loadCandyAccent(appId));
  } else {
    document.body.style.removeProperty("--cc-accent-h");
  }
}

export function randomSkinMode(appId) {
  let mode = pickRandomSkin();
  if (mode === "candy-chaos") randomCandyAccent(appId);
  saveSkinMode(mode, appId);
  applySkinMode(mode, appId);
  return mode;
}

function updateButton(btn, mode) {
  if (!btn) return;
  const on = mode !== "default";
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  btn.dataset.skin = mode;
  btn.textContent = LABELS[mode];
  btn.title = TITLES[mode];
}

function updateDisableButton(btn, mode) {
  if (!btn) return;
  const on = mode === "default";
  btn.disabled = on;
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  btn.title = on ? "Déjà en mode normal" : "Désactiver le skin (mode normal)";
}

export function disableSkinMode(appId) {
  saveSkinMode("default", appId);
  applySkinMode("default", appId);
  updateButton(document.getElementById("skin-toggle"), "default");
  updateDisableButton(document.getElementById("skin-disable"), "default");
}

export function initSkinToggle(appId) {
  const flag = `${INIT_FLAG}:${appId}`;
  if (window[flag]) return;
  window[flag] = true;

  const btn = document.getElementById("skin-toggle");
  const disableBtn = document.getElementById("skin-disable");
  const randomBtn = document.getElementById("skin-random");
  let mode = document.body.dataset.skin || loadSkinMode(appId);
  if (!SKINS.includes(mode)) mode = "default";
  let lastClick = 0;

  applySkinMode(mode, appId);
  updateButton(btn, mode);
  updateDisableButton(disableBtn, mode);

  const syncMode = (next) => {
    mode = next;
    updateButton(btn, mode);
    updateDisableButton(disableBtn, mode);
  };

  btn?.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const now = Date.now();
      if (now - lastClick < CLICK_DEBOUNCE_MS) return;
      lastClick = now;

      const idx = SKINS.indexOf(mode);
      mode = SKINS[(idx + 1) % SKINS.length];
      if (mode === "candy-chaos") rotateCandyAccent(appId);
      saveSkinMode(mode, appId);
      applySkinMode(mode, appId);
      syncMode(mode);
    },
    { passive: false },
  );

  randomBtn?.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const now = Date.now();
      if (now - lastClick < CLICK_DEBOUNCE_MS) return;
      lastClick = now;
      syncMode(randomSkinMode(appId));
    },
    { passive: false },
  );

  disableBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (mode === "default") return;
    mode = "default";
    disableSkinMode(appId);
  });
}

export function bootSkinInline(appId) {
  applySkinMode(loadSkinMode(appId), appId);
}
