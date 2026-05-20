"use client";

import { useMemo, useState } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

const defaultMarkdown = `# Markdown 转 HTML

这是一个 **实时预览** 示例。

## 列表

- 支持代码高亮
- 支持主题切换
- 支持导出 HTML / Word / PDF

## 代码

\`\`\`ts
function hello(name: string) {
  return \`Hello, \${name}\`;
}
\`\`\`

> 你可以把这里当成博客或文档编辑器。
`;

const themes = {
  clean: {
    name: "Clean",
    css: "body{font-family:Manrope,'Noto Sans SC',sans-serif;line-height:1.75;color:#0f172a;padding:24px;} h1,h2,h3{color:#0f172a;} blockquote{border-left:4px solid #0ea5e9;padding-left:12px;color:#334155;background:#f0f9ff;} pre{background:#0b1020;color:#e2e8f0;padding:14px;border-radius:12px;overflow:auto;} code{font-family:'JetBrains Mono',monospace;} table{border-collapse:collapse;} td,th{border:1px solid #cbd5e1;padding:6px 10px;}",
  },
  paper: {
    name: "Paper",
    css: "body{font-family:Georgia,'Noto Serif SC',serif;line-height:1.8;color:#1f2937;background:#fffbf0;padding:28px;} h1,h2,h3{color:#78350f;} a{color:#9a3412;} blockquote{border-left:4px solid #f59e0b;padding-left:12px;color:#7c2d12;} pre{background:#422006;color:#fef3c7;padding:14px;border-radius:12px;overflow:auto;} code{font-family:'JetBrains Mono',monospace;} table{border-collapse:collapse;} td,th{border:1px solid #d6d3d1;padding:6px 10px;}",
  },
  tech: {
    name: "Tech",
    css: "body{font-family:'JetBrains Mono','Noto Sans SC',monospace;line-height:1.7;color:#d1d5db;background:#020617;padding:24px;} h1,h2,h3{color:#22d3ee;} a{color:#38bdf8;} blockquote{border-left:4px solid #22d3ee;padding-left:12px;color:#93c5fd;background:#082f49;} pre{background:#0f172a;color:#cbd5e1;padding:14px;border-radius:12px;overflow:auto;} table{border-collapse:collapse;} td,th{border:1px solid #334155;padding:6px 10px;}",
  },
} as const;

type ThemeKey = keyof typeof themes;

(marked as unknown as { setOptions: (options: Record<string, unknown>) => void }).setOptions({
  breaks: true,
  gfm: true,
  highlight(code: string, language: string) {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

function buildDocument(html: string, themeKey: ThemeKey) {
  const theme = themes[themeKey];
  return `<!doctype html><html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Markdown Export</title><style>${theme.css}</style></head><body>${html}</body></html>`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function MarkdownToHtmlTool() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [theme, setTheme] = useState<ThemeKey>("clean");
  const [status, setStatus] = useState("编辑中");

  const rendered = useMemo(() => {
    const raw = marked.parse(markdown) as string;
    return raw;
  }, [markdown]);

  const themedHtml = useMemo(() => buildDocument(rendered, theme), [rendered, theme]);

  async function copyHtml() {
    await navigator.clipboard.writeText(themedHtml);
    setStatus("HTML 已复制");
  }

  function exportHtml() {
    const blob = new Blob([themedHtml], { type: "text/html;charset=utf-8" });
    downloadBlob(blob, "markdown-export.html");
    setStatus("已导出 HTML");
  }

  function exportWord() {
    const blob = new Blob([themedHtml], { type: "application/msword;charset=utf-8" });
    downloadBlob(blob, "markdown-export.doc");
    setStatus("已导出 Word(doc)");
  }

  function exportPdfHint() {
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      setStatus("无法打开新窗口，请检查浏览器拦截设置");
      return;
    }

    previewWindow.document.write(themedHtml);
    previewWindow.document.close();
    previewWindow.focus();
    previewWindow.print();
    setStatus("已打开打印窗口，可另存为 PDF");
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Markdown 输入</h2>
            <select value={theme} onChange={(event) => setTheme(event.target.value as ThemeKey)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none">
              {Object.entries(themes).map(([key, value]) => (
                <option key={key} value={key}>{value.name}</option>
              ))}
            </select>
          </div>

          <textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} className="min-h-[420px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm outline-none" />

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copyHtml} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">复制 HTML</button>
            <button type="button" onClick={exportHtml} className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white">导出 HTML</button>
            <button type="button" onClick={exportWord} className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white">导出 Word</button>
            <button type="button" onClick={exportPdfHint} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">导出 PDF</button>
          </div>
          <p className="text-sm text-slate-600">状态：{status}</p>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">实时预览（HTML）</h2>
          <div className="min-h-[420px] overflow-auto rounded-2xl border border-slate-200 bg-white p-4">
            <iframe title="markdown-preview" srcDoc={themedHtml} className="h-[400px] w-full border-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
