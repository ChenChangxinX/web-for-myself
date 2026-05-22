"use client";

import { useMemo, useState } from "react";

type Mode = "flashcard" | "math" | "coding" | "planner" | "mistake" | "cards" | "mindmap" | "schedule" | "notes" | "practice" | "recite" | "duration" | "reading" | "paper" | "whiteboard" | "homework" | "countdown" | "group" | "skill" | "achievement";

interface Meta {
  title: string;
  badge: string;
  desc: string;
  mode: Mode;
}

interface LearningState {
  items: string[];
  score: number;
  hours: number[];
  difficulty: string;
  topic: string;
  example: string;
  reviewBox: number;
  focusLoss: number;
  checkins: number;
  voiceOn: boolean;
  planDone: number;
  countdownDate: string;
}

const META: Record<string, Meta> = {
  "word-flashcards": { title: "单词记忆卡片", badge: "FLASHCARD", desc: "复习节奏 + 例句 + 熟练度", mode: "flashcard" },
  "math-generator": { title: "数学练习题生成器", badge: "MATH", desc: "随机题目 + 即时判分", mode: "math" },
  "coding-bank": { title: "编程题库", badge: "CODING", desc: "题目筛选 + 解题记录", mode: "coding" },
  "study-planner": { title: "学习计划制定工具", badge: "PLAN", desc: "目标拆解 + 周计划", mode: "planner" },
  "mistake-book": { title: "错题本", badge: "MISTAKE", desc: "错题收集 + 复习状态", mode: "mistake" },
  "knowledge-cards": { title: "知识卡片", badge: "CARD", desc: "Markdown 卡片 + 随机复习", mode: "cards" },
  "mind-map": { title: "思维导图工具", badge: "MAP", desc: "节点层级 + 结构梳理", mode: "mindmap" },
  "course-schedule": { title: "课程表管理", badge: "COURSE", desc: "课程安排 + 作业提醒", mode: "schedule" },
  "notes-sharing": { title: "学习笔记分享平台", badge: "NOTES", desc: "发布笔记 + 收藏评分", mode: "notes" },
  "question-practice": { title: "在线题库练习", badge: "PRACTICE", desc: "刷题记录 + 正确率", mode: "practice" },
  "recite-helper": { title: "背诵助手", badge: "RECITE", desc: "遮挡关键词 + 默写", mode: "recite" },
  "study-duration": { title: "学习时长统计", badge: "DURATION", desc: "计时 + 周趋势", mode: "duration" },
  "reading-notes": { title: "读书笔记管理", badge: "READING", desc: "书单进度 + 摘抄", mode: "reading" },
  "paper-manager": { title: "论文管理工具", badge: "PAPER", desc: "文献 + 引用格式", mode: "paper" },
  "teaching-whiteboard": { title: "在线白板教学", badge: "TEACH", desc: "板书 + 教学互动", mode: "whiteboard" },
  "homework-submit": { title: "作业提交系统", badge: "HOMEWORK", desc: "作业提交 + 批改状态", mode: "homework" },
  "exam-countdown": { title: "考试倒计时", badge: "EXAM", desc: "考试节点 + 复习进度", mode: "countdown" },
  "study-group": { title: "学习小组管理", badge: "GROUP", desc: "小组任务 + 打卡", mode: "group" },
  "skill-tree": { title: "技能树可视化", badge: "SKILL", desc: "路径解锁 + 阶段追踪", mode: "skill" },
  "study-achievement": { title: "学习成就系统", badge: "ACHIEVE", desc: "勋章 + 连续学习", mode: "achievement" },
};

function dateAfterDays(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function hints(mode: Mode) {
  const table: Record<Mode, string[]> = {
    flashcard: ["艾宾浩斯复习", "点击发音", "例句记忆"],
    math: ["多题型多难度", "自动批改", "错题沉淀"],
    coding: ["在线写题", "测试评测", "解法分享"],
    planner: ["目标拆解", "智能下一步", "学习报告"],
    mistake: ["拍照/OCR辅助", "分类管理", "错误分析"],
    cards: ["Markdown", "标签搜索", "间隔复习"],
    mindmap: ["节点编辑", "颜色层级", "导图导出"],
    schedule: ["课程提醒", "作业记录", "课程评价"],
    notes: ["笔记分享", "代码高亮", "评分与付费"],
    practice: ["分科刷题", "错题历史", "模拟考试"],
    recite: ["分段背诵", "关键词遮挡", "默写检查"],
    duration: ["时长趋势", "专注分析", "学习排行"],
    reading: ["读书进度", "摘抄感想", "读书报告"],
    paper: ["文献管理", "参考格式", "引用网络"],
    whiteboard: ["在线讲解", "课堂互动", "分组讨论"],
    homework: ["提交预览", "批改评分", "成绩统计"],
    countdown: ["考试倒计时", "复习提醒", "复习计划"],
    group: ["资料讨论", "打卡监督", "语音讨论"],
    skill: ["技能解锁", "多路径", "里程碑"],
    achievement: ["勋章奖励", "排行榜", "成就分享"],
  };
  return table[mode];
}

function defaultState(): LearningState {
  return {
    items: [],
    score: 0,
    hours: [1.8, 2.1, 1.2, 2.6, 2.9, 1.5, 2.3],
    difficulty: "中等",
    topic: "综合",
    example: "",
    reviewBox: 1,
    focusLoss: 1,
    checkins: 0,
    voiceOn: false,
    planDone: 0,
    countdownDate: dateAfterDays(7),
  };
}

function readState(toolId: string): LearningState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(`learning-tool-state:${toolId}`);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<LearningState>;
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

function saveState(toolId: string, state: LearningState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`learning-tool-state:${toolId}`, JSON.stringify(state));
}

export function LearningToolStudio({ toolId }: { toolId: string }) {
  const meta = META[toolId] ?? { title: "学习工具", badge: "LEARN", desc: "学习实验台", mode: "planner" as const };
  const [state, setState] = useState<LearningState>(() => readState(toolId));
  const [text, setText] = useState("");
  const [validation, setValidation] = useState("");

  const daysLeft = useMemo(() => {
    const now = new Date();
    const diff = new Date(state.countdownDate).getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / 86400000));
  }, [state.countdownDate]);

  const hourSummary = useMemo(() => {
    const total = state.hours.reduce((sum, value) => sum + value, 0);
    return { total, avg: (total / state.hours.length).toFixed(1) };
  }, [state.hours]);

  const progress = Math.min(100, Math.round((state.planDone / Math.max(state.planDone + 2, 6)) * 100));

  const mistakeStats = useMemo(() => {
    const total = state.items.filter((item) => item.startsWith("错题: ")).length;
    return [
      { label: "概念", value: Math.max(1, Math.floor(total * 0.4)) },
      { label: "计算", value: Math.max(1, Math.floor(total * 0.35)) },
      { label: "审题", value: Math.max(1, Math.floor(total * 0.25)) },
    ];
  }, [state.items]);

  function mutate(next: Partial<LearningState>) {
    setState((current) => {
      const merged = { ...current, ...next };
      saveState(toolId, merged);
      return merged;
    });
  }

  function addItem(prefix: string) {
    const value = text.trim();
    if (!value) {
      setValidation("请输入内容后再添加");
      return;
    }
    if (value.length > 120) {
      setValidation("输入过长，请控制在 120 字以内");
      return;
    }
    if (state.items.some((item) => item.endsWith(value))) {
      setValidation("检测到重复内容，请修改后再提交");
      return;
    }
    setValidation("");
    mutate({ items: [`${prefix}${value}`, ...state.items].slice(0, 24) });
    setText("");
  }

  function generateMath() {
    const base = state.difficulty === "简单" ? 20 : state.difficulty === "困难" ? 100 : 50;
    const a = Math.floor(Math.random() * base);
    const b = Math.floor(Math.random() * base);
    if (state.topic === "方程") {
      setText(`题目: x + ${b} = ${a + b}，答案 ${a}`);
      return;
    }
    if (state.topic === "几何") {
      setText(`题目: 边长 ${a} 的正方形面积是？答案 ${a * a}`);
      return;
    }
    setText(`题目: ${a} + ${b} = ?，答案 ${a + b}`);
  }

  function speakWord() {
    const value = text.trim();
    if (!value || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(value);
    utter.lang = "en-US";
    window.speechSynthesis.speak(utter);
  }

  function reviewHint() {
    if (state.reviewBox <= 1) return "建议明天复习";
    if (state.reviewBox === 2) return "建议 3 天后复习";
    if (state.reviewBox === 3) return "建议 7 天后复习";
    if (state.reviewBox === 4) return "建议 14 天后复习";
    return "建议 30 天后复习";
  }

  function exportJson() {
    const payload = {
      tool: toolId,
      title: meta.title,
      exportedAt: new Date().toISOString(),
      state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${toolId}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportText() {
    const lines = [`工具: ${meta.title}`, `导出时间: ${new Date().toLocaleString("zh-CN")}`, "", ...state.items];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${toolId}-records.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <header className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="mb-2 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-sky-700">{meta.badge}</p>
        <h2 className="text-2xl font-extrabold text-slate-900">{meta.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{meta.desc}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {hints(meta.mode).map((item) => (
            <span key={item} className="rounded-full bg-sky-50 px-3 py-1 text-xs text-sky-700">{item}</span>
          ))}
        </div>
      </header>

      <article className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
        {(meta.mode === "math" || meta.mode === "practice") ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <select value={state.difficulty} onChange={(event) => mutate({ difficulty: event.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <option>简单</option><option>中等</option><option>困难</option>
            </select>
            <select value={state.topic} onChange={(event) => mutate({ topic: event.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <option>综合</option><option>方程</option><option>几何</option>
            </select>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <input value={text} onChange={(event) => { setText(event.target.value); setValidation(""); }} placeholder="输入内容" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          <button
            type="button"
            onClick={() => {
              if (meta.mode === "math") generateMath();
              else if (meta.mode === "flashcard") addItem("单词: ");
              else if (meta.mode === "coding") addItem("题目: ");
              else if (meta.mode === "mistake") addItem("错题: ");
              else if (meta.mode === "cards") addItem("知识卡: ");
              else if (meta.mode === "mindmap") addItem("节点: ");
              else if (meta.mode === "schedule") addItem("课程: ");
              else if (meta.mode === "notes") addItem("笔记: ");
              else if (meta.mode === "practice") addItem("练习: ");
              else if (meta.mode === "recite") addItem("背诵: ");
              else if (meta.mode === "reading") addItem("读书: ");
              else if (meta.mode === "paper") addItem("文献: ");
              else if (meta.mode === "whiteboard") addItem("课堂: ");
              else if (meta.mode === "homework") addItem("作业: ");
              else if (meta.mode === "group") addItem("小组: ");
              else if (meta.mode === "skill") addItem("技能: ");
              else if (meta.mode === "achievement") addItem("成就: ");
              else addItem("计划: ");
            }}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >{meta.mode === "math" ? "生成题目" : "添加"}</button>
          {meta.mode === "flashcard" ? <button type="button" onClick={speakWord} className="rounded-full border border-slate-300 px-4 py-2 text-xs">发音</button> : null}
          <button type="button" onClick={exportJson} className="rounded-full border border-slate-300 px-4 py-2 text-xs">导出 JSON</button>
          <button type="button" onClick={exportText} className="rounded-full border border-slate-300 px-4 py-2 text-xs">导出记录</button>
        </div>

        {validation ? <p className="text-xs text-rose-600">{validation}</p> : null}

        {meta.mode === "flashcard" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={state.example} onChange={(event) => mutate({ example: event.target.value.slice(0, 120) })} placeholder="例句" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            <select value={state.reviewBox} onChange={(event) => mutate({ reviewBox: Number(event.target.value) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <option value={1}>Box 1</option><option value={2}>Box 2</option><option value={3}>Box 3</option><option value={4}>Box 4</option><option value={5}>Box 5</option>
            </select>
            <p className="sm:col-span-2 text-xs text-slate-500">{reviewHint()} · 例句: {state.example || "未填写"}</p>
          </div>
        ) : null}

        {meta.mode === "coding" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <textarea rows={4} maxLength={800} placeholder="在线编写代码（示例）" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs" />
            <button type="button" onClick={() => mutate({ items: [`评测结果: 3/4 通过`, ...state.items].slice(0, 24) })} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">运行测试</button>
          </div>
        ) : null}

        {meta.mode === "planner" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>当前计划完成度: {progress}%</p>
            <button type="button" onClick={() => mutate({ planDone: state.planDone + 1 })} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">完成一项任务</button>
            <p>智能建议: {progress < 50 ? "先做 25 分钟最小任务" : "转入复盘并规划下一阶段"}</p>
          </div>
        ) : null}

        {meta.mode === "mistake" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <input type="file" accept="image/*" className="text-xs" />
            <p>OCR 辅助: 支持从题图提取文字（演示模式）</p>
            <div className="space-y-1">
              {mistakeStats.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs"><span>{item.label}</span><span>{item.value}</span></div>
                  <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-sky-500" style={{ width: `${Math.min(100, item.value * 18)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {meta.mode === "duration" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>本周总时长: {hourSummary.total.toFixed(1)} 小时 · 日均 {hourSummary.avg} 小时</p>
            <p>分心次数: {state.focusLoss}</p>
            <button type="button" onClick={() => mutate({ focusLoss: state.focusLoss + 1 })} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">记录分心</button>
            <button type="button" onClick={() => mutate({ hours: [...state.hours.slice(1), Number((1 + Math.random() * 3).toFixed(1))] })} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">刷新样本</button>
            <div className="grid grid-cols-7 gap-1">
              {state.hours.map((value, index) => (
                <div key={`${value}-${index}`} className="rounded bg-slate-100 p-1 text-center text-[10px]">
                  <div className="mx-auto mb-1 w-4 rounded bg-sky-500" style={{ height: `${Math.max(12, value * 12)}px` }} />
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {meta.mode === "countdown" ? (
          <div className="space-y-1 text-sm text-slate-700">
            <input type="date" value={state.countdownDate} onChange={(event) => mutate({ countdownDate: event.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
            <p>距离考试还有 {daysLeft} 天</p>
            <p>复习提醒: 每天 20:00</p>
          </div>
        ) : null}

        {meta.mode === "group" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>今日打卡人数: {state.checkins}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => mutate({ checkins: state.checkins + 1 })} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">打卡 +1</button>
              <button type="button" onClick={() => mutate({ voiceOn: !state.voiceOn })} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">{state.voiceOn ? "关闭语音" : "开启语音"}</button>
            </div>
          </div>
        ) : null}

        {meta.mode === "achievement" ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>当前积分: {state.score} · 排名: 第 {Math.max(1, 30 - Math.floor(state.score / 10))} 名</p>
            <button type="button" onClick={() => mutate({ score: state.score + 10 })} className="rounded-full border border-slate-300 px-4 py-1.5 text-xs">完成任务 +10</button>
          </div>
        ) : null}

        {meta.mode === "schedule" ? <p className="text-sm text-slate-700">课程提醒: 课前 30 分钟 · 支持课程评价与资料备注</p> : null}
        {meta.mode === "notes" ? <p className="text-sm text-slate-700">支持 Markdown 与代码块展示，笔记可评分并设置付费可见（演示）</p> : null}
        {meta.mode === "practice" ? <p className="text-sm text-slate-700">可按科目和难度刷题，系统依据错题记录推荐相似题（演示）</p> : null}
        {meta.mode === "recite" ? <p className="text-sm text-slate-700">关键词遮挡: {text ? text.replace(/[\u4e00-\u9fa5A-Za-z0-9]/g, "▢") : "输入内容后自动遮挡"}</p> : null}
        {meta.mode === "reading" ? <p className="text-sm text-slate-700">读书进度: {Math.min(100, state.items.length * 8)}% · 支持读书报告导出（演示）</p> : null}
        {meta.mode === "paper" ? <p className="text-sm text-slate-700">支持 APA/MLA/GB-T 引用格式与文献关联网络（演示）</p> : null}
        {meta.mode === "whiteboard" ? <p className="text-sm text-slate-700">课堂互动: 举手提问 + 分组讨论 + 回放（演示）</p> : null}
        {meta.mode === "homework" ? <p className="text-sm text-slate-700">上传预览 + 批改评分 + 查重提示 + 成绩统计（演示）</p> : null}
        {meta.mode === "skill" ? <p className="text-sm text-slate-700">多路径技能树: 基础路径 / 项目路径，已解锁节点 {Math.min(8, state.items.length + 2)}</p> : null}
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-base font-bold text-slate-900">记录列表</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          {state.items.map((item, index) => (
            <li key={`${item}-${index}`} className="rounded-xl bg-slate-50 p-2">{item}</li>
          ))}
          {state.items.length === 0 ? <li className="text-slate-400">暂无记录</li> : null}
        </ul>
      </article>
    </section>
  );
}
