"use client";

import { useMemo, useState } from "react";

type NumBase = 2 | 8 | 10 | 16;

function parseByBase(input: string, base: NumBase): bigint {
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    throw new Error("请输入数字");
  }

  if (base === 10) {
    return BigInt(normalized);
  }

  const sign = normalized.startsWith("-") ? BigInt(-1) : BigInt(1);
  const body = normalized.replace(/^-/, "");
  const prefix = base === 16 ? "0x" : base === 8 ? "0o" : "0b";
  return sign * BigInt(prefix + body);
}

function formatByBase(value: bigint, base: NumBase): string {
  const sign = value < 0 ? "-" : "";
  const abs = value < 0 ? -value : value;
  return `${sign}${abs.toString(base)}`;
}

function toFloatBits(value: number): { binary32: string; binary64: string } {
  const buffer32 = new ArrayBuffer(4);
  const view32 = new DataView(buffer32);
  view32.setFloat32(0, value);
  const int32 = view32.getUint32(0);

  const buffer64 = new ArrayBuffer(8);
  const view64 = new DataView(buffer64);
  view64.setFloat64(0, value);
  const hi = view64.getUint32(0).toString(2).padStart(32, "0");
  const lo = view64.getUint32(4).toString(2).padStart(32, "0");

  return {
    binary32: int32.toString(2).padStart(32, "0"),
    binary64: `${hi}${lo}`,
  };
}

export function BaseConverterTool() {
  const [input, setInput] = useState("255");
  const [sourceBase, setSourceBase] = useState<NumBase>(10);
  const [bitA, setBitA] = useState("13");
  const [bitB, setBitB] = useState("7");
  const [floatInput, setFloatInput] = useState("3.14159");

  const converted = useMemo(() => {
    try {
      const parsed = parseByBase(input, sourceBase);
      return {
        decimal: formatByBase(parsed, 10),
        binary: formatByBase(parsed, 2),
        octal: formatByBase(parsed, 8),
        hex: formatByBase(parsed, 16).toUpperCase(),
        error: "",
      };
    } catch (error) {
      return {
        decimal: "",
        binary: "",
        octal: "",
        hex: "",
        error: error instanceof Error ? error.message : "转换失败",
      };
    }
  }, [input, sourceBase]);

  const bitwise = useMemo(() => {
    try {
      const a = BigInt(bitA || "0");
      const b = BigInt(bitB || "0");
      return {
        and: (a & b).toString(),
        or: (a | b).toString(),
        xor: (a ^ b).toString(),
        notA: (~a).toString(),
        error: "",
      };
    } catch {
      return {
        and: "",
        or: "",
        xor: "",
        notA: "",
        error: "位运算输入必须是整数",
      };
    }
  }, [bitA, bitB]);

  const floatBits = useMemo(() => {
    const number = Number.parseFloat(floatInput);
    if (Number.isNaN(number)) {
      return { binary32: "", binary64: "", error: "请输入有效浮点数" };
    }
    const bits = toFloatBits(number);
    return { ...bits, error: "" };
  }, [floatInput]);

  return (
    <section className="space-y-6">
      <article className="grid gap-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">进制转换</h2>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="输入数字"
          />
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={sourceBase}
            onChange={(event) => setSourceBase(Number.parseInt(event.target.value, 10) as NumBase)}
          >
            <option value={2}>输入是二进制</option>
            <option value={8}>输入是八进制</option>
            <option value={10}>输入是十进制</option>
            <option value={16}>输入是十六进制</option>
          </select>
          {converted.error ? <p className="text-sm text-rose-600">{converted.error}</p> : null}
        </div>

        <div className="grid gap-2 text-sm">
          <p>十进制：<span className="font-mono">{converted.decimal}</span></p>
          <p>二进制：<span className="font-mono">{converted.binary}</span></p>
          <p>八进制：<span className="font-mono">{converted.octal}</span></p>
          <p>十六进制：<span className="font-mono">{converted.hex}</span></p>
        </div>
      </article>

      <article className="grid gap-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">位运算</h2>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
            value={bitA}
            onChange={(event) => setBitA(event.target.value)}
            placeholder="操作数 A"
          />
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
            value={bitB}
            onChange={(event) => setBitB(event.target.value)}
            placeholder="操作数 B"
          />
          {bitwise.error ? <p className="text-sm text-rose-600">{bitwise.error}</p> : null}
        </div>
        <div className="grid gap-2 text-sm">
          <p>A AND B：<span className="font-mono">{bitwise.and}</span></p>
          <p>A OR B：<span className="font-mono">{bitwise.or}</span></p>
          <p>A XOR B：<span className="font-mono">{bitwise.xor}</span></p>
          <p>NOT A：<span className="font-mono">{bitwise.notA}</span></p>
        </div>
      </article>

      <article className="space-y-3 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">浮点数二进制表示</h2>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
          value={floatInput}
          onChange={(event) => setFloatInput(event.target.value)}
          placeholder="例如 3.14159"
        />
        {floatBits.error ? <p className="text-sm text-rose-600">{floatBits.error}</p> : null}
        <p className="text-sm">Float32：<span className="break-all font-mono">{floatBits.binary32}</span></p>
        <p className="text-sm">Float64：<span className="break-all font-mono">{floatBits.binary64}</span></p>
      </article>
    </section>
  );
}
