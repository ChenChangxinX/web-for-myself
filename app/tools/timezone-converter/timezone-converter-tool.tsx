"use client";

import { useMemo, useState } from "react";

const timezoneOptions = [
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

function formatInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function hourInTimeZone(date: Date, timeZone: string): number {
  const value = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).format(date);
  return Number.parseInt(value, 10);
}

export function TimezoneConverterTool() {
  const [baseDateTime, setBaseDateTime] = useState(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  });
  const [selectedZones, setSelectedZones] = useState<string[]>([
    "Asia/Shanghai",
    "Europe/London",
    "America/New_York",
  ]);
  const [nextZone, setNextZone] = useState("Asia/Tokyo");

  const baseDate = useMemo(() => new Date(baseDateTime), [baseDateTime]);

  const converted = useMemo(
    () =>
      selectedZones.map((zone) => ({
        zone,
        formatted: formatInTimeZone(baseDate, zone),
        hour: hourInTimeZone(baseDate, zone),
      })),
    [baseDate, selectedZones],
  );

  const suggestions = useMemo(() => {
    const result: string[] = [];
    for (let utcHour = 6; utcHour <= 22; utcHour += 1) {
      const probe = new Date(baseDate);
      probe.setUTCHours(utcHour, 0, 0, 0);

      const allComfortable = selectedZones.every((zone) => {
        const localHour = hourInTimeZone(probe, zone);
        return localHour >= 8 && localHour <= 21;
      });

      if (allComfortable) {
        result.push(`UTC ${String(utcHour).padStart(2, "0")}:00`);
      }
    }

    return result;
  }, [baseDate, selectedZones]);

  function addZone() {
    if (!nextZone || selectedZones.includes(nextZone)) {
      return;
    }
    setSelectedZones((current) => [...current, nextZone]);
  }

  function removeZone(zone: string) {
    setSelectedZones((current) => current.filter((item) => item !== zone));
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">时区换算</h2>
        <label className="text-sm font-semibold text-slate-700" htmlFor="datetime-input">
          基准时间
        </label>
        <input
          id="datetime-input"
          type="datetime-local"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={baseDateTime}
          onChange={(event) => setBaseDateTime(event.target.value)}
        />

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={nextZone}
            onChange={(event) => setNextZone(event.target.value)}
          >
            {timezoneOptions.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addZone}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            添加时区
          </button>
        </div>

        <ul className="space-y-3">
          {converted.map((item) => (
            <li key={item.zone} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="font-semibold text-slate-900">{item.zone}</p>
                <p className="text-sm text-slate-600">{item.formatted}</p>
              </div>
              <button
                type="button"
                onClick={() => removeZone(item.zone)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
              >
                移除
              </button>
            </li>
          ))}
        </ul>
      </article>

      <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">会议时间建议</h2>
        <p className="text-sm text-slate-600">建议范围：所有参会时区本地时间都在 08:00 - 21:00。</p>
        {suggestions.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {suggestions.map((item) => (
              <li key={item} className="rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">当前时区组合下没有共同舒适时段。</p>
        )}
      </article>
    </section>
  );
}
