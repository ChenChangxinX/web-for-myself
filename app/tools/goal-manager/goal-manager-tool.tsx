"use client";

import { useEffect, useMemo, useState } from "react";

type GoalType = "long" | "short";

interface GoalSubtask {
  id: string;
  text: string;
  done: boolean;
}

interface GoalKr {
  id: string;
  text: string;
  target: number;
  current: number;
}

interface GoalItem {
  id: string;
  title: string;
  type: GoalType;
  deadline: string;
  objective: string;
  subtasks: GoalSubtask[];
  krs: GoalKr[];
  createdAt: string;
}

const STORAGE_KEY = "web-for-myself-goal-manager";

function loadGoals() {
  if (typeof window === "undefined") {
    return [] as GoalItem[];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as GoalItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function progressOfGoal(goal: GoalItem) {
  const taskPart = goal.subtasks.length === 0 ? 0 : goal.subtasks.filter((item) => item.done).length / goal.subtasks.length;
  const krPart =
    goal.krs.length === 0
      ? 0
      : goal.krs.reduce((sum, item) => sum + Math.min(1, item.target <= 0 ? 0 : item.current / item.target), 0) / goal.krs.length;
  if (goal.subtasks.length === 0 && goal.krs.length === 0) {
    return 0;
  }
  if (goal.subtasks.length === 0) {
    return krPart;
  }
  if (goal.krs.length === 0) {
    return taskPart;
  }
  return taskPart * 0.5 + krPart * 0.5;
}

export function GoalManagerTool() {
  const [goals, setGoals] = useState<GoalItem[]>(() => loadGoals());
  const [title, setTitle] = useState("");
  const [type, setType] = useState<GoalType>("long");
  const [deadline, setDeadline] = useState("");
  const [objective, setObjective] = useState("");
  const [reportText, setReportText] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  const summary = useMemo(() => {
    const longCount = goals.filter((item) => item.type === "long").length;
    const shortCount = goals.length - longCount;
    const avg = goals.length === 0 ? 0 : Math.round((goals.reduce((sum, item) => sum + progressOfGoal(item), 0) / goals.length) * 100);
    return { longCount, shortCount, avg };
  }, [goals]);

  function addGoal() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      return;
    }
    const goal: GoalItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      title: nextTitle,
      type,
      deadline,
      objective: objective.trim(),
      subtasks: [],
      krs: [],
      createdAt: new Date().toISOString(),
    };
    setGoals((current) => [goal, ...current]);
    setTitle("");
    setObjective("");
  }

  function addSubtask(goalId: string) {
    const text = window.prompt("输入子任务");
    if (!text || !text.trim()) {
      return;
    }
    setGoals((current) =>
      current.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              subtasks: [...goal.subtasks, { id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`, text: text.trim(), done: false }],
            }
          : goal,
      ),
    );
  }

  function toggleSubtask(goalId: string, subtaskId: string) {
    setGoals((current) =>
      current.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              subtasks: goal.subtasks.map((item) => (item.id === subtaskId ? { ...item, done: !item.done } : item)),
            }
          : goal,
      ),
    );
  }

  function addKr(goalId: string) {
    const text = window.prompt("输入 KR 名称");
    if (!text || !text.trim()) {
      return;
    }
    const targetInput = window.prompt("输入 KR 目标值", "100") ?? "100";
    const target = Number(targetInput);
    if (!Number.isFinite(target) || target <= 0) {
      return;
    }
    setGoals((current) =>
      current.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              krs: [...goal.krs, { id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`, text: text.trim(), target, current: 0 }],
            }
          : goal,
      ),
    );
  }

  function updateKrValue(goalId: string, krId: string, value: number) {
    setGoals((current) =>
      current.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              krs: goal.krs.map((kr) => (kr.id === krId ? { ...kr, current: Math.max(0, value) } : kr)),
            }
          : goal,
      ),
    );
  }

  function generateReport() {
    const lines = [
      `目标达成报告（${new Date().toLocaleDateString("zh-CN")})`,
      "",
      `长期目标：${summary.longCount} 个`,
      `短期目标：${summary.shortCount} 个`,
      `平均完成度：${summary.avg}%`,
      "",
      "目标详情：",
    ];

    goals.forEach((goal, index) => {
      const percent = Math.round(progressOfGoal(goal) * 100);
      lines.push(`${index + 1}. ${goal.title}（${goal.type === "long" ? "长期" : "短期"}）- ${percent}%`);
      if (goal.objective) {
        lines.push(`   Objective: ${goal.objective}`);
      }
      if (goal.deadline) {
        lines.push(`   截止日期: ${goal.deadline}`);
      }
      lines.push(`   子任务完成: ${goal.subtasks.filter((item) => item.done).length}/${goal.subtasks.length}`);
      lines.push(`   KR 完成: ${goal.krs.length}`);
    });

    const text = lines.join("\n");
    setReportText(text);
  }

  function downloadReport() {
    if (!reportText) {
      return;
    }
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `goal-report-${Date.now()}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">长期目标</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{summary.longCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">短期目标</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{summary.shortCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">平均完成度</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{summary.avg}%</p>
        </div>
      </div>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">新增目标</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="目标标题" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <select value={type} onChange={(event) => setType(event.target.value as GoalType)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <option value="long">长期目标</option>
            <option value="short">短期目标</option>
          </select>
          <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <input
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            placeholder="Objective（可选）"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </div>
        <button type="button" onClick={addGoal} className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
          创建目标
        </button>
      </article>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900">目标拆解与 OKR</h3>
          <button type="button" onClick={generateReport} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">
            生成达成报告
          </button>
        </div>
        <ul className="space-y-4">
          {goals.map((goal) => {
            const progress = Math.round(progressOfGoal(goal) * 100);
            return (
              <li key={goal.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{goal.title}</p>
                    <p className="text-xs text-slate-500">
                      {goal.type === "long" ? "长期目标" : "短期目标"}
                      {goal.deadline ? ` · 截止 ${goal.deadline}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{progress}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-violet-500" style={{ width: `${progress}%` }} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => addSubtask(goal.id)} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
                    添加子任务
                  </button>
                  <button type="button" onClick={() => addKr(goal.id)} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    添加 KR
                  </button>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">子任务</p>
                    <ul className="space-y-2">
                      {goal.subtasks.map((item) => (
                        <li key={item.id} className="flex items-center gap-2 text-sm text-slate-700">
                          <input type="checkbox" checked={item.done} onChange={() => toggleSubtask(goal.id, item.id)} />
                          <span className={item.done ? "line-through text-slate-400" : ""}>{item.text}</span>
                        </li>
                      ))}
                      {goal.subtasks.length === 0 ? <li className="text-sm text-slate-400">暂无子任务</li> : null}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">关键结果（KR）</p>
                    <ul className="space-y-2">
                      {goal.krs.map((kr) => (
                        <li key={kr.id} className="space-y-1 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                          <p className="text-slate-700">{kr.text}</p>
                          <input
                            type="number"
                            min={0}
                            value={kr.current}
                            onChange={(event) => updateKrValue(goal.id, kr.id, Number(event.target.value))}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                          />
                          <p className="text-xs text-slate-500">
                            当前 {kr.current} / 目标 {kr.target}
                          </p>
                        </li>
                      ))}
                      {goal.krs.length === 0 ? <li className="text-sm text-slate-400">暂无 KR</li> : null}
                    </ul>
                  </div>
                </div>
              </li>
            );
          })}
          {goals.length === 0 ? <li className="text-sm text-slate-400">还没有目标，先创建一个长期或短期目标。</li> : null}
        </ul>
      </article>

      {reportText ? (
        <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900">达成报告预览</h3>
            <button type="button" onClick={downloadReport} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
              下载 TXT 报告
            </button>
          </div>
          <pre className="max-h-80 overflow-auto rounded-2xl bg-slate-900/95 p-4 text-xs leading-6 text-emerald-100">{reportText}</pre>
        </article>
      ) : null}
    </section>
  );
}
