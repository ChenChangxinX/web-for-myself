"use client";

import { useMemo, useState } from "react";

type Category = "length" | "weight" | "temperature" | "currency";

type UnitMap = Record<string, number>;

type CustomUnit = {
  id: string;
  category: "length" | "weight";
  name: string;
  factorToBase: number;
};

const lengthUnits: UnitMap = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  inch: 0.0254,
  ft: 0.3048,
  yard: 0.9144,
  mile: 1609.344,
};

const weightUnits: UnitMap = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  ton: 1000000,
  oz: 28.349523,
  lb: 453.59237,
};

const defaultRates: Record<string, number> = {
  USD: 1,
  CNY: 7.2,
  EUR: 0.92,
  JPY: 156,
  GBP: 0.79,
  HKD: 7.82,
};

function convertTemperature(value: number, from: string, to: string) {
  const toCelsius = (v: number, unit: string) => {
    if (unit === "C") return v;
    if (unit === "F") return ((v - 32) * 5) / 9;
    return v - 273.15;
  };

  const fromCelsius = (v: number, unit: string) => {
    if (unit === "C") return v;
    if (unit === "F") return (v * 9) / 5 + 32;
    return v + 273.15;
  };

  return fromCelsius(toCelsius(value, from), to);
}

export function UnitConverterTool() {
  const [category, setCategory] = useState<Category>("length");
  const [inputValue, setInputValue] = useState("1");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("cm");
  const [currencyRates, setCurrencyRates] = useState(defaultRates);
  const [rateStatus, setRateStatus] = useState("当前使用默认汇率（基准 USD）");

  const [customCategory, setCustomCategory] = useState<"length" | "weight">("length");
  const [customName, setCustomName] = useState("");
  const [customFactor, setCustomFactor] = useState("1");
  const [customUnits, setCustomUnits] = useState<CustomUnit[]>([]);

  const mergedLengthUnits = useMemo(() => {
    const custom = customUnits.filter((item) => item.category === "length").reduce((map, item) => ({ ...map, [item.name]: item.factorToBase }), {} as UnitMap);
    return { ...lengthUnits, ...custom };
  }, [customUnits]);

  const mergedWeightUnits = useMemo(() => {
    const custom = customUnits.filter((item) => item.category === "weight").reduce((map, item) => ({ ...map, [item.name]: item.factorToBase }), {} as UnitMap);
    return { ...weightUnits, ...custom };
  }, [customUnits]);

  const fromUnitOptions = useMemo(() => {
    if (category === "length") return Object.keys(mergedLengthUnits);
    if (category === "weight") return Object.keys(mergedWeightUnits);
    if (category === "temperature") return ["C", "F", "K"];
    return Object.keys(currencyRates);
  }, [category, currencyRates, mergedLengthUnits, mergedWeightUnits]);

  const result = useMemo(() => {
    const value = Number(inputValue);
    if (Number.isNaN(value)) {
      return "请输入有效数字";
    }

    if (category === "length") {
      const from = mergedLengthUnits[fromUnit];
      const to = mergedLengthUnits[toUnit];
      if (!from || !to) return "请选择单位";
      return ((value * from) / to).toString();
    }

    if (category === "weight") {
      const from = mergedWeightUnits[fromUnit];
      const to = mergedWeightUnits[toUnit];
      if (!from || !to) return "请选择单位";
      return ((value * from) / to).toString();
    }

    if (category === "temperature") {
      return convertTemperature(value, fromUnit, toUnit).toString();
    }

    const fromRate = currencyRates[fromUnit];
    const toRate = currencyRates[toUnit];
    if (!fromRate || !toRate) return "请选择货币";
    const usdValue = value / fromRate;
    return (usdValue * toRate).toString();
  }, [category, currencyRates, fromUnit, inputValue, mergedLengthUnits, mergedWeightUnits, toUnit]);

  async function refreshRates() {
    setRateStatus("正在更新汇率...");
    try {
      const response = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = (await response.json()) as { result?: string; rates?: Record<string, number> };

      if (data.result !== "success" || !data.rates) {
        throw new Error("汇率接口返回异常");
      }

      setCurrencyRates(data.rates);
      setRateStatus("汇率已更新（基准 USD）");
    } catch (error) {
      setRateStatus(error instanceof Error ? error.message : "汇率更新失败，已保留本地默认汇率");
    }
  }

  function addCustomUnit() {
    const factor = Number(customFactor);
    if (!customName.trim() || Number.isNaN(factor) || factor <= 0) {
      return;
    }

    setCustomUnits((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        category: customCategory,
        name: customName.trim(),
        factorToBase: factor,
      },
    ]);

    setCustomName("");
    setCustomFactor("1");
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="grid gap-4 lg:grid-cols-4">
          <label className="text-sm text-slate-700">分类<select value={category} onChange={(event) => {
            const next = event.target.value as Category;
            setCategory(next);
            if (next === "length") {
              setFromUnit("m");
              setToUnit("cm");
            }
            if (next === "weight") {
              setFromUnit("kg");
              setToUnit("g");
            }
            if (next === "temperature") {
              setFromUnit("C");
              setToUnit("F");
            }
            if (next === "currency") {
              setFromUnit("USD");
              setToUnit("CNY");
            }
          }} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"><option value="length">长度</option><option value="weight">重量</option><option value="temperature">温度</option><option value="currency">货币</option></select></label>
          <label className="text-sm text-slate-700">输入值<input value={inputValue} onChange={(event) => setInputValue(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></label>
          <label className="text-sm text-slate-700">从<select value={fromUnit} onChange={(event) => setFromUnit(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none">{fromUnitOptions.map((unit) => <option key={`from-${unit}`} value={unit}>{unit}</option>)}</select></label>
          <label className="text-sm text-slate-700">到<select value={toUnit} onChange={(event) => setToUnit(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none">{fromUnitOptions.map((unit) => <option key={`to-${unit}`} value={unit}>{unit}</option>)}</select></label>
        </div>

        <p className="mt-4 text-2xl font-bold text-slate-900">结果：{result}</p>

        {category === "currency" ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void refreshRates()} className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white">更新实时汇率</button>
            <p className="text-sm text-slate-600">{rateStatus}</p>
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold text-slate-900">自定义单位（长度/重量）</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-[140px_1fr_160px_auto]">
          <select value={customCategory} onChange={(event) => setCustomCategory(event.target.value as "length" | "weight")} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"><option value="length">长度</option><option value="weight">重量</option></select>
          <input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="单位名，例如 chi 或 jin" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none" />
          <input value={customFactor} onChange={(event) => setCustomFactor(event.target.value)} placeholder="换算到基准单位" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none" />
          <button type="button" onClick={addCustomUnit} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">添加</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">长度基准单位是 m，重量基准单位是 g。</p>

        {customUnits.length ? (
          <div className="mt-3 space-y-2">
            {customUnits.map((unit) => (
              <div key={unit.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                <span>{unit.category === "length" ? "长度" : "重量"} - {unit.name}（1 {unit.name} = {unit.factorToBase} {unit.category === "length" ? "m" : "g"}）</span>
                <button type="button" onClick={() => setCustomUnits((current) => current.filter((item) => item.id !== unit.id))} className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700">删除</button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
