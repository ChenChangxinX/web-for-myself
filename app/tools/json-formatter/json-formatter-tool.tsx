"use client";

import { useMemo, useState } from "react";
import { JSONPath } from "jsonpath-plus";
import { dump } from "js-yaml";
import { XMLBuilder } from "fast-xml-parser";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function highlightJson(value: string) {
  const escaped = escapeHtml(value);
  return escaped.replace(
    /(\"(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\\"])*\"\s*:?)|\b(true|false|null)\b|\b-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?\b/g,
    (token) => {
      if (token.startsWith('"')) {
        if (token.endsWith(":")) {
          return `<span class=\"text-cyan-700\">${token}</span>`;
        }
        return `<span class=\"text-emerald-700\">${token}</span>`;
      }

      if (token === "true" || token === "false") {
        return `<span class=\"text-violet-700\">${token}</span>`;
      }

      if (token === "null") {
        return `<span class=\"text-slate-500\">${token}</span>`;
      }

      return `<span class=\"text-amber-700\">${token}</span>`;
    },
  );
}

function getErrorPosition(message: string, source: string) {
  const match = message.match(/position\s+(\d+)/i);
  if (!match) {
    return null;
  }

  const position = Number.parseInt(match[1], 10);
  if (Number.isNaN(position) || position < 0) {
    return null;
  }

  let line = 1;
  let column = 1;

  for (let index = 0; index < Math.min(position, source.length); index += 1) {
    if (source[index] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return { line, column, position };
}

function isObjectValue(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatValueLabel(value: JsonValue) {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return `Array(${value.length})`;
  }

  if (isObjectValue(value)) {
    return `Object(${Object.keys(value).length})`;
  }

  if (typeof value === "string") {
    return `\"${value}\"`;
  }

  return String(value);
}

function JsonTreeNode({
  value,
  nodeKey,
  defaultExpanded,
  level,
}: {
  value: JsonValue;
  nodeKey: string;
  defaultExpanded: boolean;
  level: number;
}) {
  const [open, setOpen] = useState(defaultExpanded || level < 1);

  if (!Array.isArray(value) && !isObjectValue(value)) {
    const primitiveClass =
      value === null
        ? "text-slate-500"
        : typeof value === "string"
          ? "text-emerald-700"
          : typeof value === "number"
            ? "text-amber-700"
            : "text-violet-700";

    return <span className={`font-mono text-sm ${primitiveClass}`}>{formatValueLabel(value)}</span>;
  }

  const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const) : Object.entries(value);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        <span className="text-xs text-slate-500">{open ? "▼" : "▶"}</span>
        <span>{formatValueLabel(value)}</span>
      </button>

      {open ? (
        <div className="space-y-1 border-l border-slate-200 pl-4">
          {entries.map(([key, child]) => (
            <div key={`${nodeKey}-${key}`} className="flex items-start gap-2">
              <span className="pt-0.5 font-mono text-xs text-cyan-700">{Array.isArray(value) ? `[${key}]` : key}</span>
              <JsonTreeNode value={child} nodeKey={`${nodeKey}-${key}`} defaultExpanded={defaultExpanded} level={level + 1} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function JsonFormatterTool() {
  const [input, setInput] = useState(`{
  "name": "web-for-myself",
  "version": 1,
  "active": true,
  "features": ["json-format", "jsonpath", "convert"],
  "owner": {
    "id": 1001,
    "role": "admin"
  }
}`);
  const [parsedJson, setParsedJson] = useState<JsonValue | null>(null);
  const [formattedJson, setFormattedJson] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorPosition, setErrorPosition] = useState<{ line: number; column: number } | null>(null);
  const [treeExpandAll, setTreeExpandAll] = useState(false);
  const [treeVersion, setTreeVersion] = useState(0);
  const [jsonPathExpression, setJsonPathExpression] = useState("$.owner.role");
  const [jsonPathResult, setJsonPathResult] = useState("");
  const [yamlOutput, setYamlOutput] = useState("");
  const [xmlOutput, setXmlOutput] = useState("");
  const [statusMessage, setStatusMessage] = useState("等待格式化");

  const highlighted = useMemo(() => (formattedJson ? highlightJson(formattedJson) : ""), [formattedJson]);

  function parseInput() {
    try {
      const parsed = JSON.parse(input) as JsonValue;
      const pretty = JSON.stringify(parsed, null, 2);

      setParsedJson(parsed);
      setFormattedJson(pretty);
      setInput(pretty);
      setErrorMessage("");
      setErrorPosition(null);
      setStatusMessage("JSON 校验通过，已格式化");

      return parsed;
    } catch (error) {
      const message = error instanceof Error ? error.message : "JSON 解析失败";
      const position = getErrorPosition(message, input);

      setParsedJson(null);
      setFormattedJson("");
      setErrorMessage(message);
      setErrorPosition(position ? { line: position.line, column: position.column } : null);
      setStatusMessage("JSON 格式错误，请修复后重试");
      return null;
    }
  }

  function validateOnly() {
    try {
      JSON.parse(input);
      setErrorMessage("");
      setErrorPosition(null);
      setStatusMessage("JSON 校验通过");
    } catch (error) {
      const message = error instanceof Error ? error.message : "JSON 解析失败";
      const position = getErrorPosition(message, input);
      setErrorMessage(message);
      setErrorPosition(position ? { line: position.line, column: position.column } : null);
      setStatusMessage("JSON 校验失败");
    }
  }

  function minify() {
    try {
      const parsed = JSON.parse(input) as JsonValue;
      const compact = JSON.stringify(parsed);
      setParsedJson(parsed);
      setFormattedJson(JSON.stringify(parsed, null, 2));
      setInput(compact);
      setErrorMessage("");
      setErrorPosition(null);
      setStatusMessage("已压缩 JSON");
    } catch (error) {
      const message = error instanceof Error ? error.message : "JSON 解析失败";
      setErrorMessage(message);
      setStatusMessage("压缩失败，请检查 JSON");
    }
  }

  async function copyText(value: string) {
    if (!value.trim()) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setStatusMessage("已复制到剪贴板");
  }

  function toggleTree(expand: boolean) {
    setTreeExpandAll(expand);
    setTreeVersion((current) => current + 1);
  }

  function runJsonPath() {
    if (!parsedJson) {
      setJsonPathResult("请先格式化或校验成功");
      return;
    }

    try {
      const result = JSONPath({ path: jsonPathExpression, json: parsedJson as object, wrap: true });
      setJsonPathResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setJsonPathResult(error instanceof Error ? error.message : "JSONPath 查询失败");
    }
  }

  function convertToYamlAndXml() {
    if (!parsedJson) {
      setStatusMessage("请先完成 JSON 格式化");
      return;
    }

    try {
      const yaml = dump(parsedJson, {
        lineWidth: 120,
        noRefs: true,
      });

      const builder = new XMLBuilder({
        format: true,
        ignoreAttributes: false,
        suppressEmptyNode: true,
      });

      const xml = builder.build({ root: parsedJson });

      setYamlOutput(yaml);
      setXmlOutput(xml);
      setStatusMessage("已转换为 YAML 和 XML");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "转换失败");
    }
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">JSON 输入</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={parseInput} className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">
                格式化
              </button>
              <button type="button" onClick={validateOnly} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                校验
              </button>
              <button type="button" onClick={minify} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                压缩
              </button>
            </div>
          </div>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-80 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-900 outline-none focus:border-cyan-300"
            placeholder="粘贴 JSON 数据"
          />

          <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
            <p>状态：{statusMessage}</p>
            {errorMessage ? <p className="mt-1 text-rose-700">错误：{errorMessage}</p> : null}
            {errorPosition ? (
              <p className="mt-1 text-rose-700">
                位置：第 {errorPosition.line} 行，第 {errorPosition.column} 列
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">格式化预览（语法高亮）</h2>
            <button
              type="button"
              onClick={() => copyText(formattedJson || input)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              复制
            </button>
          </div>

          <pre className="min-h-80 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-800">
            {highlighted ? <code dangerouslySetInnerHTML={{ __html: highlighted }} /> : <code className="text-slate-400">等待格式化结果</code>}
          </pre>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">树形查看（可折叠）</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleTree(true)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                全部展开
              </button>
              <button
                type="button"
                onClick={() => toggleTree(false)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                全部折叠
              </button>
            </div>
          </div>

          <div className="min-h-64 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            {parsedJson ? (
              <div key={`${treeExpandAll ? "expand" : "collapse"}-${treeVersion}`}>
                <JsonTreeNode value={parsedJson} nodeKey="root" defaultExpanded={treeExpandAll} level={0} />
              </div>
            ) : (
              <p className="text-sm text-slate-500">先完成 JSON 格式化，即可在这里查看可折叠树结构。</p>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">JSONPath 查询</h2>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={jsonPathExpression}
              onChange={(event) => setJsonPathExpression(event.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
              placeholder="例如 $.owner.role 或 $.features[0]"
            />
            <button
              type="button"
              onClick={runJsonPath}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              查询
            </button>
          </div>
          <pre className="min-h-64 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-800">
            {jsonPathResult || "查询结果会显示在这里"}
          </pre>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">JSON 转换</h2>
          <button
            type="button"
            onClick={convertToYamlAndXml}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            转换为 YAML / XML
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-700">YAML</h3>
              <button
                type="button"
                onClick={() => copyText(yamlOutput)}
                disabled={!yamlOutput}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                复制
              </button>
            </div>
            <pre className="min-h-56 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-800">
              {yamlOutput || "暂无 YAML 结果"}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-700">XML</h3>
              <button
                type="button"
                onClick={() => copyText(xmlOutput)}
                disabled={!xmlOutput}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                复制
              </button>
            </div>
            <pre className="min-h-56 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-800">
              {xmlOutput || "暂无 XML 结果"}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
