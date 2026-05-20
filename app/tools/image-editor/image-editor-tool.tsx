"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import exifr from "exifr";
import JSZip from "jszip";

/* eslint-disable @next/next/no-img-element */

type OverlayPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type OutputFormat = "png" | "jpeg" | "webp";

interface MetadataState {
  capturedAt: string;
  locationText: string;
  cameraModel: string;
}

interface BatchItem {
  id: string;
  fileName: string;
  sourceUrl: string;
  outputUrl?: string;
  outputBlob?: Blob;
  status: "ready" | "skipped" | "error";
  message: string;
  metadata: MetadataState;
}

const FONT_OPTIONS = [
  { label: "Manrope", value: "Manrope, sans-serif" },
  { label: "Noto Sans SC", value: '"Noto Sans SC", sans-serif' },
  { label: "Monospace", value: '"JetBrains Mono", monospace' },
  { label: "Serif", value: "Georgia, serif" },
];

const OUTPUT_FORMAT_OPTIONS: Array<{ label: string; value: OutputFormat; mime: string; extension: string; quality?: number }> = [
  { label: "PNG（无损）", value: "png", mime: "image/png", extension: "png" },
  { label: "JPG（体积更小）", value: "jpeg", mime: "image/jpeg", extension: "jpg", quality: 0.92 },
  { label: "WebP（推荐）", value: "webp", mime: "image/webp", extension: "webp", quality: 0.92 },
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

function getOutputFormatConfig(format: OutputFormat) {
  return OUTPUT_FORMAT_OPTIONS.find((item) => item.value === format) ?? OUTPUT_FORMAT_OPTIONS[0];
}

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}

function sanitizeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ").trim();
}

function buildOutputName(pattern: string, originalFileName: string, index: number, extension: string) {
  const now = new Date();
  const baseName = originalFileName.replace(/\.[^.]+$/, "") || "image";
  const date = `${now.getFullYear()}${padNumber(now.getMonth() + 1)}${padNumber(now.getDate())}`;
  const time = `${padNumber(now.getHours())}${padNumber(now.getMinutes())}${padNumber(now.getSeconds())}`;
  const serial = String(index + 1).padStart(3, "0");

  const rawName = pattern
    .replaceAll("{name}", baseName)
    .replaceAll("{index}", serial)
    .replaceAll("{date}", date)
    .replaceAll("{time}", time);

  const normalized = sanitizeFileName(rawName) || `${baseName}-${serial}`;
  return `${normalized}.${extension}`;
}

export function ImageEditorTool() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [showTime, setShowTime] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [fontSize, setFontSize] = useState(30);
  const [fontColor, setFontColor] = useState("#f8fafc");
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("bold");
  const [position, setPosition] = useState<OverlayPosition>("bottom-left");
  const [padding, setPadding] = useState(18);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [fileNamePattern, setFileNamePattern] = useState("{name}-edited-{index}");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("等待上传图片");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resolveOverlayLines = useCallback(
    (metadata: MetadataState) => {
      const lines: string[] = [];

      if (showTime && metadata.capturedAt.trim()) {
        lines.push(`时间: ${metadata.capturedAt.trim()}`);
      }

      if (showLocation && metadata.locationText.trim()) {
        lines.push(`位置: ${metadata.locationText.trim()}`);
      }

      return lines;
    },
    [showLocation, showTime],
  );

  useEffect(() => {
    return () => {
      items.forEach((item) => {
        URL.revokeObjectURL(item.sourceUrl);
        if (item.outputUrl) {
          URL.revokeObjectURL(item.outputUrl);
        }
      });
    };
  }, [items]);

  const renderImageWithOverlay = useCallback(
    async (sourceUrl: string, metadata: MetadataState) => {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = sourceUrl;
      });

      const lines = resolveOverlayLines(metadata);
      if (!lines.length) {
        return null;
      }

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return null;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

      const lineHeight = Math.round(fontSize * 1.35);
      const maxTextWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
      const boxWidth = maxTextWidth + padding * 2;
      const boxHeight = lineHeight * lines.length + padding * 2;

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
      lines.forEach((line, index) => {
        ctx.fillText(line, x + padding, y + padding + index * lineHeight);
      });

      const format = getOutputFormatConfig(outputFormat);
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((value) => resolve(value), format.mime, format.quality);
      });

      if (!blob) {
        return null;
      }

      return {
        outputBlob: blob,
        outputUrl: URL.createObjectURL(blob),
      };
    },
    [fontColor, fontFamily, fontSize, fontWeight, outputFormat, padding, position, resolveOverlayLines],
  );

  const summary = useMemo(() => {
    const ready = items.filter((item) => item.status === "ready").length;
    const skipped = items.filter((item) => item.status === "skipped").length;
    const failed = items.filter((item) => item.status === "error").length;

    return { ready, skipped, failed, total: items.length };
  }, [items]);

  async function parseMetadata(file: File) {
    const exif = await exifr.parse(file, true);
    const capturedAt = formatDate(exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.ModifyDate);
    const latitude = formatCoord(exif?.latitude);
    const longitude = formatCoord(exif?.longitude);
    const cameraModel = [exif?.Make, exif?.Model].filter(Boolean).join(" ");
    const locationText = latitude && longitude ? `纬度 ${latitude} / 经度 ${longitude}` : "";

    return {
      capturedAt,
      locationText,
      cameraModel,
    } satisfies MetadataState;
  }

  async function processFiles(fileList: File[]) {
    if (!fileList.length) {
      return;
    }

    setIsProcessing(true);
    setStatus(`开始处理 ${fileList.length} 张图片...`);

    setItems((previous) => {
      previous.forEach((item) => {
        URL.revokeObjectURL(item.sourceUrl);
        if (item.outputUrl) {
          URL.revokeObjectURL(item.outputUrl);
        }
      });
      return [];
    });

    const nextItems: BatchItem[] = [];

    for (let index = 0; index < fileList.length; index += 1) {
      const file = fileList[index];

      if (!file.type.startsWith("image/")) {
        continue;
      }

      const sourceUrl = URL.createObjectURL(file);

      try {
        const metadata = await parseMetadata(file);
        const lines = resolveOverlayLines(metadata);

        if (!lines.length) {
          nextItems.push({
            id: `${file.name}-${index}`,
            fileName: file.name,
            sourceUrl,
            status: "skipped",
            message: "未检测到时间或地理位置信息，已跳过",
            metadata,
          });
          continue;
        }

        const rendered = await renderImageWithOverlay(sourceUrl, metadata);

        if (!rendered) {
          nextItems.push({
            id: `${file.name}-${index}`,
            fileName: file.name,
            sourceUrl,
            status: "error",
            message: "渲染失败",
            metadata,
          });
          continue;
        }

        nextItems.push({
          id: `${file.name}-${index}`,
          fileName: file.name,
          sourceUrl,
          outputUrl: rendered.outputUrl,
          outputBlob: rendered.outputBlob,
          status: "ready",
          message: "处理完成",
          metadata,
        });
      } catch {
        nextItems.push({
          id: `${file.name}-${index}`,
          fileName: file.name,
          sourceUrl,
          status: "error",
          message: "读取 EXIF 失败",
          metadata: {
            capturedAt: "",
            locationText: "",
            cameraModel: "",
          },
        });
      }
    }

    setItems(nextItems);
    setIsProcessing(false);
    setStatus(`处理完成：成功 ${nextItems.filter((item) => item.status === "ready").length}，跳过 ${nextItems.filter((item) => item.status === "skipped").length}`);
  }

  async function regenerateAllReadyItems() {
    if (!items.length) {
      return;
    }

    setIsProcessing(true);
    setStatus("正在应用样式并重新生成...");

    const regenerated = await Promise.all(
      items.map(async (item) => {
        if (item.outputUrl) {
          URL.revokeObjectURL(item.outputUrl);
        }

        const lines = resolveOverlayLines(item.metadata);
        if (!lines.length) {
          return {
            ...item,
            outputUrl: undefined,
            status: "skipped" as const,
            message: "样式应用后无可写入信息，已跳过",
          };
        }

        const rendered = await renderImageWithOverlay(item.sourceUrl, item.metadata);
        if (!rendered) {
          return {
            ...item,
            outputUrl: undefined,
            outputBlob: undefined,
            status: "error" as const,
            message: "重渲染失败",
          };
        }

        return {
          ...item,
          outputUrl: rendered.outputUrl,
          outputBlob: rendered.outputBlob,
          status: "ready" as const,
          message: "处理完成",
        };
      }),
    );

    setItems(regenerated);
    setIsProcessing(false);
    setStatus("已重新生成当前批次图片");
  }

  function triggerDownload(url: string, fileName: string) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
  }

  async function downloadReadyItems() {
    const readyItems = items.filter((item) => item.status === "ready" && item.outputBlob);
    if (!readyItems.length) {
      return;
    }

    const format = getOutputFormatConfig(outputFormat);
    const zip = new JSZip();

    readyItems.forEach((item, index) => {
      if (!item.outputBlob) {
        return;
      }

      const outputName = buildOutputName(fileNamePattern, item.fileName, index, format.extension);
      zip.file(outputName, item.outputBlob);
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const batchTag = `${new Date().getFullYear()}${padNumber(new Date().getMonth() + 1)}${padNumber(new Date().getDate())}-${padNumber(new Date().getHours())}${padNumber(new Date().getMinutes())}${padNumber(new Date().getSeconds())}`;
    const zipUrl = URL.createObjectURL(zipBlob);
    triggerDownload(zipUrl, `image-batch-${batchTag}.zip`);
    URL.revokeObjectURL(zipUrl);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          上传多张图片
        </button>
        <button
          type="button"
          onClick={regenerateAllReadyItems}
          disabled={!items.length || isProcessing}
          className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          应用样式并重新生成
        </button>
        <button
          type="button"
          onClick={downloadReadyItems}
          disabled={!summary.ready || isProcessing}
          className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          批量下载可用结果（ZIP）
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (event) => {
            const files = Array.from(event.target.files ?? []);
            await processFiles(files);
          }}
        />
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p>状态：{status}</p>
        <p className="mt-1">总数：{summary.total}，可下载：{summary.ready}，跳过：{summary.skipped}，失败：{summary.failed}</p>
        <p className="mt-1">默认策略：读取时间与地理位置信息写入图片；若均不存在则自动跳过该图片。</p>
        <p className="mt-1">下载策略：先设置命名模板与输出格式，批量导出时统一按规则打包为 ZIP。</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">样式设置</h2>
          <div className="space-y-3">
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

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-slate-700">
                输出格式
                <select
                  value={outputFormat}
                  onChange={(event) => setOutputFormat(event.target.value as OutputFormat)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none"
                >
                  {OUTPUT_FORMAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-700">
                文件命名模板
                <input
                  type="text"
                  value={fileNamePattern}
                  onChange={(event) => setFileNamePattern(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none"
                  placeholder="{name}-edited-{index}"
                />
              </label>
            </div>

            <p className="text-xs text-slate-500">命名占位符：{'{name}'} 原文件名、{'{index}'} 序号、{'{date}'} 日期、{'{time}'} 时间</p>

            <div className="flex flex-wrap gap-3 text-sm text-slate-700">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={showTime} onChange={() => setShowTime((value) => !value)} className="h-4 w-4 accent-indigo-600" />
                时间
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={showLocation} onChange={() => setShowLocation((value) => !value)} className="h-4 w-4 accent-indigo-600" />
                地理位置
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {items.length ? (
            items.map((item) => (
              <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">{item.fileName}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "ready"
                        ? "bg-emerald-100 text-emerald-700"
                        : item.status === "skipped"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {item.status === "ready" ? "可下载" : item.status === "skipped" ? "已跳过" : "失败"}
                  </span>
                </div>

                <p className="mb-2 text-sm text-slate-600">{item.message}</p>
                <p className="mb-2 text-xs text-slate-500">时间：{item.metadata.capturedAt || "无"}</p>
                <p className="mb-3 text-xs text-slate-500">位置：{item.metadata.locationText || "无"}</p>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {item.status === "ready" && item.outputUrl ? (
                    <img src={item.outputUrl} alt={item.fileName} className="h-auto w-full object-contain" />
                  ) : (
                    <img src={item.sourceUrl} alt={item.fileName} className="h-auto w-full object-contain" />
                  )}
                </div>

                {item.status === "ready" && item.outputUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (item.outputUrl) {
                        const format = getOutputFormatConfig(outputFormat);
                        const outputName = buildOutputName(fileNamePattern, item.fileName, 0, format.extension);
                        triggerDownload(item.outputUrl, outputName);
                      }
                    }}
                    className="mt-3 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    下载当前图片
                  </button>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              上传多张图片后，这里会展示批量处理结果。
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
