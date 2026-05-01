import { removeBackground } from "@imgly/background-removal";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const DEFAULT_ADSENSE_CLIENT = "ca-pub-7040432689582179";
const ADSENSE_CLIENT = (import.meta.env.VITE_ADSENSE_CLIENT || DEFAULT_ADSENSE_CLIENT).trim();
const ADSENSE_SLOTS = {
  top: (import.meta.env.VITE_ADSENSE_SLOT_TOP || "").trim(),
  editor: (import.meta.env.VITE_ADSENSE_SLOT_EDITOR || "").trim(),
  bottom: (import.meta.env.VITE_ADSENSE_SLOT_BOTTOM || "").trim(),
} as const;
const ADSENSE_AUTO = (import.meta.env.VITE_ADSENSE_AUTO || "true").trim() === "true";

function isValidAdsenseClient(client: string) {
  return /^ca-pub-\d{16}$/.test(client);
}

function isValidAdsenseSlot(slot: string) {
  return /^\d{10,}$/.test(slot);
}

function loadAdsense(client: string) {
  if (document.querySelector<HTMLScriptElement>('script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) return;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  document.head.appendChild(script);
}

function setupAdsense() {
  if (!isValidAdsenseClient(ADSENSE_CLIENT)) return;
  const slots = document.querySelectorAll<HTMLElement>("[data-ad-slot-key]");
  loadAdsense(ADSENSE_CLIENT);
  slots.forEach((container) => {
    const key = container.dataset.adSlotKey as keyof typeof ADSENSE_SLOTS | undefined;
    const slot = key ? ADSENSE_SLOTS[key] : "";
    if (!isValidAdsenseSlot(slot)) return;
    container.hidden = false;
    container.innerHTML = '<span class="ad-label">広告</span>';
    const ad = document.createElement("ins");
    ad.className = "adsbygoogle";
    ad.style.display = "block";
    ad.dataset.adClient = ADSENSE_CLIENT;
    ad.dataset.adSlot = slot;
    ad.dataset.adFormat = "auto";
    ad.dataset.fullWidthResponsive = "true";
    container.appendChild(ad);
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  });
}

type Aspect = { id: string; w: number; h: number; name: string };
const ASPECTS: Aspect[] = [
  { id: "30x40", w: 30, h: 40, name: "履歴書（就活、転職、バイト）" },
  { id: "35x45-my-online", w: 35, h: 45, name: "マイナンバーカード オンライン申請用" },
  { id: "35x45-my-print", w: 35, h: 45, name: "マイナンバーカード 印刷用" },
  { id: "24x30-license", w: 24, h: 30, name: "免許（自動車運転免許証）" },
  { id: "35x45-passport", w: 35, h: 45, name: "パスポート（旅券）印刷用" },
  { id: "51x62-passport", w: 51, h: 62, name: "パスポート Mynaportal オンライン申請" },
  { id: "40x60-medical", w: 40, h: 60, name: "医学系各種試験" },
  { id: "50x50-shiho", w: 50, h: 50, name: "司法書士、土地家屋調査士受験" },
  { id: "24x30-eiken", w: 24, h: 30, name: "英検 S-CBT、電気通信受験など" },
  { id: "25x30-koyou", w: 25, h: 30, name: "雇用保険受給申請、航空従事者試験など" },
  { id: "40x50-intl", w: 40, h: 50, name: "国際自動車免許申請、社会保険労務士受験" },
  { id: "30x40-toeic", w: 30, h: 40, name: "TOEIC、国家公務員試験など" },
];

type Background = { id: string; label: string; color: string };
const BACKGROUNDS: Background[] = [
  { id: "std-blue",  label: "スタンダードブルー", color: "#7bb8db" },
  { id: "white",     label: "ホワイト",           color: "#ffffff" },
  { id: "red",       label: "レッド",             color: "#d73641" },
  { id: "pink",      label: "ピンク",             color: "#e9a8bd" },
  { id: "orange",    label: "オレンジ",           color: "#e08842" },
  { id: "green",     label: "グリーン",           color: "#7cb547" },
  { id: "std-gray",  label: "スタンダードグレー", color: "#a9a7a3" },
  { id: "gray",      label: "グレー",             color: "#4b4b4b" },
  { id: "charcoal",  label: "チャコール",         color: "#5a4e46" },
  { id: "black",     label: "ブラック",           color: "#1a1a1a" },
  { id: "blue",      label: "ブルー",             color: "#4f8fc4" },
  { id: "yellow",    label: "イエロー",           color: "#e8dc7a" },
];
type BgMode = "solid" | "gradient";
function swatchCss(color: string, mode: BgMode) {
  return mode === "solid" ? color : `linear-gradient(to bottom, ${color}, #ffffff)`;
}
function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, mode: BgMode) {
  if (mode === "solid") solid(ctx, w, h, color);
  else gradient(ctx, w, h, color, "#ffffff");
}

function solid(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}
function gradient(ctx: CanvasRenderingContext2D, w: number, h: number, top: string, bottom: string) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

const PREVIEW_PX_PER_MM = 16; // プレビュー用: 1mm = 16px (30x40mm -> 480x640) ≈ 400dpi
type OutputPreset = { id: string; label: string; dpi?: number; longPx?: number; customDpi?: boolean; customPx?: boolean };
const OUTPUT_PRESETS: OutputPreset[] = [
  { id: "print-300", label: "印刷標準（300 dpi）", dpi: 300 },
  { id: "print-350", label: "プロ印刷（350 dpi）", dpi: 350 },
  { id: "online", label: "オンライン申請用（長辺 640 px）", longPx: 640 },
  { id: "custom-dpi", label: "カスタム（dpi を指定）", customDpi: true },
  { id: "custom-px", label: "カスタム（長辺 px を指定）", customPx: true },
];
type ExportMode = "sheet" | "single";
type SheetLayout = {
  dpi: number;
  wMm: number;
  hMm: number;
  marginMm: number;
  gapMm: number;
  labelMm: number;
  footerMm: number;
};
const DEFAULT_SHEET: SheetLayout = {
  dpi: 300,
  wMm: 152,
  hMm: 102,
  marginMm: 4,
  gapMm: 1,
  labelMm: 18,
  footerMm: 9,
};
function computeOutput(p: OutputPreset, wMm: number, hMm: number, customDpi: number, customPx: number): { w: number; h: number; suffix: string } {
  if (p.customDpi) {
    return {
      w: Math.round((wMm * customDpi) / 25.4),
      h: Math.round((hMm * customDpi) / 25.4),
      suffix: `${customDpi}dpi`,
    };
  }
  if (p.customPx) {
    const ratio = Math.max(wMm, hMm);
    return {
      w: Math.round((wMm / ratio) * customPx),
      h: Math.round((hMm / ratio) * customPx),
      suffix: `${customPx}px`,
    };
  }
  if (p.longPx) {
    const ratio = Math.max(wMm, hMm);
    return {
      w: Math.round((wMm / ratio) * p.longPx),
      h: Math.round((hMm / ratio) * p.longPx),
      suffix: `${p.longPx}px`,
    };
  }
  const dpi = p.dpi!;
  return {
    w: Math.round((wMm * dpi) / 25.4),
    h: Math.round((hMm * dpi) / 25.4),
    suffix: `${dpi}dpi`,
  };
}

const state = {
  subject: null as HTMLImageElement | null,
  aspect: ASPECTS[0],
  background: BACKGROUNDS[0],
  bgMode: "gradient" as BgMode,
  exportMode: "sheet" as ExportMode,
  output: OUTPUT_PRESETS[0],
  customDpi: 300,
  customPx: 800,
  scale: 1.0,
  offsetX: 0,
  offsetY: 0,
  flip: false,
};

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const canvas = $<HTMLCanvasElement>("canvas");
const ctx = canvas.getContext("2d")!;
const fileInput = $<HTMLInputElement>("file");
const drop = $<HTMLLabelElement>("drop");
const editor = $("editor");
const uploadSection = $("upload-section");
const loading = $("loading");
const loadingText = $("loading-text");
loading.hidden = true;

function setCanvasSize() {
  canvas.width = state.aspect.w * PREVIEW_PX_PER_MM;
  canvas.height = state.aspect.h * PREVIEW_PX_PER_MM;
  const isMobile = window.matchMedia("(max-width: 640px)").matches;
  const maxH = isMobile ? Math.min(360, window.innerHeight * 0.44) : Math.min(480, window.innerHeight * 0.6);
  const scale = Math.min(1, maxH / canvas.height);
  canvas.style.width = `${canvas.width * scale}px`;
  canvas.style.height = `${canvas.height * scale}px`;
}

function drawScene(target: CanvasRenderingContext2D, w: number, h: number, refW: number) {
  drawBackground(target, w, h, state.background.color, state.bgMode);
  if (!state.subject) return;
  const img = state.subject;
  const scaleFactor = w / refW;
  const base = (h * 0.9) / img.height;
  const s = base * state.scale;
  const dw = img.width * s;
  const dh = img.height * s;
  const cx = w / 2 + state.offsetX * scaleFactor;
  const cy = h * 0.55 + state.offsetY * scaleFactor;
  target.save();
  target.translate(cx, cy);
  if (state.flip) target.scale(-1, 1);
  target.imageSmoothingEnabled = true;
  target.imageSmoothingQuality = "high";
  target.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  target.restore();
}

function render() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  drawScene(ctx, w, h, w);
}

function showEditor() {
  document.body.classList.add("is-editing");
  uploadSection.hidden = true;
  editor.hidden = false;
}

function showUpload() {
  document.body.classList.remove("is-editing");
  uploadSection.hidden = false;
  editor.hidden = true;
}

async function handleFile(file: File) {
  showEditor();
  setCanvasSize();
  render();
  loading.hidden = false;
  loadingText.textContent = "画像を準備中...";
  let resized: Blob;
  try {
    resized = await resizeImage(file, 2048);
  } catch (e) {
    console.error("Failed to load image", e);
    loadingText.textContent = "画像を読み込めませんでした。JPEG / PNG の写真でお試しください。";
    await new Promise((r) => setTimeout(r, 2200));
    showUpload();
    loading.hidden = true;
    return;
  }

  try {
    loadingText.textContent = "初期化中... (初回はAIモデルのダウンロードに時間がかかります)";
    const blob = await removeBackground(resized, {
      model: "isnet_quint8",
      progress: (key, current, total) => {
        const pct = total ? Math.round((current / total) * 100) : 0;
        if (key.startsWith("fetch")) {
          loadingText.textContent = `AIモデルをダウンロード中... ${pct}% (端末内で処理、初回のみ)`;
        } else if (key.startsWith("compute")) {
          loadingText.textContent = `背景を除去中... ${pct}%`;
        } else {
          loadingText.textContent = `処理中... ${pct}%`;
        }
      },
    });
    loadingText.textContent = "画像を読み込み中...";
    const img = await loadImage(blob);
    state.subject = img;
    render();
  } catch (e) {
    console.warn("Background removal failed; continuing with original image", e);
    loadingText.textContent = "背景除去に失敗したため、元画像のまま続行します...";
    const img = await loadImage(resized);
    state.subject = img;
    render();
    await new Promise((r) => setTimeout(r, 900));
  } finally {
    loading.hidden = true;
  }
}

async function resizeImage(file: File, maxDim: number): Promise<Blob> {
  const img = await loadImage(file);
  const { width, height } = img;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  if (scale >= 1) return file;
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/png"));
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗"));
    img.src = url;
  });
}

// File input
fileInput.addEventListener("change", () => {
  const f = fileInput.files?.[0];
  if (f) handleFile(f);
});
drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("drag"); });
drop.addEventListener("dragleave", () => drop.classList.remove("drag"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("drag");
  const f = e.dataTransfer?.files?.[0];
  if (f) handleFile(f);
});

// Size presets (dropdown)
const aspectSelect = $<HTMLSelectElement>("aspect");
const dimsNote = $("dims-note");
ASPECTS.forEach((a) => {
  const opt = document.createElement("option");
  opt.value = a.id;
  opt.textContent = `${a.name}（${a.w}×${a.h}mm）`;
  aspectSelect.appendChild(opt);
});
function updateDimsNote() {
  const a = state.aspect;
  dimsNote.textContent = `${a.w}mm × ${a.h}mm`;
}
aspectSelect.addEventListener("change", () => {
  const found = ASPECTS.find((x) => x.id === aspectSelect.value);
  if (found) {
    state.aspect = found;
    setCanvasSize();
    updateDimsNote();
    if (typeof updateDpiNote === "function") updateDpiNote();
    render();
  }
});
updateDimsNote();

// Backgrounds
const bgList = $("bg-list");
const bgButtons: HTMLButtonElement[] = [];
function refreshSwatches() {
  bgButtons.forEach((el, i) => {
    el.style.background = swatchCss(BACKGROUNDS[i].color, state.bgMode);
  });
}
const DEFAULT_BG_INDEX = 0; // スタンダードブルー
BACKGROUNDS.forEach((bg, i) => {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "swatch" + (i === DEFAULT_BG_INDEX ? " active" : "");
  el.title = bg.label;
  el.dataset.label = bg.label;
  el.addEventListener("click", () => {
    state.background = bg;
    bgList.querySelectorAll(".swatch").forEach((n) => n.classList.remove("active"));
    el.classList.add("active");
    render();
  });
  bgList.appendChild(el);
  bgButtons.push(el);
});
state.background = BACKGROUNDS[DEFAULT_BG_INDEX];
refreshSwatches();

// Background mode toggle
document.querySelectorAll<HTMLInputElement>('input[name="bg-mode"]').forEach((r) => {
  r.addEventListener("change", () => {
    if (r.checked) {
      state.bgMode = r.value as BgMode;
      refreshSwatches();
      render();
    }
  });
});

// Output preset select
const outputSelect = $<HTMLSelectElement>("dpi");
OUTPUT_PRESETS.forEach((o) => {
  const opt = document.createElement("option");
  opt.value = o.id;
  opt.textContent = o.label;
  outputSelect.appendChild(opt);
});
outputSelect.value = OUTPUT_PRESETS[0].id;
const dpiNote = $("dpi-note");
const exportNote = $("export-note");
const customDpiBox = $("custom-dpi-box");
const customPxBox = $("custom-px-box");
const customDpiInput = $<HTMLInputElement>("custom-dpi");
const customPxInput = $<HTMLInputElement>("custom-px");
const exportModeRadios = document.querySelectorAll<HTMLInputElement>('input[name="export-mode"]');
function updateDpiNote() {
  const a = state.aspect;
  const { w, h } = computeOutput(state.output, a.w, a.h, state.customDpi, state.customPx);
  const sheetW = Math.round((DEFAULT_SHEET.wMm * DEFAULT_SHEET.dpi) / 25.4);
  const sheetH = Math.round((DEFAULT_SHEET.hMm * DEFAULT_SHEET.dpi) / 25.4);
  if (state.exportMode === "sheet") {
    dpiNote.textContent = `出力: ${sheetW} × ${sheetH} px / ${countSheetSlots(state.aspect.w, state.aspect.h, DEFAULT_SHEET)}枚`;
    exportNote.textContent = "写真プリント風シートに、同じ証明写真を複数枚並べて保存します。";
  } else {
    dpiNote.textContent = `出力: ${w} × ${h} px`;
    exportNote.textContent = "用途サイズどおりの1枚画像として保存します。";
  }
  customDpiBox.hidden = state.exportMode !== "single" || !state.output.customDpi;
  customPxBox.hidden = state.exportMode !== "single" || !state.output.customPx;
  outputSelect.disabled = state.exportMode === "sheet";
}
exportModeRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    if (!radio.checked) return;
    state.exportMode = radio.value as ExportMode;
    updateDpiNote();
    updateSaveActions();
  });
});
outputSelect.addEventListener("change", () => {
  const found = OUTPUT_PRESETS.find((o) => o.id === outputSelect.value);
  if (found) {
    state.output = found;
    updateDpiNote();
  }
});
customDpiInput.addEventListener("input", () => {
  const v = parseInt(customDpiInput.value);
  if (!isNaN(v) && v >= 72 && v <= 1200) {
    state.customDpi = v;
    updateDpiNote();
  }
});
customPxInput.addEventListener("input", () => {
  const v = parseInt(customPxInput.value);
  if (!isNaN(v) && v >= 100 && v <= 4000) {
    state.customPx = v;
    updateDpiNote();
  }
});
updateDpiNote();

function updateStatus() {}

function mmToPx(mm: number, dpi: number) {
  return Math.round((mm * dpi) / 25.4);
}

function countSheetSlots(photoWmm: number, photoHmm: number, layout: SheetLayout) {
  const usableW = layout.wMm - layout.marginMm * 2 - layout.labelMm;
  const usableH = layout.hMm - layout.marginMm * 2 - layout.footerMm;
  const cols = Math.max(1, Math.floor((usableW + layout.gapMm) / (photoWmm + layout.gapMm)));
  const rows = Math.max(1, Math.floor((usableH + layout.gapMm) / (photoHmm + layout.gapMm)));
  return cols * rows;
}

function drawCropGuide(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(0, 76, 200, .52)";
  ctx.lineWidth = Math.max(1, Math.round(w * 0.006));
  ctx.setLineDash([Math.max(3, Math.round(w * 0.018)), Math.max(3, Math.round(w * 0.012))]);
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}

function drawSheetBackground(ctx: CanvasRenderingContext2D, w: number, h: number, dpi: number) {
  ctx.fillStyle = "#f9fbff";
  ctx.fillRect(0, 0, w, h);
  const small = Math.max(2, mmToPx(1, dpi));
  const large = small * 5;
  ctx.save();
  ctx.strokeStyle = "rgba(68, 94, 255, .18)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += small) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += small) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(68, 94, 255, .34)";
  for (let x = 0; x <= w; x += large) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += large) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }
  ctx.strokeStyle = "#3f63ff";
  ctx.lineWidth = Math.max(2, mmToPx(0.25, dpi));
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  ctx.restore();
}

function drawSideTicket(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, dpi: number) {
  const drawVertical = (text: string, cx: number, top: number, size: number, weight: number | string, color: string, spacing = 1.04) => {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px sans-serif`;
    const step = size * spacing;
    [...text].forEach((char, index) => ctx.fillText(char, cx, top + index * step));
    ctx.restore();
  };
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#1f3a8a";
  ctx.lineWidth = Math.max(1, mmToPx(0.18, dpi));
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);

  ctx.textAlign = "center";
  ctx.fillStyle = "#063a85";
  ctx.font = `900 ${Math.max(13, Math.round(w * 0.13))}px sans-serif`;
  ctx.fillText("PRINT SHEET", x + w / 2, y + mmToPx(5, dpi));

  drawVertical("証明写真", x + w * 0.45, y + h * 0.2, Math.max(25, Math.round(w * 0.27)), 900, "#063a85", 1.06);
  drawVertical("きれい", x + w * 0.7, y + h * 0.23, Math.max(14, Math.round(w * 0.14)), 800, "#1d5bd8", 1.18);

  ctx.strokeStyle = "rgba(6, 58, 133, .35)";
  ctx.setLineDash([Math.max(3, mmToPx(0.8, dpi)), Math.max(3, mmToPx(0.8, dpi))]);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.18, y + mmToPx(7, dpi));
  ctx.lineTo(x + w * 0.18, y + h - mmToPx(7, dpi));
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = "#0a4bb4";
  ctx.font = `700 ${Math.max(9, Math.round(w * 0.08))}px sans-serif`;
  ctx.fillText(`${new Date().getFullYear()}`, x + w / 2, y + h - mmToPx(8, dpi));
  ctx.restore();
}

function createSingleCanvas() {
  const { w: outW, h: outH, suffix } = computeOutput(state.output, state.aspect.w, state.aspect.h, state.customDpi, state.customPx);
  const c = document.createElement("canvas");
  c.width = outW;
  c.height = outH;
  const cx = c.getContext("2d")!;
  drawScene(cx, outW, outH, canvas.width);
  return { canvas: c, suffix };
}

function createPhotoCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  drawScene(c.getContext("2d")!, w, h, canvas.width);
  return c;
}

function createSheetCanvas() {
  const layout = DEFAULT_SHEET;
  const c = document.createElement("canvas");
  c.width = mmToPx(layout.wMm, layout.dpi);
  c.height = mmToPx(layout.hMm, layout.dpi);
  const cx = c.getContext("2d")!;
  const photoW = mmToPx(state.aspect.w, layout.dpi);
  const photoH = mmToPx(state.aspect.h, layout.dpi);
  const margin = mmToPx(layout.marginMm, layout.dpi);
  const gap = mmToPx(layout.gapMm, layout.dpi);
  const labelW = mmToPx(layout.labelMm, layout.dpi);
  drawSheetBackground(cx, c.width, c.height, layout.dpi);
  const usableW = c.width - margin * 2 - labelW;
  const bottomBand = mmToPx(layout.footerMm, layout.dpi);
  const usableH = c.height - margin * 2 - bottomBand;
  const cols = Math.max(1, Math.floor((usableW + gap) / (photoW + gap)));
  const rows = Math.max(1, Math.floor((usableH + gap) / (photoH + gap)));
  const usedW = cols * photoW + (cols - 1) * gap;
  const usedH = rows * photoH + (rows - 1) * gap;
  const startX = margin;
  const startY = margin + Math.max(0, Math.floor((usableH - usedH) / 2));
  const photoCanvas = createPhotoCanvas(photoW, photoH);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = startX + col * (photoW + gap);
      const y = startY + row * (photoH + gap);
      cx.fillStyle = "#fff";
      cx.fillRect(x - 2, y - 2, photoW + 4, photoH + 4);
      cx.drawImage(photoCanvas, x, y);
      drawCropGuide(cx, x, y, photoW, photoH);
    }
  }
  const ticketX = c.width - margin - labelW;
  drawSideTicket(cx, ticketX, startY, labelW, usedH, layout.dpi);
  cx.save();
  cx.fillStyle = "#e42b34";
  cx.font = `900 ${Math.max(10, mmToPx(2.2, layout.dpi))}px sans-serif`;
  cx.textAlign = "center";
  cx.fillText("点線に沿ってカットしてください", startX + usedW / 2, c.height - Math.max(8, margin / 2));
  cx.fillStyle = "#063a85";
  cx.font = `700 ${Math.max(8, mmToPx(1.8, layout.dpi))}px sans-serif`;
  cx.fillText(`${state.aspect.name}（${state.aspect.w}×${state.aspect.h}mm）`, startX + usedW / 2, c.height - Math.max(24, margin));
  cx.restore();
  return { canvas: c, suffix: `${layout.wMm}x${layout.hMm}mm-sheet-${layout.dpi}dpi` };
}

function outputFilename(suffix: string) {
  return `${state.exportMode === "sheet" ? "id-photo-sheet" : "id-photo"}-${state.aspect.id}-${suffix}.png`;
}

function canvasToBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    c.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("画像の書き出しに失敗しました"));
    }, "image/png");
  });
}

async function createOutputFile() {
  const result = state.exportMode === "sheet" ? createSheetCanvas() : createSingleCanvas();
  const blob = await canvasToBlob(result.canvas);
  const filename = outputFilename(result.suffix);
  return {
    blob,
    filename,
    file: new File([blob], filename, { type: "image/png" }),
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.download = filename;
  a.href = url;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function canUseNativeShare(file: File) {
  return typeof navigator.share === "function"
    && typeof navigator.canShare === "function"
    && navigator.canShare({ files: [file] });
}

function updateSaveActions() {
  const saveButton = $<HTMLButtonElement>("save");
  const shareButton = $<HTMLButtonElement>("share");
  const saveNote = $("save-note");
  const looksMobile = window.matchMedia("(pointer: coarse), (max-width: 640px)").matches;
  const hasShareApi = typeof navigator.share === "function";
  saveButton.textContent = "PNG を保存";
  shareButton.hidden = !hasShareApi;
  if (hasShareApi) {
    shareButton.textContent = looksMobile ? "写真に保存・共有" : "共有";
    saveNote.textContent = looksMobile
      ? "写真アプリに入れたい場合は共有ボタンから「画像を保存」を選べます。"
      : "PNG 保存はダウンロード、共有はOSの共有シートを開きます。";
  } else {
    saveNote.textContent = looksMobile
      ? "共有シート非対応のブラウザでは PNG として保存されます。ダウンロード後に写真アプリへ保存してください。"
      : "PC ではダウンロードフォルダに PNG として保存されます。";
  }
}

// Buttons
$("flip").addEventListener("click", () => { state.flip = !state.flip; render(); });
$("reset").addEventListener("click", () => {
  state.scale = 1; state.offsetX = 0; state.offsetY = 0; state.flip = false;
  updateStatus();
  render();
});
$("save").addEventListener("click", async () => {
  const { blob, filename } = await createOutputFile();
  downloadBlob(blob, filename);
});
$("share").addEventListener("click", async () => {
  const { blob, filename, file } = await createOutputFile();
  if (!canUseNativeShare(file)) {
    downloadBlob(blob, filename);
    return;
  }
  try {
    await navigator.share({
      files: [file],
      title: "証明写真",
      text: "作成した証明写真です。",
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    console.warn("Native share failed; falling back to download", e);
    downloadBlob(blob, filename);
  }
});
$("reupload").addEventListener("click", () => {
  if (!state.subject) { showUpload(); return; }
  const ok = window.confirm("現在の編集内容は破棄されます。別の写真を選び直しますか？");
  if (!ok) return;
  state.subject = null;
  fileInput.value = "";
  showUpload();
});

// ドラッグで位置、ホイール/ピンチで拡大
const pointers = new Map<number, { x: number; y: number }>();
let pinchStartDist = 0;
let pinchStartScale = 1;
let lastX = 0, lastY = 0;

function canvasScale() {
  const rect = canvas.getBoundingClientRect();
  return canvas.width / rect.width;
}
function clampState() {
  state.scale = Math.max(0.3, Math.min(3, state.scale));
  const maxOff = Math.max(canvas.width, canvas.height) / 2;
  state.offsetX = Math.max(-maxOff, Math.min(maxOff, state.offsetX));
  state.offsetY = Math.max(-maxOff, Math.min(maxOff, state.offsetY));
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  lastX = e.clientX; lastY = e.clientY;
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchStartDist = Math.hypot(a.x - b.x, a.y - b.y);
    pinchStartScale = state.scale;
  }
});
canvas.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 1) {
    const s = canvasScale();
    state.offsetX += (e.clientX - lastX) * s;
    state.offsetY += (e.clientY - lastY) * s;
    lastX = e.clientX; lastY = e.clientY;
  } else if (pointers.size === 2 && pinchStartDist > 0) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    state.scale = pinchStartScale * (d / pinchStartDist);
  }
  clampState();
  updateStatus();
  render();
});
function endPointer(e: PointerEvent) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchStartDist = 0;
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = -e.deltaY * 0.0015;
  state.scale *= 1 + delta;
  clampState();
  updateStatus();
  render();
}, { passive: false });

updateSaveActions();
if (ADSENSE_AUTO || Object.values(ADSENSE_SLOTS).some(isValidAdsenseSlot)) setupAdsense();
window.addEventListener("resize", () => { setCanvasSize(); updateSaveActions(); render(); });
