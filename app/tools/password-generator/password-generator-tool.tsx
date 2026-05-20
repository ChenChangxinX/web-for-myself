"use client";

import { useEffect, useMemo, useState } from "react";

type CharacterOptions = {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
};

type HistoryItem = {
  password: string;
  strengthLabel: string;
  strengthScore: number;
  createdAt: string;
};

const STORAGE_KEY = "web-for-myself-password-history";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/|~";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const HISTORY_LIMIT = 12;

function randomInt(max: number) {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % max;
}

function shuffleText(input: string) {
  const chars = input.split("");
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]];
  }
  return chars.join("");
}

function buildPool(options: CharacterOptions) {
  const pools: Array<{ chars: string; required: boolean }> = [];

  if (options.lowercase) {
    pools.push({ chars: LOWERCASE, required: true });
  }

  if (options.uppercase) {
    pools.push({ chars: UPPERCASE, required: true });
  }

  if (options.numbers) {
    pools.push({ chars: NUMBERS, required: true });
  }

  if (options.symbols) {
    pools.push({ chars: SYMBOLS, required: true });
  }

  return pools;
}

function calculateStrength(password: string, options: CharacterOptions) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (options.lowercase && options.uppercase) score += 1;
  if (options.numbers) score += 1;
  if (options.symbols) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  if ((password.match(/(.)\1{2,}/g) ?? []).length === 0) score += 1;

  const cappedScore = Math.min(score, 8);

  if (cappedScore <= 2) {
    return { score: cappedScore, label: "弱" };
  }

  if (cappedScore <= 5) {
    return { score: cappedScore, label: "中等" };
  }

  return { score: cappedScore, label: "强" };
}

function createPassword(length: number, options: CharacterOptions) {
  const pools = buildPool(options);

  if (!pools.length) {
    return { password: "", reason: "至少选择一种字符类型" };
  }

  const effectiveLength = Math.max(length, pools.length);
  const requiredChars = pools.map((pool) => pool.chars[randomInt(pool.chars.length)]);
  const remainingLength = effectiveLength - requiredChars.length;
  const allChars = pools.map((pool) => pool.chars).join("");

  const extraChars = Array.from({ length: remainingLength }, () => allChars[randomInt(allChars.length)]);
  const password = shuffleText([...requiredChars, ...extraChars].join(""));

  return { password };
}

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as HistoryItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => typeof item.password === "string" && typeof item.strengthLabel === "string");
  } catch {
    return [];
  }
}

export function PasswordGeneratorTool() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState<CharacterOptions>({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState({ score: 0, label: "未生成" });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [message, setMessage] = useState("等待生成密码");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHistory(loadHistory());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!history.length) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const selectedTypes = useMemo(
    () => Object.values(options).filter(Boolean).length,
    [options],
  );

  function handleOptionChange(key: keyof CharacterOptions) {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  }

  function generate() {
    const result = createPassword(length, options);

    if (!result.password) {
      setMessage(result.reason ?? "无法生成密码");
      setPassword("");
      setStrength({ score: 0, label: "未生成" });
      return;
    }

    const nextPassword = result.password;
    const nextStrength = calculateStrength(nextPassword, options);
    const historyItem: HistoryItem = {
      password: nextPassword,
      strengthLabel: nextStrength.label,
      strengthScore: nextStrength.score,
      createdAt: new Date().toISOString(),
    };

    setPassword(nextPassword);
    setStrength(nextStrength);
    setMessage("密码已生成");
    setHistory((current) => [historyItem, ...current].slice(0, HISTORY_LIMIT));
  }

  async function copyPassword() {
    if (!password) {
      return;
    }

    await navigator.clipboard.writeText(password);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1500);
  }

  function applyHistoryItem(item: HistoryItem) {
    setPassword(item.password);
    setStrength({ score: item.strengthScore, label: item.strengthLabel });
    setMessage("已加载历史密码");
  }

  const strengthWidth = `${(strength.score / 8) * 100}%`;

  return (
    <section className="grid gap-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm lg:grid-cols-[1.02fr_0.98fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Generator
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">生成参数</h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              已选择 {selectedTypes} 类字符
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
                <span>长度</span>
                <span className="font-semibold text-slate-900">{length}</span>
              </div>
              <input
                type="range"
                min={8}
                max={32}
                value={length}
                onChange={(event) => setLength(Number(event.target.value))}
                className="w-full accent-emerald-600"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["uppercase", "包含大写字母"],
                ["lowercase", "包含小写字母"],
                ["numbers", "包含数字"],
                ["symbols", "包含符号"],
              ].map(([key, label]) => {
                const optionKey = key as keyof CharacterOptions;

                return (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 transition hover:border-emerald-300"
                  >
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={options[optionKey]}
                      onChange={() => handleOptionChange(optionKey)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                  </label>
                );
              })}
            </div>

            <button
              type="button"
              onClick={generate}
              className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              生成密码
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">History</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">生成历史</h3>
          <div className="mt-4 space-y-3">
            {history.length ? (
              history.map((item) => (
                <button
                  key={`${item.password}-${item.createdAt}`}
                  type="button"
                  onClick={() => applyHistoryItem(item)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <code className="break-all text-xs text-slate-700">{item.password}</code>
                    <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      {item.strengthLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString("zh-CN")}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                暂无历史记录，生成一次密码后这里会保留最近 12 条。
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-black/10 bg-slate-900 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">Password</p>
          <div className="mt-4 break-all rounded-2xl border border-white/10 bg-white/5 p-4 font-mono text-lg leading-8">
            {password || "点击生成密码"}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copyPassword}
              disabled={!password}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copyState === "copied" ? "已复制" : "一键复制"}
            </button>
            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm text-white/90">
              {message}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">密码强度</h3>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              {strength.label}
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: strengthWidth }} />
          </div>

          <ul className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <li>长度：{length} 位</li>
            <li>大写：{options.uppercase ? "是" : "否"}</li>
            <li>小写：{options.lowercase ? "是" : "否"}</li>
            <li>数字：{options.numbers ? "是" : "否"}</li>
            <li>符号：{options.symbols ? "是" : "否"}</li>
            <li>历史保留：最近 12 条</li>
          </ul>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            建议至少勾选 3 类字符并将长度设置为 12 位以上，以获得更高安全等级。
          </p>
        </div>
      </div>
    </section>
  );
}
