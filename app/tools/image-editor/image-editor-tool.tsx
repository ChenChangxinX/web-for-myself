"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import exifr from "exifr";

type OverlayPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface MetadataState {
  capturedAt: string;
  locationLabel: string;
  latitude: string;
  longitude: string;
  cameraModel: string;
}

const FONT_OPTIONS = [
  { label: "Manrope", value: "Manrope, sans-serif" },
  { label: "Noto Sans SC", value: '"Noto Sans SC", sans-serif' },
  { label: "Monospace", value: '"JetBrains Mono", monospace' },
  { label: "Serif", value: "Georgia, serif" },
];

function formatDate(value: unknown) {
  if (value instanceof Date) {
    return value.toLocaleString("zh-CN", { hour12: false });
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

function formatCoord(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "";
  }

  return value.toFixed(6);
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export function ImageEditorTool() {
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<MetadataState>({
    capturedAt: "",
    locationLabel: "",
    latitude: "",
    longitude: "",
    cameraModel: "",
  });
  const [showTime, setShowTime] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showCoords, setShowCoords] = useState(true);
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [fontSize, setFontSize] = useState(30);
  const [fontColor, setFontColor] = useState("#f8fafc");
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("bold");
  const [position, setPosition] = useState<OverlayPosition>("bottom-left");
  const [padding, setPadding] = useState(18);
  const [status, setStatus] = useState("等待上传图片");
  const [isLoaded, setIsLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const overlayLines = useMemo(() => {
    const lines: string[] = [];

    if (showTime && metadata.capturedAt.trim()) {
      lines.push(`时间: ${metadata.capturedAt.trim()}`);
    }

    if (showLocation && metadata.locationLabel.trim()) {
      lines.push(`位置: ${metadata.locationLabel.trim()}`);
    }

    if (showCoords && (metadata.latitude.trim() || metadata.longitude.trim())) {
      lines.push(`坐标: ${metadata.latitude.trim()} , ${metadata.longitude.trim()}`);
    }

    return lines;
  }, [metadata, showCoords, showLocation, showTime]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function parseMetadata(file: File) {
    try {
      const exif = await exifr.parse(file, true);
      const capturedAt = formatDate(exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.ModifyDate);
      const latitude = formatCoord(exif?.latitude);
      const longitude = formatCoord(exif?.longitude);
      const cameraModel = [exif?.Make, exif?.Model].filter(Boolean).join(" ");

      const locationLabel = latitude && longitude ? `纬度 ${latitude} / 经度 ${longitude}` : "";

      setMetadata((current) => ({
        ...current,
        capturedAt,
        locationLabel,
        latitude,
        longitude,
        cameraModel,
      }));
      setStatus("已读取图片元数据");
    } catch {
      setStatus("未读取到 EXIF 元数据，可手动填写");
      setMetadata((current) => ({ ...current, cameraModel: "" }));
    }
  }

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !image) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (!overlayLines.length) {
      return;
    }

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const lineHeight = Math.round(fontSize * 1.35);
    const maxTextWidth = Math.max(...overlayLines.map((line) => ctx.measureText(line).width));
    const boxWidth = maxTextWidth + padding * 2;
    const boxHeight = lineHeight * overlayLines.length + padding * 2;

    let x = padding;
    let y = padding;

    if (position === "top-right") {
      x = canvas.width - boxWidth - padding;
      y = padding;
    }

    if (position === "bottom-left") {
      x = padding;
      y = canvas.height - boxHeight - padding;
    }

    if (position === "bottom-right") {
      x = canvas.width - boxWidth - padding;
      y = canvas.height - boxHeight - padding;
    }

    ctx.fillStyle = "rgba(15, 23, 42, 0.58)";
    drawRoundedRect(ctx, x, y, boxWidth, boxHeight, Math.max(12, Math.round(fontSize * 0.45)));
    ctx.fill();

    ctx.fillStyle = fontColor;
    ctx.textBaseline = "top";
    overlayLines.forEach((line, index) => {
      ctx.fillText(line, x + padding, y + padding + index * lineHeight);
    });
  }, [fontColor, fontFamily, fontSize, fontWeight, overlayLines, padding, position]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    renderCanvas();
  }, [isLoaded, renderCanvas]);

  async function loadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("请选择图片文件");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setFileName(file.name);
    setStatus("正在加载图片...");

    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setIsLoaded(true);
      setStatus("图片加载完成");
    };
    image.onerror = () => {
      setStatus("图片加载失败");
      setIsLoaded(false);
    };
    image.src = objectUrl;

    await parseMetadata(file);
  }

  function handleMetadataChange<K extends keyof MetadataState>(key: K, value: MetadataState[K]) {
    setMetadata((current) => ({ ...current, [key]: value }));
  }

  function downloadImage() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }

      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const baseName = fileName.replace(/\.[^.]+$/, "") || "image";
      anchor.href = downloadUrl;
      anchor.download = `${baseName}-edited.png`;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
    }, "image/png");
  }

  return (
    <section className="grid gap-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            上传图片
          </button>
          <button
            type="button"
            onClick={downloadImage}
            disabled={!isLoaded}
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            下载编辑后图片
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) {
                await loadFile(file);
              }
            }}
          />
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p>状态：{status}</p>
          <p className="mt-1">文件：{fileName || "未上传"}</p>
          <p className="mt-1">设备：{metadata.cameraModel || "未读取"}</p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-black/10 bg-slate-50">
          <canvas ref={canvasRef} className="h-auto w-full" />
          {!isLoaded ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">上传图片后显示预览</div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-lg font-bold text-slate-900">信息编辑</h2>
          <div className="mt-3 space-y-3">
            <label className="block text-sm text-slate-700">
              时间信息
              <input
                value={metadata.capturedAt}
                onChange={(event) => handleMetadataChange("capturedAt", event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none"
                placeholder="例如 2026/05/20 18:30:00"
              />
            </label>

            <label className="block text-sm text-slate-700">
              位置描述
              <input
                value={metadata.locationLabel}
                onChange={(event) => handleMetadataChange("locationLabel", event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none"
                placeholder="例如 杭州西湖"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-slate-700">
                纬度
                <input
                  value={metadata.latitude}
                  onChange={(event) => handleMetadataChange("latitude", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none"
                  placeholder="30.274084"
                />
              </label>
              <label className="block text-sm text-slate-700">
                经度
                <input
                  value={metadata.longitude}
                  onChange={(event) => handleMetadataChange("longitude", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none"
                  placeholder="120.155070"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">样式设置</h2>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-slate-700">
                字体
                <select
                  value={fontFamily}
                  onChange={(event) => setFontFamily(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none"
                >
                  {FONT_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-700">
                字重
                <select
                  value={fontWeight}
                  onChange={(event) => setFontWeight(event.target.value as "normal" | "bold")}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none"
                >
                  <option value="normal">常规</option>
                  <option value="bold">加粗</option>
                </select>
              </label>
            </div>

            <label className="block text-sm text-slate-700">
              字号：{fontSize}px
              <input
                type="range"
                min={18}
                max={72}
                value={fontSize}
                onChange={(event) => setFontSize(Number(event.target.value))}
                className="mt-1 w-full accent-indigo-600"
              />
            </label>

            <label className="block text-sm text-slate-700">
              字体颜色
              <input
                type="color"
                value={fontColor}
                onChange={(event) => setFontColor(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white p-1"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-slate-700">
                位置
                <select
                  value={position}
                  onChange={(event) => setPosition(event.target.value as OverlayPosition)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none"
                >
                  <option value="top-left">左上</option>
                  <option value="top-right">右上</option>
                  <option value="bottom-left">左下</option>
                  <option value="bottom-right">右下</option>
                </select>
              </label>
              <label className="block text-sm text-slate-700">
                边距：{padding}px
                <input
                  type="range"
                  min={8}
                  max={80}
                  value={padding}
                  onChange={(event) => setPadding(Number(event.target.value))}
                  className="mt-1 w-full accent-indigo-600"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">显示内容</h2>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-700">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={showTime} onChange={() => setShowTime((value) => !value)} className="h-4 w-4 accent-indigo-600" />
              时间
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={showLocation} onChange={() => setShowLocation((value) => !value)} className="h-4 w-4 accent-indigo-600" />
              位置描述
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={showCoords} onChange={() => setShowCoords((value) => !value)} className="h-4 w-4 accent-indigo-600" />
              经纬度
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
