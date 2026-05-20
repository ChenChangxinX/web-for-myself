"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

type HslColor = {
  h: number;
  s: number;
  l: number;
};

type SavedColor = {
  hex: string;
  createdAt: string;
};

const STORAGE_KEY = "web-for-myself-color-palette";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function padHex(value: number) {
  return value.toString(16).padStart(2, "0").toUpperCase();
}

function normalizeHex(input: string) {
  const raw = input.trim().replace(/^#/, "").replace(/[^0-9a-fA-F]/g, "");

  if (raw.length === 3) {
    return `#${raw
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toUpperCase()}`;
  }

  if (raw.length === 6) {
    return `#${raw.toUpperCase()}`;
  }

  return null;
}

function hexToRgb(hex: string): RgbColor | null {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return null;
  }

  const value = normalized.slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex(rgb: RgbColor) {
  return `#${padHex(clamp(Math.round(rgb.r), 0, 255))}${padHex(clamp(Math.round(rgb.g), 0, 255))}${padHex(clamp(Math.round(rgb.b), 0, 255))}`;
}

function rgbToHsl(rgb: RgbColor): HslColor {
  const r = clamp(rgb.r, 0, 255) / 255;
  const g = clamp(rgb.g, 0, 255) / 255;
  const b = clamp(rgb.b, 0, 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;

  if (max === r) {
    h = ((g - b) / delta) % 6;
  } else if (max === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }

  h *= 60;
  if (h < 0) {
    h += 360;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(hsl: HslColor): RgbColor {
  const h = ((hsl.h % 360) + 360) % 360;
  const s = clamp(hsl.s, 0, 100) / 100;
  const l = clamp(hsl.l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h < 60) {
    rPrime = c;
    gPrime = x;
  } else if (h < 120) {
    rPrime = x;
    gPrime = c;
  } else if (h < 180) {
    gPrime = c;
    bPrime = x;
  } else if (h < 240) {
    gPrime = x;
    bPrime = c;
  } else if (h < 300) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}

function formatRgb(rgb: RgbColor) {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function formatHsl(hsl: HslColor) {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

function shiftHue(base: HslColor, amount: number) {
  return { ...base, h: ((base.h + amount) % 360 + 360) % 360 };
}

function colorDistance(a: RgbColor, b: RgbColor) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function quantizeChannel(value: number) {
  return clamp(Math.round(value / 24) * 24, 0, 255);
}

async function extractColorsFromImage(file: File, maxColors: number) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = objectUrl;
    });

    const maxEdge = 260;
    const ratio = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return [];
    }

    ctx.drawImage(image, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height).data;
    const step = Math.max(1, Math.floor((width * height) / 12000));
    const counter = new Map<string, number>();

    for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += step) {
      const dataIndex = pixelIndex * 4;
      const alpha = imageData[dataIndex + 3];
      if (alpha < 160) {
        continue;
      }

      const r = quantizeChannel(imageData[dataIndex]);
      const g = quantizeChannel(imageData[dataIndex + 1]);
      const b = quantizeChannel(imageData[dataIndex + 2]);
      const key = `${r},${g},${b}`;
      counter.set(key, (counter.get(key) ?? 0) + 1);
    }

    const candidates = Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => {
        const [r, g, b] = key.split(",").map((part) => Number.parseInt(part, 10));
        return { r, g, b } satisfies RgbColor;
      });

    const selected: RgbColor[] = [];
    candidates.forEach((candidate) => {
      if (selected.length >= maxColors) {
        return;
      }

      const tooClose = selected.some((picked) => colorDistance(picked, candidate) < 44);
      if (!tooClose) {
        selected.push(candidate);
      }
    });

    return selected.map((rgb) => rgbToHex(rgb));
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadSavedPalette() {
  if (typeof window === "undefined") {
    return [] as SavedColor[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SavedColor[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => typeof item.hex === "string" && typeof item.createdAt === "string");
  } catch {
    return [];
  }
}

function applyHexSelection(hex: string, setSelectedHex: (value: string) => void, setHexInput: (value: string) => void) {
  setSelectedHex(hex);
  setHexInput(hex);
}

export function ColorPickerTool() {
  const [selectedHex, setSelectedHex] = useState("#3B82F6");
  const [hexInput, setHexInput] = useState("#3B82F6");
  const [palette, setPalette] = useState<SavedColor[]>([]);
  const [copiedType, setCopiedType] = useState<"hex" | "rgb" | "hsl" | "">("");
  const [extracting, setExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState("上传图片可提取主色调");
  const [extractedColors, setExtractedColors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const rgb = useMemo(() => hexToRgb(selectedHex) ?? { r: 0, g: 0, b: 0 }, [selectedHex]);
  const hsl = useMemo(() => rgbToHsl(rgb), [rgb]);

  const recommendationGroups = useMemo(() => {
    const complementary = [hsl, shiftHue(hsl, 180)].map((item) => rgbToHex(hslToRgb(item)));
    const analogous = [shiftHue(hsl, -30), hsl, shiftHue(hsl, 30)].map((item) => rgbToHex(hslToRgb(item)));
    const triadic = [hsl, shiftHue(hsl, 120), shiftHue(hsl, 240)].map((item) => rgbToHex(hslToRgb(item)));
    const splitComplementary = [hsl, shiftHue(hsl, 150), shiftHue(hsl, 210)].map((item) => rgbToHex(hslToRgb(item)));

    return [
      { title: "互补色", colors: complementary },
      { title: "类似色", colors: analogous },
      { title: "三角色", colors: triadic },
      { title: "分裂互补", colors: splitComplementary },
    ];
  }, [hsl]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPalette(loadSavedPalette());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!palette.length) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(palette));
  }, [palette]);

  async function copyCode(type: "hex" | "rgb" | "hsl", value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedType(type);
    window.setTimeout(() => setCopiedType(""), 1200);
  }

  function applyHexInput() {
    const normalized = normalizeHex(hexInput);
    if (normalized) {
      setSelectedHex(normalized);
      setHexInput(normalized);
    }
  }

  function saveCurrentColor() {
    setPalette((current) => {
      if (current.some((item) => item.hex === selectedHex)) {
        return current;
      }

      return [{ hex: selectedHex, createdAt: new Date().toISOString() }, ...current].slice(0, 60);
    });
  }

  function removeSavedColor(hex: string) {
    setPalette((current) => current.filter((item) => item.hex !== hex));
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setExtractStatus("请选择图片文件");
      return;
    }

    setExtracting(true);
    setExtractStatus("正在提取颜色...");

    try {
      const colors = await extractColorsFromImage(file, 10);
      setExtractedColors(colors);

      if (!colors.length) {
        setExtractStatus("没有提取到有效颜色，请尝试其他图片");
      } else {
        setExtractStatus(`已提取 ${colors.length} 种主色，可点击应用或保存`);
      }
    } catch {
      setExtractStatus("提取失败，请重试");
    } finally {
      setExtracting(false);
    }
  }

  function addExtractedToPalette(hex: string) {
    applyHexSelection(hex, setSelectedHex, setHexInput);
    setPalette((current) => {
      if (current.some((item) => item.hex === hex)) {
        return current;
      }
      return [{ hex, createdAt: new Date().toISOString() }, ...current].slice(0, 60);
    });
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">颜色选择与代码转换</h2>

          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <div className="h-28 w-full" style={{ backgroundColor: selectedHex }} />
                <p className="px-3 py-2 text-center text-sm font-semibold text-slate-700">{selectedHex}</p>
              </div>
              <input
                type="color"
                value={selectedHex}
                onChange={(event) => {
                  const nextHex = event.target.value.toUpperCase();
                  setSelectedHex(nextHex);
                  setHexInput(nextHex);
                }}
                className="h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
              />
              <button
                type="button"
                onClick={saveCurrentColor}
                className="w-full rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                保存到调色板
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">HEX</p>
                  <button
                    type="button"
                    onClick={() => copyCode("hex", selectedHex)}
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {copiedType === "hex" ? "已复制" : "复制"}
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={hexInput}
                    onChange={(event) => setHexInput(event.target.value)}
                    onBlur={applyHexInput}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                  <button type="button" onClick={applyHexInput} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                    应用
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">RGB</p>
                  <button
                    type="button"
                    onClick={() => copyCode("rgb", formatRgb(rgb))}
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {copiedType === "rgb" ? "已复制" : "复制"}
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["r", "g", "b"] as const).map((key) => (
                    <input
                      key={key}
                      type="number"
                      min={0}
                      max={255}
                      value={rgb[key]}
                      readOnly
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">HSL</p>
                  <button
                    type="button"
                    onClick={() => copyCode("hsl", formatHsl(hsl))}
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {copiedType === "hsl" ? "已复制" : "复制"}
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={hsl.h}
                    readOnly
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={hsl.s}
                    readOnly
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={hsl.l}
                    readOnly
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-900">配色推荐</h2>
            <div className="mt-3 space-y-3">
              {recommendationGroups.map((group) => (
                <div key={group.title} className="rounded-2xl bg-slate-50 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-700">{group.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.colors.map((color) => (
                      <button
                        key={`${group.title}-${color}`}
                        type="button"
                        onClick={() => {
                          setSelectedHex(color);
                          setHexInput(color);
                        }}
                        className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
                        title={`应用颜色 ${color}`}
                      >
                        <span className="block h-10 w-20" style={{ backgroundColor: color }} />
                        <span className="block px-2 py-1 text-xs font-semibold text-slate-700 group-hover:text-slate-900">{color}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-900">从图片提取颜色</h2>
            <p className="mt-1 text-sm text-slate-600">上传一张图片，自动提取主色并生成可点击的调色板。</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {extracting ? "提取中..." : "选择图片"}
              </button>
              <p className="text-sm text-slate-600">{extractStatus}</p>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {extractedColors.map((color) => (
                <button
                  key={`extract-${color}`}
                  type="button"
                  onClick={() => {
                    setSelectedHex(color);
                    setHexInput(color);
                  }}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
                  title={`应用颜色 ${color}`}
                >
                  <span className="block h-10 w-20" style={{ backgroundColor: color }} />
                  <span className="block px-2 py-1 text-xs font-semibold text-slate-700">{color}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">已保存调色板</h2>
          <button
            type="button"
            onClick={() => setPalette([])}
            disabled={!palette.length}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            清空
          </button>
        </div>

        {palette.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {palette.map((item) => (
              <article key={item.hex} className="overflow-hidden rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => applyHexSelection(item.hex, setSelectedHex, setHexInput)}
                  className="block h-20 w-full"
                  style={{ backgroundColor: item.hex }}
                />
                <div className="space-y-2 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-900">{item.hex}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => addExtractedToPalette(item.hex)}
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      设为当前
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSavedColor(item.hex)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            还没有保存颜色，先选择一个颜色并点击“保存到调色板”。
          </div>
        )}
      </div>
    </section>
  );
}
