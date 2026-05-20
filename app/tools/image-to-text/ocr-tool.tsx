"use client";

import { useEffect, useRef, useState, type ClipboardEvent } from "react";
import { createWorker } from "tesseract.js";

/* eslint-disable @next/next/no-img-element */

type OcrWorker = Awaited<ReturnType<typeof createWorker>>;

const LANGUAGE = "chi_sim";
const LANG_PATH = "https://tessdata.projectnaptha.com/4.0.0_fast";

export function OcrTool() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [recognizedText, setRecognizedText] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("等待上传图片或粘贴截图");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const workerRef = useRef<OcrWorker | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      void workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function ensureWorker() {
    if (workerRef.current) {
      return workerRef.current;
    }

    const worker = await createWorker(LANGUAGE, 1, {
      langPath: LANG_PATH,
      logger: (message) => {
        if (typeof message.progress === "number") {
          setProgress(Math.round(message.progress * 100));
        }

        if (message.status) {
          setStatusMessage(message.status);
        }
      },
    });

    workerRef.current = worker;
    return worker;
  }

  async function processFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatusMessage("请选择图片文件");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    setFileName(file.name);
    setRecognizedText("");
    setCopyState("idle");
    setIsRecognizing(true);
    setProgress(0);
    setStatusMessage("正在初始化 OCR 引擎...");

    try {
      const worker = await ensureWorker();
      const result = await worker.recognize(file);
      setRecognizedText(result.data.text.trim());
      setStatusMessage("识别完成");
      setProgress(100);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "识别失败，请重试");
    } finally {
      setIsRecognizing(false);
    }
  }

  async function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const pastedFile = Array.from(event.clipboardData.items)
      .map((item) => item.getAsFile())
      .find((file): file is File => Boolean(file && file.type.startsWith("image/")));

    if (pastedFile) {
      event.preventDefault();
      await processFile(pastedFile);
    }
  }

  async function copyText() {
    if (!recognizedText) {
      return;
    }

    await navigator.clipboard.writeText(recognizedText);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1500);
  }

  return (
    <section
      className="grid gap-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm lg:grid-cols-[1.05fr_0.95fr]"
      onPaste={handlePaste}
      tabIndex={0}
    >
      <div className="space-y-4">
        <div
          className="flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-sky-200 bg-sky-50/70 p-6 text-center transition hover:border-sky-300 hover:bg-sky-50"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={async (event) => {
            event.preventDefault();
            const droppedFile = event.dataTransfer.files?.[0];
            if (droppedFile) {
              await processFile(droppedFile);
            }
          }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            上传 / 拖拽 / 粘贴
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            把图片放进来，自动提取文字
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
            支持截图、照片、扫描件和本地图片。你也可以直接复制截图后粘贴到这里。
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) {
                await processFile(file);
              }
            }}
          />

          <button
            type="button"
            disabled={isRecognizing}
            className="mt-5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            {isRecognizing ? "识别中..." : "选择本地图片"}
          </button>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p>状态：{statusMessage}</p>
          <p className="mt-2">识别进度：{progress}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-sky-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {fileName ? <p className="mt-2 truncate">当前文件：{fileName}</p> : null}
        </div>
      </div>

      <div className="space-y-4">
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-slate-50">
          {previewUrl ? (
            <img src={previewUrl} alt="上传预览" className="h-64 w-full object-contain bg-white" />
          ) : (
            <div className="flex h-64 items-center justify-center px-8 text-center text-sm text-slate-500">
              这里会显示图片预览
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">识别结果</h3>
            <button
              type="button"
              onClick={copyText}
              disabled={!recognizedText}
              className="rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copyState === "copied" ? "已复制" : "复制文本"}
            </button>
          </div>
          <textarea
            value={recognizedText}
            readOnly
            placeholder="识别结果会显示在这里"
            className="min-h-56 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800 outline-none"
          />
          <p className="mt-3 text-xs leading-5 text-slate-500">
            建议上传清晰、正向、对比度高的图片，识别效果更好。该工具在浏览器本地运行，不会把图片上传到服务器。
          </p>
        </div>
      </div>
    </section>
  );
}
