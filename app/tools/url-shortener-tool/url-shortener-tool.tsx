"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";

interface ShortLinkItem {
  code: string;
  longUrl: string;
  createdAt: string;
  clicks: number;
}

const STORAGE_KEY = "url-shortener-tool-items";

function createCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function UrlShortenerTool() {
  const [items, setItems] = useState<ShortLinkItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as ShortLinkItem[];
    } catch {
      return [];
    }
  });
  const [longUrl, setLongUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [status, setStatus] = useState("准备生成短链");
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      return;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as ShortLinkItem[];
      const target = parsed.find((item) => item.code === code);
      if (!target) {
        return;
      }

      const updated = parsed.map((item) => (item.code === code ? { ...item, clicks: item.clicks + 1 } : item));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.location.href = target.longUrl;
    } catch {
      // ignore malformed local data
    }
  }, []);

  const baseUrl = useMemo(() => (typeof window === "undefined" ? "" : window.location.origin), []);

  async function generateShortLink() {
    try {
      const validUrl = new URL(longUrl.trim());
      if (!["http:", "https:"].includes(validUrl.protocol)) {
        throw new Error("仅支持 http 或 https 链接");
      }

      const code = customCode.trim() || createCode();
      if (!/^[A-Za-z0-9_-]{4,24}$/.test(code)) {
        throw new Error("短码仅支持 4-24 位字母数字、_ 或 -");
      }

      if (items.some((item) => item.code === code)) {
        throw new Error("短码已存在，请换一个");
      }

      const next: ShortLinkItem = {
        code,
        longUrl: validUrl.toString(),
        createdAt: new Date().toISOString(),
        clicks: 0,
      };

      const shortUrl = `${baseUrl}/tools/url-shortener-tool?code=${code}`;
      const qr = await QRCode.toDataURL(shortUrl, { margin: 1, width: 220 });
      setQrDataUrl(qr);
      setItems((current) => [next, ...current]);
      setStatus("短链创建成功");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "创建失败");
    }
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setStatus("已复制");
  }

  function openShortLink(code: string) {
    const shortUrl = `${window.location.origin}/tools/url-shortener-tool?code=${code}`;
    window.open(shortUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">生成短链接</h2>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="输入长链接，例如 https://example.com/path"
          value={longUrl}
          onChange={(event) => setLongUrl(event.target.value)}
        />
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="自定义短码（可选）"
          value={customCode}
          onChange={(event) => setCustomCode(event.target.value)}
        />
        <button
          type="button"
          onClick={generateShortLink}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          生成短链
        </button>
        <p className="text-sm text-slate-600">{status}</p>

        {items[0] ? (
          <div className="space-y-2 rounded-2xl border border-slate-200 p-4">
            <p className="text-sm text-slate-600">最新短链</p>
            <p className="font-mono text-sm text-slate-800">{`${baseUrl}/tools/url-shortener-tool?code=${items[0].code}`}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => copyText(`${baseUrl}/tools/url-shortener-tool?code=${items[0].code}`)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
              >
                复制
              </button>
              <button
                type="button"
                onClick={() => openShortLink(items[0].code)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
              >
                打开
              </button>
            </div>
          </div>
        ) : null}
      </article>

      <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">访问统计与二维码</h2>
        {qrDataUrl ? (
          <Image src={qrDataUrl} alt="short link qrcode" width={176} height={176} className="h-44 w-44 rounded-xl border border-slate-200" />
        ) : null}

        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.code} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <p className="font-mono text-slate-900">{item.code}</p>
              <p className="truncate text-slate-600">{item.longUrl}</p>
              <p className="text-xs text-slate-500">点击 {item.clicks} 次</p>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
