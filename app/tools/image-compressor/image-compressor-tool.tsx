"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import JSZip from "jszip";

/* eslint-disable @next/next/no-img-element */

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

type ProcessedItem = {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  outputUrl: string;
  outputBlob: Blob;
};

function humanSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function outputExtension(format: OutputFormat) {
  if (format === "image/jpeg") return "jpg";
  if (format === "image/png") return "png";
  return "webp";
}

async function loadImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function processImage(
  file: File,
  quality: number,
  outputFormat: OutputFormat,
  rotateDeg: number,
  cropCenterPercent: number,
) {
  const image = await loadImage(file);

  const cropRatio = Math.max(10, Math.min(100, cropCenterPercent)) / 100;
  const cropW = Math.round(image.naturalWidth * cropRatio);
  const cropH = Math.round(image.naturalHeight * cropRatio);
  const sx = Math.round((image.naturalWidth - cropW) / 2);
  const sy = Math.round((image.naturalHeight - cropH) / 2);

  const radians = (rotateDeg * Math.PI) / 180;
  const rotated = Math.abs(rotateDeg % 180) === 90;

  const canvas = document.createElement("canvas");
  canvas.width = rotated ? cropH : cropW;
  canvas.height = rotated ? cropW : cropH;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("无法创建画布");
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  ctx.drawImage(image, sx, sy, cropW, cropH, -cropW / 2, -cropH / 2, cropW, cropH);
  ctx.restore();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), outputFormat, quality);
  });

  if (!blob) {
    throw new Error("导出失败");
  }

  return {
    blob,
    url: URL.createObjectURL(blob),
  };
}

export function ImageCompressorTool() {
  const [quality, setQuality] = useState(0.8);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [rotateDeg, setRotateDeg] = useState(0);
  const [cropCenterPercent, setCropCenterPercent] = useState(100);
  const [items, setItems] = useState<ProcessedItem[]>([]);
  const [status, setStatus] = useState("等待上传图片");
  const [isProcessing, setIsProcessing] = useState(false);

  const summary = useMemo(() => {
    const original = items.reduce((sum, item) => sum + item.originalSize, 0);
    const compressed = items.reduce((sum, item) => sum + item.compressedSize, 0);
    const ratio = original > 0 ? ((1 - compressed / original) * 100).toFixed(1) : "0";
    return { original, compressed, ratio };
  }, [items]);

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    event.target.value = "";

    if (!files.length) {
      setStatus("请选择图片文件");
      return;
    }

    setIsProcessing(true);
    setStatus(`正在处理 ${files.length} 张图片...`);

    items.forEach((item) => URL.revokeObjectURL(item.outputUrl));

    const processed: ProcessedItem[] = [];

    for (const file of files) {
      try {
        const output = await processImage(file, quality, format, rotateDeg, cropCenterPercent);
        processed.push({
          id: `${file.name}-${file.lastModified}`,
          name: file.name,
          originalSize: file.size,
          compressedSize: output.blob.size,
          outputUrl: output.url,
          outputBlob: output.blob,
        });
      } catch {
        // skip failed image and continue
      }
    }

    setItems(processed);
    setIsProcessing(false);
    setStatus(`处理完成：${processed.length} 张`);
  }

  async function downloadZip() {
    if (!items.length) {
      return;
    }

    const zip = new JSZip();
    const ext = outputExtension(format);

    items.forEach((item, index) => {
      const baseName = item.name.replace(/\.[^.]+$/, "") || `image-${index + 1}`;
      zip.file(`${baseName}.${ext}`, item.outputBlob);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `compressed-images-${Date.now()}.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <label className="text-sm text-slate-700">压缩质量：{quality.toFixed(2)}<input type="range" min={0.3} max={1} step={0.01} value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="mt-1 w-full" /></label>
        <label className="text-sm text-slate-700">输出格式<select value={format} onChange={(event) => setFormat(event.target.value as OutputFormat)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label>
        <label className="text-sm text-slate-700">旋转角度<select value={rotateDeg} onChange={(event) => setRotateDeg(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"><option value={0}>0°</option><option value={90}>90°</option><option value={180}>180°</option><option value={270}>270°</option></select></label>
        <label className="text-sm text-slate-700">中心裁剪：{cropCenterPercent}%<input type="range" min={30} max={100} step={5} value={cropCenterPercent} onChange={(event) => setCropCenterPercent(Number(event.target.value))} className="mt-1 w-full" /></label>
        <div className="flex items-end"><label className="w-full cursor-pointer rounded-full bg-orange-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-orange-700"><input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />{isProcessing ? "处理中..." : "选择图片"}</label></div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p>状态：{status}</p>
        <p className="mt-1">原始总大小：{humanSize(summary.original)}，压缩后：{humanSize(summary.compressed)}，体积变化：{summary.ratio}%</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void downloadZip()} disabled={!items.length} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">批量下载 ZIP</button>
      </div>

      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4">
              <h3 className="truncate text-sm font-semibold text-slate-900">{item.name}</h3>
              <p className="mt-1 text-xs text-slate-500">{humanSize(item.originalSize)} {"->"} {humanSize(item.compressedSize)}</p>
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img src={item.outputUrl} alt={item.name} className="h-52 w-full object-contain bg-white" />
              </div>
              <button type="button" onClick={() => {
                const anchor = document.createElement("a");
                anchor.href = item.outputUrl;
                anchor.download = `${item.name.replace(/\.[^.]+$/, "")}.${outputExtension(format)}`;
                anchor.click();
              }} className="mt-3 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">下载当前</button>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">上传图片后可查看压缩结果。</div>
      )}
    </section>
  );
}
