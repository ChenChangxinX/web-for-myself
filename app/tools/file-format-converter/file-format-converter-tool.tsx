"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";

type Tab = "pdf" | "image" | "video" | "cloud";
type ImageOutputType = "image/png" | "image/jpeg" | "image/webp";

function normalizeFileBaseName(name: string): string {
  return name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_\u4e00-\u9fa5]/g, "_");
}

function outputExtension(type: ImageOutputType): string {
  if (type === "image/jpeg") {
    return "jpg";
  }
  if (type === "image/webp") {
    return "webp";
  }
  return "png";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: ImageOutputType, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("导出失败"));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

async function convertVideoToWebm(file: File, fps: number): Promise<Blob> {
  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = sourceUrl;
  video.muted = true;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("视频加载失败"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    URL.revokeObjectURL(sourceUrl);
    throw new Error("无法初始化画布");
  }

  const canvasStream = canvas.captureStream(fps);
  const capturedVideoStream = (video as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream();
  const mixedStream = new MediaStream([...canvasStream.getVideoTracks(), ...capturedVideoStream.getAudioTracks()]);

  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
    ? "video/webm;codecs=vp9,opus"
    : "video/webm";

  const recorder = new MediaRecorder(mixedStream, { mimeType });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const stopped = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: "video/webm" }));
    };
  });

  recorder.start(1000);
  await video.play();

  await new Promise<void>((resolve) => {
    const draw = () => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (video.ended || video.paused) {
        resolve();
        return;
      }
      requestAnimationFrame(draw);
    };
    draw();
  });

  recorder.stop();
  const result = await stopped;
  mixedStream.getTracks().forEach((track) => track.stop());
  URL.revokeObjectURL(sourceUrl);
  return result;
}

export function FileFormatConverterTool() {
  const [activeTab, setActiveTab] = useState<Tab>("pdf");

  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [pdfScale, setPdfScale] = useState(1.5);
  const [pdfOutputType, setPdfOutputType] = useState<ImageOutputType>("image/png");

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageOutputType, setImageOutputType] = useState<ImageOutputType>("image/webp");
  const [imageQuality, setImageQuality] = useState(0.9);

  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoFps, setVideoFps] = useState(24);

  const [cloudFiles, setCloudFiles] = useState<File[]>([]);
  const [cloudEndpoint, setCloudEndpoint] = useState("");
  const [cloudToken, setCloudToken] = useState("");

  const [status, setStatus] = useState("准备就绪");
  const [busy, setBusy] = useState(false);

  const pdfHint = useMemo(() => {
    const ext = outputExtension(pdfOutputType);
    return `输出格式：${ext.toUpperCase()}，分辨率倍率：${pdfScale.toFixed(1)}x`;
  }, [pdfOutputType, pdfScale]);

  async function convertPdfToImages() {
    if (pdfFiles.length === 0) {
      setStatus("请先选择 PDF 文件");
      return;
    }

    setBusy(true);
    setStatus("正在解析 PDF 并转换为图片...");

    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
      }

      const zip = new JSZip();
      for (const file of pdfFiles) {
        const data = new Uint8Array(await file.arrayBuffer());
        const task = pdfjs.getDocument({ data });
        const pdf = await task.promise;
        const folder = zip.folder(normalizeFileBaseName(file.name));

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: pdfScale });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("PDF 画布初始化失败");
          }

          await page.render({ canvas, canvasContext: context, viewport }).promise;
          const blob = await canvasToBlob(canvas, pdfOutputType, 0.92);
          folder?.file(`page-${String(pageNumber).padStart(3, "0")}.${outputExtension(pdfOutputType)}`, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, `pdf-to-images-${Date.now()}.zip`);
      setStatus(`转换完成：共处理 ${pdfFiles.length} 个 PDF`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "PDF 转换失败");
    } finally {
      setBusy(false);
    }
  }

  async function convertImages() {
    if (imageFiles.length === 0) {
      setStatus("请先选择图片文件");
      return;
    }

    setBusy(true);
    setStatus("正在转换图片格式...");

    try {
      const zip = new JSZip();

      for (const file of imageFiles) {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("图片画布初始化失败");
        }

        context.drawImage(bitmap, 0, 0);
        const blob = await canvasToBlob(canvas, imageOutputType, imageQuality);
        zip.file(`${normalizeFileBaseName(file.name)}.${outputExtension(imageOutputType)}`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, `image-convert-${Date.now()}.zip`);
      setStatus(`转换完成：共处理 ${imageFiles.length} 张图片`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "图片转换失败");
    } finally {
      setBusy(false);
    }
  }

  async function convertVideos() {
    if (videoFiles.length === 0) {
      setStatus("请先选择视频文件");
      return;
    }

    setBusy(true);
    setStatus("正在转换视频为 WebM，视频越长耗时越久...");

    try {
      const zip = new JSZip();
      let index = 0;
      for (const file of videoFiles) {
        index += 1;
        setStatus(`正在处理第 ${index}/${videoFiles.length} 个视频...`);
        const webmBlob = await convertVideoToWebm(file, videoFps);
        zip.file(`${normalizeFileBaseName(file.name)}.webm`, webmBlob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, `video-convert-${Date.now()}.zip`);
      setStatus(`转换完成：共处理 ${videoFiles.length} 个视频`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "视频转换失败");
    } finally {
      setBusy(false);
    }
  }

  async function uploadCloudTask() {
    if (!cloudEndpoint.trim()) {
      setStatus("请输入云端转换接口地址");
      return;
    }
    if (cloudFiles.length === 0) {
      setStatus("请先选择要上传的文件");
      return;
    }

    setBusy(true);
    setStatus("正在上传云端转换任务...");

    try {
      const formData = new FormData();
      cloudFiles.forEach((file) => formData.append("files", file));
      formData.append("tool", "file-format-converter");
      formData.append("hint", "batch-convert-large-files");

      const headers: HeadersInit = {};
      if (cloudToken.trim()) {
        headers.Authorization = `Bearer ${cloudToken.trim()}`;
      }

      const response = await fetch(cloudEndpoint.trim(), {
        method: "POST",
        body: formData,
        headers,
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`云端任务失败（${response.status}）：${responseText.slice(0, 160)}`);
      }

      setStatus(`云端任务提交成功：${responseText.slice(0, 180) || "已接收"}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "云端任务提交失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("pdf")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === "pdf" ? "bg-indigo-600 text-white" : "border border-slate-300 text-slate-700"}`}
        >
          PDF 转图片
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("image")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === "image" ? "bg-indigo-600 text-white" : "border border-slate-300 text-slate-700"}`}
        >
          图片格式转换
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("video")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === "video" ? "bg-indigo-600 text-white" : "border border-slate-300 text-slate-700"}`}
        >
          视频格式转换
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("cloud")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === "cloud" ? "bg-indigo-600 text-white" : "border border-slate-300 text-slate-700"}`}
        >
          云端转换
        </button>
      </div>

      {activeTab === "pdf" ? (
        <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">PDF -&gt; 图片（批量）</h2>
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={(event) => setPdfFiles(Array.from(event.target.files ?? []))}
            className="block w-full text-sm"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              输出格式
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={pdfOutputType}
                onChange={(event) => setPdfOutputType(event.target.value as ImageOutputType)}
              >
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPG</option>
                <option value="image/webp">WEBP</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              清晰度倍率：{pdfScale.toFixed(1)}x
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={pdfScale}
                onChange={(event) => setPdfScale(Number.parseFloat(event.target.value))}
                className="w-full"
              />
            </label>
          </div>

          <p className="text-sm text-slate-600">{pdfHint}</p>

          <button
            type="button"
            onClick={convertPdfToImages}
            disabled={busy}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            开始转换并下载 ZIP
          </button>
        </article>
      ) : null}

      {activeTab === "image" ? (
        <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">图片格式转换（批量）</h2>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setImageFiles(Array.from(event.target.files ?? []))}
            className="block w-full text-sm"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              输出格式
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={imageOutputType}
                onChange={(event) => setImageOutputType(event.target.value as ImageOutputType)}
              >
                <option value="image/webp">WEBP</option>
                <option value="image/jpeg">JPG</option>
                <option value="image/png">PNG</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              压缩质量：{Math.round(imageQuality * 100)}%
              <input
                type="range"
                min={0.4}
                max={1}
                step={0.05}
                value={imageQuality}
                onChange={(event) => setImageQuality(Number.parseFloat(event.target.value))}
                className="w-full"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={convertImages}
            disabled={busy}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            转换图片并下载 ZIP
          </button>
        </article>
      ) : null}

      {activeTab === "video" ? (
        <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">视频格式转换（输出 WebM）</h2>
          <p className="text-sm text-slate-600">在浏览器本地转码，支持批量处理。建议先用短视频测试，长视频可能耗时较长。</p>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={(event) => setVideoFiles(Array.from(event.target.files ?? []))}
            className="block w-full text-sm"
          />

          <label className="space-y-2 text-sm text-slate-700">
            输出帧率：{videoFps} fps
            <input
              type="range"
              min={12}
              max={60}
              step={1}
              value={videoFps}
              onChange={(event) => setVideoFps(Number.parseInt(event.target.value, 10))}
              className="w-full"
            />
          </label>

          <button
            type="button"
            onClick={convertVideos}
            disabled={busy}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            转换视频并下载 ZIP
          </button>
        </article>
      ) : null}

      {activeTab === "cloud" ? (
        <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">云端转换任务（大文件）</h2>
          <p className="text-sm text-slate-600">将文件批量上传到你自己的云端转换 API，浏览器端不保存你的 Token。</p>
          <input
            type="url"
            value={cloudEndpoint}
            onChange={(event) => setCloudEndpoint(event.target.value)}
            placeholder="https://your-api.example.com/convert"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={cloudToken}
            onChange={(event) => setCloudToken(event.target.value)}
            placeholder="Bearer Token（可选）"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="file"
            multiple
            onChange={(event) => setCloudFiles(Array.from(event.target.files ?? []))}
            className="block w-full text-sm"
          />

          <button
            type="button"
            onClick={uploadCloudTask}
            disabled={busy}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            提交云端转换任务
          </button>
        </article>
      ) : null}

      <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">状态：{status}</p>
    </section>
  );
}
