"use client";

import { useMemo, useState } from "react";
import { dump, load } from "js-yaml";

type Mode = "json-to-yaml" | "yaml-to-json" | "csv-to-json" | "json-to-csv";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function csvToJson(input: string): string {
  const rows = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length < 2) {
    throw new Error("CSV 至少需要表头和一行数据");
  }

  const headers = parseCsvLine(rows[0]);
  const data = rows.slice(1).map((row) => {
    const cells = parseCsvLine(row);
    const item: Record<string, string> = {};
    headers.forEach((header, index) => {
      item[header] = cells[index] ?? "";
    });
    return item;
  });

  return JSON.stringify(data, null, 2);
}

function escapeCsvValue(value: unknown): string {
  const normalized = String(value ?? "");
  if (normalized.includes(",") || normalized.includes('"') || normalized.includes("\n")) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }
  return normalized;
}

function jsonToCsv(input: string): string {
  const parsed = JSON.parse(input) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0 || typeof parsed[0] !== "object" || parsed[0] === null) {
    throw new Error("JSON 转 CSV 需要对象数组，例如 [{\"name\":\"A\"}]");
  }

  const rows = parsed as Record<string, unknown>[];
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const headerLine = headers.map(escapeCsvValue).join(",");
  const dataLines = rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(","));
  return [headerLine, ...dataLines].join("\n");
}

function convertText(mode: Mode, input: string): string {
  if (mode === "json-to-yaml") {
    const jsonObject = JSON.parse(input) as unknown;
    return dump(jsonObject, { indent: 2, noRefs: true }).trim();
  }

  if (mode === "yaml-to-json") {
    const yamlObject = load(input);
    return JSON.stringify(yamlObject, null, 2);
  }

  if (mode === "csv-to-json") {
    return csvToJson(input);
  }

  return jsonToCsv(input);
}

const modeLabel: Record<Mode, string> = {
  "json-to-yaml": "JSON -> YAML",
  "yaml-to-json": "YAML -> JSON",
  "csv-to-json": "CSV -> JSON",
  "json-to-csv": "JSON -> CSV",
};

export function FileFormatConverterTool() {
  const [mode, setMode] = useState<Mode>("json-to-yaml");
  const [input, setInput] = useState('{\n  "name": "Alice",\n  "role": "developer"\n}');
  const [output, setOutput] = useState("");
  const [batchInput, setBatchInput] = useState("");
  const [batchOutput, setBatchOutput] = useState("");
  const [error, setError] = useState("");

  const placeholder = useMemo(() => {
    if (mode === "yaml-to-json") {
      return "name: Alice\nrole: developer";
    }
    if (mode === "csv-to-json") {
      return "name,role\nAlice,developer\nBob,designer";
    }
    if (mode === "json-to-csv") {
      return '[{"name":"Alice","role":"developer"}]';
    }
    return '{\n  "name": "Alice",\n  "role": "developer"\n}';
  }, [mode]);

  function runConvert() {
    try {
      const result = convertText(mode, input);
      setOutput(result);
      setError("");
    } catch (conversionError) {
      setError(conversionError instanceof Error ? conversionError.message : "转换失败");
      setOutput("");
    }
  }

  function runBatchConvert() {
    const items = batchInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (items.length === 0) {
      setBatchOutput("");
      return;
    }

    const converted = items.map((item, index) => {
      try {
        return `#${index + 1}\n${convertText(mode, item)}`;
      } catch (conversionError) {
        const message = conversionError instanceof Error ? conversionError.message : "转换失败";
        return `#${index + 1}\nERROR: ${message}`;
      }
    });

    setBatchOutput(converted.join("\n\n"));
  }

  async function copyOutput(value: string) {
    if (!value.trim()) {
      return;
    }
    await navigator.clipboard.writeText(value);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">单条转换</h2>
        <label className="text-sm font-semibold text-slate-700" htmlFor="mode-select">
          转换模式
        </label>
        <select
          id="mode-select"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          value={mode}
          onChange={(event) => setMode(event.target.value as Mode)}
        >
          {(Object.keys(modeLabel) as Mode[]).map((item) => (
            <option key={item} value={item}>
              {modeLabel[item]}
            </option>
          ))}
        </select>

        <textarea
          className="h-52 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm"
          value={input}
          placeholder={placeholder}
          onChange={(event) => setInput(event.target.value)}
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runConvert}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            开始转换
          </button>
          <button
            type="button"
            onClick={() => copyOutput(output)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            复制结果
          </button>
        </div>

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        <textarea
          className="h-52 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm"
          value={output}
          readOnly
          placeholder="转换结果会显示在这里"
        />
      </article>

      <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">批量转换（每行一条）</h2>
        <p className="text-sm text-slate-600">适合快速处理多条 JSON/YAML/CSV 片段，逐行转换并保留序号。</p>

        <textarea
          className="h-52 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm"
          value={batchInput}
          placeholder="每行输入一条待转换文本"
          onChange={(event) => setBatchInput(event.target.value)}
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runBatchConvert}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            批量转换
          </button>
          <button
            type="button"
            onClick={() => copyOutput(batchOutput)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            复制批量结果
          </button>
        </div>

        <textarea
          className="h-52 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm"
          value={batchOutput}
          readOnly
          placeholder="批量结果会显示在这里"
        />
      </article>
    </section>
  );
}
