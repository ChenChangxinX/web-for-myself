"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { compareTexts, type CompareMode, type CompareOptions, type DiffChunk, type LineDiffRow } from "@/lib/text-diff";

type FileSide = "left" | "right";

const ACCEPT_TEXT_FILES = ".txt,.md,.log,.json,.csv,.yaml,.yml,.xml,.html,.js,.ts,.tsx,.jsx";

function renderChunks(chunks: DiffChunk[] | undefined, tone: "left" | "right") {
  if (!chunks) {
    return null;
  }

  return chunks.map((chunk, index) => {
    if (chunk.type === 0) {
      return <span key={index}>{chunk.text}</span>;
    }

    if (tone === "left" && chunk.type === -1) {
      return (
        <span key={index} className="rounded bg-rose-200/80 px-0.5 text-rose-950">
          {chunk.text}
        </span>
      );
    }

    if (tone === "right" && chunk.type === 1) {
      return (
        <span key={index} className="rounded bg-emerald-200/80 px-0.5 text-emerald-950">
          {chunk.text}
        </span>
      );
    }

    return null;
  });
}

function fileNameLabel(file: File | null, fallback: string) {
  return file ? file.name : fallback;
}

export function TextCompareTool() {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [leftFile, setLeftFile] = useState<File | null>(null);
  const [rightFile, setRightFile] = useState<File | null>(null);
  const [mode, setMode] = useState<CompareMode>("line");
  const [options, setOptions] = useState<CompareOptions>({
    ignoreCase: false,
    ignoreWhitespace: false,
  });
  const leftInputRef = useRef<HTMLInputElement | null>(null);
  const rightInputRef = useRef<HTMLInputElement | null>(null);

  const result = useMemo(() => compareTexts(leftText, rightText, options), [leftText, rightText, options]);

  const stats = useMemo(() => {
    const additions = result.lineRows.filter((row) => row.type === "add").length;
    const deletions = result.lineRows.filter((row) => row.type === "delete").length;
    const changes = result.lineRows.filter((row) => row.type === "change").length;
    const equals = result.lineRows.filter((row) => row.type === "equal").length;

    return { additions, deletions, changes, equals };
  }, [result.lineRows]);

  async function loadFile(file: File, side: FileSide) {
    const content = await file.text();
    if (side === "left") {
      setLeftText(content);
      setLeftFile(file);
    } else {
      setRightText(content);
      setRightFile(file);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>, side: FileSide) {
    const file = event.target.files?.[0];
    if (file) {
      void loadFile(file, side);
    }
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">左侧文本</h2>
            <span className="text-xs text-slate-500">{fileNameLabel(leftFile, "未选择文件")}</span>
          </div>
          <textarea
            value={leftText}
            onChange={(event) => setLeftText(event.target.value)}
            placeholder="粘贴或输入左侧文本"
            className="min-h-72 w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 font-mono text-sm leading-6 text-slate-900 outline-none focus:border-violet-300"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => leftInputRef.current?.click()}
              className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
            >
              上传左侧文件
            </button>
            <button
              type="button"
              onClick={() => {
                setLeftText("");
                setLeftFile(null);
              }}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              清空
            </button>
            <input ref={leftInputRef} type="file" accept={ACCEPT_TEXT_FILES} className="hidden" onChange={(event) => handleFileChange(event, "left")} />
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">右侧文本</h2>
            <span className="text-xs text-slate-500">{fileNameLabel(rightFile, "未选择文件")}</span>
          </div>
          <textarea
            value={rightText}
            onChange={(event) => setRightText(event.target.value)}
            placeholder="粘贴或输入右侧文本"
            className="min-h-72 w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 font-mono text-sm leading-6 text-slate-900 outline-none focus:border-violet-300"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => rightInputRef.current?.click()}
              className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
            >
              上传右侧文件
            </button>
            <button
              type="button"
              onClick={() => {
                setRightText("");
                setRightFile(null);
              }}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              清空
            </button>
            <input ref={rightInputRef} type="file" accept={ACCEPT_TEXT_FILES} className="hidden" onChange={(event) => handleFileChange(event, "right")} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2 rounded-full bg-white p-1">
          <button
            type="button"
            onClick={() => setMode("line")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === "line" ? "bg-violet-600 text-white" : "text-slate-600"}`}
          >
            行对比
          </button>
          <button
            type="button"
            onClick={() => setMode("char")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === "char" ? "bg-violet-600 text-white" : "text-slate-600"}`}
          >
            字符对比
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={options.ignoreWhitespace}
            onChange={() => setOptions((current) => ({ ...current, ignoreWhitespace: !current.ignoreWhitespace }))}
            className="h-4 w-4 accent-violet-600"
          />
          忽略空格
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={options.ignoreCase}
            onChange={() => setOptions((current) => ({ ...current, ignoreCase: !current.ignoreCase }))}
            className="h-4 w-4 accent-violet-600"
          />
          忽略大小写
        </label>
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Left</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{result.leftSummary.lines} 行</p>
          <p className="mt-1">{result.leftSummary.characters} 字符</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Right</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{result.rightSummary.lines} 行</p>
          <p className="mt-1">{result.rightSummary.characters} 字符</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-500">Changes</p>
          <p className="mt-1 text-lg font-bold text-emerald-800">{stats.changes}</p>
          <p className="mt-1">修改行</p>
        </div>
        <div className="rounded-2xl bg-violet-50 p-4 text-sm text-violet-700">
          <p className="text-xs uppercase tracking-[0.18em] text-violet-500">Diff</p>
          <p className="mt-1 text-lg font-bold text-violet-800">{stats.additions + stats.deletions}</p>
          <p className="mt-1">增删行</p>
        </div>
      </div>

      {mode === "line" ? <LineCompareView rows={result.lineRows} /> : <CharCompareView leftChunks={result.charLeftChunks} rightChunks={result.charRightChunks} />}
    </section>
  );
}

function LineCompareView({ rows }: { rows: LineDiffRow[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200">
      <div className="grid grid-cols-[56px_1fr_56px_1fr] bg-slate-100 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <div className="px-3 py-3 text-center">#</div>
        <div className="border-l border-slate-200 px-3 py-3">左侧</div>
        <div className="border-l border-slate-200 px-3 py-3 text-center">#</div>
        <div className="border-l border-slate-200 px-3 py-3">右侧</div>
      </div>

      <div className="divide-y divide-slate-200 bg-white">
        {rows.map((row, index) => {
          const rowTone =
            row.type === "equal"
              ? "bg-white"
              : row.type === "change"
                ? "bg-amber-50"
                : row.type === "delete"
                  ? "bg-rose-50"
                  : "bg-emerald-50";

          return (
            <div key={`${row.type}-${index}`} className={`grid grid-cols-[56px_1fr_56px_1fr] text-sm ${rowTone}`}>
              <div className="px-3 py-3 text-center text-slate-400">{row.leftNumber ?? ""}</div>
              <div className="border-l border-slate-200 px-3 py-3 font-mono whitespace-pre-wrap text-slate-900">
                {row.type === "change" ? renderChunks(row.leftDiff, "left") : row.leftText ?? ""}
              </div>
              <div className="border-l border-slate-200 px-3 py-3 text-center text-slate-400">{row.rightNumber ?? ""}</div>
              <div className="border-l border-slate-200 px-3 py-3 font-mono whitespace-pre-wrap text-slate-900">
                {row.type === "change" ? renderChunks(row.rightDiff, "right") : row.rightText ?? ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CharCompareView({ leftChunks, rightChunks }: { leftChunks: DiffChunk[]; rightChunks: DiffChunk[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-slate-200 bg-rose-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">左侧字符对比</h3>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700">删除高亮</span>
        </div>
        <pre className="whitespace-pre-wrap break-words rounded-2xl bg-white p-4 font-mono text-sm leading-6 text-slate-900 shadow-sm">
          {renderChunks(leftChunks, "left")}
        </pre>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-emerald-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">右侧字符对比</h3>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">新增高亮</span>
        </div>
        <pre className="whitespace-pre-wrap break-words rounded-2xl bg-white p-4 font-mono text-sm leading-6 text-slate-900 shadow-sm">
          {renderChunks(rightChunks, "right")}
        </pre>
      </div>
    </div>
  );
}
