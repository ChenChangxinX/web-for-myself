"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import JSZip from "jszip";

/* eslint-disable @next/next/no-img-element */

type BatchQrItem = {
  text: string;
  dataUrl: string;
};

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("读取 Logo 失败"));
    reader.readAsDataURL(file);
  });
}

async function composeWithLogo(baseQrUrl: string, logoUrl: string, size: number) {
  const [qrImage, logoImage] = await Promise.all([
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = baseQrUrl;
    }),
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = logoUrl;
    }),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return baseQrUrl;
  }

  ctx.drawImage(qrImage, 0, 0, size, size);

  const logoSize = Math.round(size * 0.24);
  const x = Math.round((size - logoSize) / 2);
  const y = x;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(x - 8, y - 8, logoSize + 16, logoSize + 16, 12);
  ctx.fill();

  ctx.drawImage(logoImage, x, y, logoSize, logoSize);
  return canvas.toDataURL("image/png");
}

export function QrGeneratorTool() {
  const [text, setText] = useState("https://chenchangxinx.github.io/web-for-myself/");
  const [size, setSize] = useState(320);
  const [fgColor, setFgColor] = useState("#111827");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [logoUrl, setLogoUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [status, setStatus] = useState("等待生成");

  const [batchInput, setBatchInput] = useState("https://example.com\nWIFI:T:WPA;S:MyWifi;P:12345678;;\nBEGIN:VCARD\nFN:张三\nTEL:13800000000\nEND:VCARD");
  const [batchItems, setBatchItems] = useState<BatchQrItem[]>([]);
  const [batchStatus, setBatchStatus] = useState("等待批量生成");

  const [scanResult, setScanResult] = useState("");
  const [scanStatus, setScanStatus] = useState("扫码未启动");
  const [isScanning, setIsScanning] = useState(false);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const scanStreamRef = useRef<MediaStream | null>(null);

  const hasBatch = useMemo(() => batchItems.length > 0, [batchItems.length]);

  async function generateOne(inputText: string) {
    if (!inputText.trim()) {
      setStatus("请输入文本或链接");
      return;
    }

    try {
      const baseUrl = await QRCode.toDataURL(inputText, {
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: "H",
      });

      const finalUrl = logoUrl ? await composeWithLogo(baseUrl, logoUrl, size) : baseUrl;
      setQrDataUrl(finalUrl);
      setStatus("二维码生成成功");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "二维码生成失败");
    }
  }

  async function generateBatch() {
    const lines = batchInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      setBatchStatus("请先输入每行一个文本");
      return;
    }

    setBatchStatus(`正在生成 ${lines.length} 个二维码...`);

    const result = await Promise.all(
      lines.map(async (line) => {
        const baseUrl = await QRCode.toDataURL(line, {
          width: size,
          margin: 2,
          color: {
            dark: fgColor,
            light: bgColor,
          },
          errorCorrectionLevel: "H",
        });

        const finalUrl = logoUrl ? await composeWithLogo(baseUrl, logoUrl, size) : baseUrl;
        return { text: line, dataUrl: finalUrl } satisfies BatchQrItem;
      }),
    );

    setBatchItems(result);
    setBatchStatus(`批量生成完成：${result.length} 个`);
  }

  async function downloadBatchZip() {
    if (!batchItems.length) {
      return;
    }

    const zip = new JSZip();

    batchItems.forEach((item, index) => {
      const base64 = item.dataUrl.split(",")[1] || "";
      const safeName = item.text.replace(/[\\/:*?"<>|]/g, "_").slice(0, 30) || `qr-${index + 1}`;
      zip.file(`${String(index + 1).padStart(3, "0")}-${safeName}.png`, base64, { base64: true });
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `qrcode-batch-${Date.now()}.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function stopScan() {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    scanStreamRef.current?.getTracks().forEach((track) => track.stop());
    scanStreamRef.current = null;
    setIsScanning(false);
    setScanStatus("扫码已停止");
  }

  async function startScan() {
    try {
      if (!videoRef.current) {
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      scanStreamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setIsScanning(true);
      setScanStatus("扫码中...");

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        setScanStatus("无法初始化扫码画布");
        return;
      }

      scanTimerRef.current = window.setInterval(() => {
        if (!videoRef.current) {
          return;
        }

        const video = videoRef.current;
        if (video.videoWidth < 2 || video.videoHeight < 2) {
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height);

        if (result?.data) {
          setScanResult(result.data);
          setScanStatus("识别成功");
          stopScan();
        }
      }, 240);
    } catch (error) {
      setScanStatus(error instanceof Error ? error.message : "无法访问摄像头");
    }
  }

  useEffect(() => {
    return () => stopScan();
  }, []);

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">二维码生成</h2>
          <textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-700">大小：{size}px<input type="range" min={180} max={640} value={size} onChange={(event) => setSize(Number(event.target.value))} className="mt-1 w-full" /></label>
            <label className="text-sm text-slate-700">Logo<input ref={logoInputRef} type="file" accept="image/*" className="mt-1 w-full text-xs" onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              const dataUrl = await fileToDataUrl(file);
              setLogoUrl(dataUrl);
            }} /></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-700">前景色<input type="color" value={fgColor} onChange={(event) => setFgColor(event.target.value)} className="mt-1 h-10 w-full" /></label>
            <label className="text-sm text-slate-700">背景色<input type="color" value={bgColor} onChange={(event) => setBgColor(event.target.value)} className="mt-1 h-10 w-full" /></label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void generateOne(text)} className="rounded-full bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white">生成二维码</button>
            <button type="button" onClick={() => setLogoUrl("")} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">移除 Logo</button>
          </div>
          <p className="text-sm text-slate-600">{status}</p>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">预览</h2>
          <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
            {qrDataUrl ? <img src={qrDataUrl} alt="QR 预览" className="h-auto max-h-72 w-auto" /> : <p className="text-sm text-slate-500">等待生成</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={async () => await navigator.clipboard.writeText(text)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">复制内容</button>
            <button type="button" onClick={() => {
              if (!qrDataUrl) return;
              const anchor = document.createElement("a");
              anchor.href = qrDataUrl;
              anchor.download = `qrcode-${Date.now()}.png`;
              anchor.click();
            }} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">下载 PNG</button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">批量生成</h2>
          <p className="text-sm text-slate-600">每行一个文本或链接，一次生成多个二维码。</p>
          <textarea value={batchInput} onChange={(event) => setBatchInput(event.target.value)} className="min-h-36 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none" />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void generateBatch()} className="rounded-full bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white">生成批量二维码</button>
            <button type="button" onClick={() => void downloadBatchZip()} disabled={!hasBatch} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">下载 ZIP</button>
          </div>
          <p className="text-sm text-slate-600">{batchStatus}</p>
          {hasBatch ? <p className="text-xs text-slate-500">已生成 {batchItems.length} 项</p> : null}
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">扫码（摄像头）</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
            <video ref={videoRef} muted playsInline className="h-56 w-full object-cover" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void startScan()} disabled={isScanning} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">开始扫码</button>
            <button type="button" onClick={stopScan} disabled={!isScanning} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">停止</button>
          </div>
          <p className="text-sm text-slate-600">{scanStatus}</p>
          <textarea value={scanResult} onChange={(event) => setScanResult(event.target.value)} placeholder="扫码结果" className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none" />
        </div>
      </div>
    </section>
  );
}
