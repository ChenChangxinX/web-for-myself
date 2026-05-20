"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import JSZip from "jszip";

/* eslint-disable @next/next/no-img-element */

interface BatchEncodedItem {
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  rawBase64: string;
}

function utf8ToBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToUtf8(value: string) {
  const normalized = value.replace(/\s+/g, "");
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function parseDataUrl(value: string) {
  if (!value.startsWith("data:")) {
    return null;
  }

  const commaIndex = value.indexOf(",");
  if (commaIndex < 0) {
    return null;
  }

  return {
    header: value.slice(0, commaIndex),
    rawBase64: value.slice(commaIndex + 1),
  };
}

function toUnicodeEscapes(value: string) {
  return Array.from(value)
    .map((char) => {
      const codePoint = char.codePointAt(0) ?? 0;

      if (codePoint <= 0xffff) {
        return `\\u${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
      }

      const adjusted = codePoint - 0x10000;
      const high = 0xd800 + (adjusted >> 10);
      const low = 0xdc00 + (adjusted & 0x3ff);
      return `\\u${high.toString(16).toUpperCase()}\\u${low.toString(16).toUpperCase()}`;
    })
    .join("");
}

function fromUnicodeEscapes(value: string) {
  return value.replace(/\\u([\dA-Fa-f]{4})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
}

function humanSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

export function Base64Tool() {
  const [textInput, setTextInput] = useState("Hello, 你好! 👋");
  const [textOutput, setTextOutput] = useState("");
  const [textStatus, setTextStatus] = useState("等待处理文本");

  const [imageEncodeDataUrl, setImageEncodeDataUrl] = useState("");
  const [imageEncodeRaw, setImageEncodeRaw] = useState("");
  const [imageDecodeInput, setImageDecodeInput] = useState("");
  const [imageDecodeMime, setImageDecodeMime] = useState("image/png");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageStatus, setImageStatus] = useState("等待上传图片或粘贴 Base64");

  const [batchItems, setBatchItems] = useState<BatchEncodedItem[]>([]);
  const [batchStatus, setBatchStatus] = useState("等待批量文件上传");
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const [extraInput, setExtraInput] = useState("https://example.com/?q=你好 world");
  const [extraOutput, setExtraOutput] = useState("");
  const [extraStatus, setExtraStatus] = useState("等待扩展编码处理");

  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const batchFileInputRef = useRef<HTMLInputElement | null>(null);

  const batchSummary = useMemo(() => {
    const totalSize = batchItems.reduce((sum, item) => sum + item.size, 0);
    return {
      count: batchItems.length,
      totalSize,
    };
  }, [batchItems]);

  function encodeText() {
    try {
      const encoded = utf8ToBase64(textInput);
      setTextOutput(encoded);
      setTextStatus("文本已编码为 Base64");
    } catch (error) {
      setTextStatus(error instanceof Error ? error.message : "编码失败");
    }
  }

  function decodeText() {
    try {
      const decoded = base64ToUtf8(textInput);
      setTextOutput(decoded);
      setTextStatus("Base64 已解码为文本");
    } catch (error) {
      setTextStatus(error instanceof Error ? error.message : "解码失败，请检查输入");
    }
  }

  async function copyContent(value: string) {
    if (!value.trim()) {
      return;
    }
    await navigator.clipboard.writeText(value);
  }

  async function handleSingleImageFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setImageStatus("请选择图片文件");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      const parsed = parseDataUrl(dataUrl);
      if (!parsed) {
        setImageStatus("解析失败");
        return;
      }

      setImageEncodeDataUrl(dataUrl);
      setImageEncodeRaw(parsed.rawBase64);
      setImagePreviewUrl(dataUrl);
      setImageStatus(`已编码图片：${file.name}`);
    } catch (error) {
      setImageStatus(error instanceof Error ? error.message : "图片编码失败");
    }
  }

  function decodeImageFromInput() {
    const rawValue = imageDecodeInput.trim();
    if (!rawValue) {
      setImageStatus("请输入 Base64 内容");
      return;
    }

    try {
      let dataUrl = rawValue;
      if (!rawValue.startsWith("data:")) {
        const normalized = rawValue.replace(/\s+/g, "");
        atob(normalized);
        dataUrl = `data:${imageDecodeMime};base64,${normalized}`;
      }

      setImagePreviewUrl(dataUrl);
      setImageStatus("图片 Base64 解码成功");
    } catch {
      setImageStatus("图片 Base64 无效，请检查输入");
    }
  }

  async function handleBatchFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    setIsBatchProcessing(true);
    setBatchStatus(`正在处理 ${files.length} 个文件...`);

    const nextItems: BatchEncodedItem[] = [];

    for (const file of files) {
      try {
        const dataUrl = await fileToDataUrl(file);
        const parsed = parseDataUrl(dataUrl);
        if (!parsed) {
          continue;
        }

        nextItems.push({
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          dataUrl,
          rawBase64: parsed.rawBase64,
        });
      } catch {
        // ignore failed files and continue
      }
    }

    setBatchItems(nextItems);
    setIsBatchProcessing(false);
    setBatchStatus(`批量编码完成：${nextItems.length} 个文件`);
  }

  async function downloadBatchZip() {
    if (!batchItems.length) {
      return;
    }

    const zip = new JSZip();

    batchItems.forEach((item) => {
      const fileBaseName = item.name.replace(/\.[^.]+$/, "") || "file";
      zip.file(`${fileBaseName}.base64.txt`, item.rawBase64);
      zip.file(`${fileBaseName}.dataurl.txt`, item.dataUrl);
    });

    zip.file(
      "manifest.json",
      JSON.stringify(
        batchItems.map((item, index) => ({
          index: index + 1,
          name: item.name,
          mimeType: item.mimeType,
          size: item.size,
        })),
        null,
        2,
      ),
    );

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const timeTag = new Date().toISOString().replace(/[:.]/g, "-");

    anchor.href = url;
    anchor.download = `base64-batch-${timeTag}.zip`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  function encodeUrl() {
    try {
      setExtraOutput(encodeURIComponent(extraInput));
      setExtraStatus("URL 编码成功");
    } catch (error) {
      setExtraStatus(error instanceof Error ? error.message : "URL 编码失败");
    }
  }

  function decodeUrl() {
    try {
      setExtraOutput(decodeURIComponent(extraInput));
      setExtraStatus("URL 解码成功");
    } catch (error) {
      setExtraStatus(error instanceof Error ? error.message : "URL 解码失败");
    }
  }

  function encodeUnicode() {
    try {
      setExtraOutput(toUnicodeEscapes(extraInput));
      setExtraStatus("Unicode 编码成功");
    } catch (error) {
      setExtraStatus(error instanceof Error ? error.message : "Unicode 编码失败");
    }
  }

  function decodeUnicode() {
    try {
      setExtraOutput(fromUnicodeEscapes(extraInput));
      setExtraStatus("Unicode 解码成功");
    } catch (error) {
      setExtraStatus(error instanceof Error ? error.message : "Unicode 解码失败");
    }
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">文本 Base64</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={encodeText} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                编码
              </button>
              <button type="button" onClick={decodeText} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                解码
              </button>
            </div>
          </div>
          <textarea
            value={textInput}
            onChange={(event) => setTextInput(event.target.value)}
            className="min-h-48 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-900 outline-none focus:border-rose-300"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-slate-600">{textStatus}</p>
            <button
              type="button"
              onClick={() => copyContent(textOutput)}
              disabled={!textOutput}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              复制结果
            </button>
          </div>
          <pre className="min-h-40 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-800">{textOutput || "处理结果显示在这里"}</pre>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">图片 Base64（编码/解码预览）</h2>
            <button
              type="button"
              onClick={() => imageFileInputRef.current?.click()}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              上传图片编码
            </button>
          </div>

          <input ref={imageFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSingleImageFile} />

          <p className="text-sm text-slate-600">{imageStatus}</p>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-700">编码结果（Raw Base64）</p>
            <textarea
              value={imageEncodeRaw}
              onChange={(event) => setImageEncodeRaw(event.target.value)}
              className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white p-2 font-mono text-xs text-slate-800 outline-none"
              placeholder="上传图片后生成"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyContent(imageEncodeRaw)}
                disabled={!imageEncodeRaw}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                复制 Raw
              </button>
              <button
                type="button"
                onClick={() => copyContent(imageEncodeDataUrl)}
                disabled={!imageEncodeDataUrl}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                复制 Data URL
              </button>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-700">解码输入（支持 Data URL 或 Raw Base64）</p>
            <textarea
              value={imageDecodeInput}
              onChange={(event) => setImageDecodeInput(event.target.value)}
              className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white p-2 font-mono text-xs text-slate-800 outline-none"
              placeholder="粘贴 Base64 内容"
            />
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={imageDecodeMime}
                onChange={(event) => setImageDecodeMime(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
              >
                <option value="image/png">image/png</option>
                <option value="image/jpeg">image/jpeg</option>
                <option value="image/webp">image/webp</option>
                <option value="image/gif">image/gif</option>
              </select>
              <button type="button" onClick={decodeImageFromInput} className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">
                解码并预览
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {imagePreviewUrl ? (
              <img src={imagePreviewUrl} alt="Base64 预览" className="h-56 w-full object-contain bg-white" />
            ) : (
              <div className="flex h-56 items-center justify-center px-6 text-center text-sm text-slate-500">图片预览区域</div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">批量文件 Base64 编码</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => batchFileInputRef.current?.click()}
              disabled={isBatchProcessing}
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBatchProcessing ? "处理中..." : "选择多个文件"}
            </button>
            <button
              type="button"
              onClick={downloadBatchZip}
              disabled={!batchItems.length}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              下载 ZIP（Base64）
            </button>
          </div>
        </div>

        <input ref={batchFileInputRef} type="file" multiple className="hidden" onChange={handleBatchFiles} />

        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
          <p>{batchStatus}</p>
          <p className="mt-1">
            已处理：{batchSummary.count} 个文件，总大小：{humanSize(batchSummary.totalSize)}
          </p>
        </div>

        {batchItems.length ? (
          <div className="overflow-auto rounded-2xl border border-slate-200">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">文件名</th>
                  <th className="px-3 py-2">类型</th>
                  <th className="px-3 py-2">大小</th>
                  <th className="px-3 py-2">Raw Base64（前120字符）</th>
                </tr>
              </thead>
              <tbody>
                {batchItems.map((item) => (
                  <tr key={`${item.name}-${item.size}`} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-700">{item.name}</td>
                    <td className="px-3 py-2 text-slate-500">{item.mimeType}</td>
                    <td className="px-3 py-2 text-slate-500">{humanSize(item.size)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">{item.rawBase64.slice(0, 120)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold text-slate-900">扩展编码（URL / Unicode）</h2>
        <textarea
          value={extraInput}
          onChange={(event) => setExtraInput(event.target.value)}
          className="min-h-36 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-800 outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={encodeUrl} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            URL 编码
          </button>
          <button type="button" onClick={decodeUrl} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
            URL 解码
          </button>
          <button type="button" onClick={encodeUnicode} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Unicode 编码
          </button>
          <button type="button" onClick={decodeUnicode} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
            Unicode 解码
          </button>
          <button
            type="button"
            onClick={() => copyContent(extraOutput)}
            disabled={!extraOutput}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            复制结果
          </button>
        </div>
        <p className="text-sm text-slate-600">{extraStatus}</p>
        <pre className="min-h-24 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-800">{extraOutput || "处理结果显示在这里"}</pre>
      </div>
    </section>
  );
}
