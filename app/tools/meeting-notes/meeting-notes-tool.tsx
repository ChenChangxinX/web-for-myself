"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MeetingItem = {
  id: string;
  title: string;
  attendees: string;
  notes: string;
  todos: string[];
  summary: string;
  createdAt: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: {
    transcript: string;
  };
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const STORAGE_KEY = "web-for-myself-meeting-notes";

function loadMeetings() {
  if (typeof window === "undefined") {
    return [] as MeetingItem[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as MeetingItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => typeof item.title === "string" && typeof item.notes === "string");
  } catch {
    return [];
  }
}

function extractTodos(notes: string) {
  const lines = notes.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const todoRegex = /^(?:-\s*\[\s?\]|-\s*|\*\s*|TODO[:：]?|待办[:：]?|行动项[:：]?)/i;

  const todos = lines
    .filter((line) => todoRegex.test(line))
    .map((line) => line.replace(todoRegex, "").trim())
    .filter(Boolean);

  return Array.from(new Set(todos));
}

function createSummary(title: string, attendees: string, notes: string, todos: string[]) {
  const lines = notes.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const keyPoints = lines.slice(0, 3).join("；") || "无";
  const attendeeCount = attendees.split(/[,，]/).map((x) => x.trim()).filter(Boolean).length;

  return [
    `会议主题：${title || "未命名会议"}`,
    `参会人数：${attendeeCount}`,
    `关键记录：${keyPoints}`,
    `待办数量：${todos.length}`,
  ].join("\n");
}

export function MeetingNotesTool() {
  const [title, setTitle] = useState("项目周会");
  const [attendees, setAttendees] = useState("张三, 李四, 王五");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("等待记录会议内容");
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef<RecognitionLike | null>(null);

  const todos = useMemo(() => extractTodos(notes), [notes]);
  const summary = useMemo(() => createSummary(title, attendees, notes, todos), [title, attendees, notes, todos]);

  useEffect(() => {
    const timer = window.setTimeout(() => setMeetings(loadMeetings()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
  }, [meetings]);

  function startSpeechRecognition() {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => RecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setStatus("当前浏览器不支持语音识别，请改用手动输入");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = "zh-CN";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const result = Array.from(event.results)
          .map((item) => item[0].transcript)
          .join("")
          .trim();

        if (result) {
          setNotes((current) => `${current}${current.endsWith("\n") || !current ? "" : "\n"}${result}`);
        }
      };

      recognition.onerror = () => {
        setStatus("语音识别发生错误，请检查麦克风权限");
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    }

    recognitionRef.current.start();
    setListening(true);
    setStatus("语音识别中...");
  }

  function stopSpeechRecognition() {
    recognitionRef.current?.stop();
    setListening(false);
    setStatus("语音识别已停止");
  }

  function saveMeeting() {
    if (!title.trim() || !notes.trim()) {
      setStatus("请先填写会议标题和记录内容");
      return;
    }

    const item: MeetingItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title: title.trim(),
      attendees,
      notes,
      todos,
      summary,
      createdAt: new Date().toISOString(),
    };

    setMeetings((current) => [item, ...current].slice(0, 100));
    setStatus("会议记录已保存");
  }

  async function copySummary() {
    await navigator.clipboard.writeText(summary);
    setStatus("纪要已复制到剪贴板");
  }

  function loadMeeting(item: MeetingItem) {
    setTitle(item.title);
    setAttendees(item.attendees);
    setNotes(item.notes);
    setStatus("已加载历史记录");
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">会议记录</h2>

          <label className="block text-sm text-slate-700">
            会议标题
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" />
          </label>

          <label className="block text-sm text-slate-700">
            参会人（逗号分隔）
            <input value={attendees} onChange={(event) => setAttendees(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" />
          </label>

          <label className="block text-sm text-slate-700">
            会议内容
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="输入会议记录，可用 TODO: xxx 或 待办: xxx 标记待办"
              className="mt-1 min-h-64 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={saveMeeting} className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">保存会议</button>
            <button type="button" onClick={copySummary} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">复制纪要</button>
            <button type="button" onClick={listening ? stopSpeechRecognition : startSpeechRecognition} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              {listening ? "停止语音转写" : "开始语音转写"}
            </button>
          </div>

          <p className="text-sm text-slate-600">状态：{status}</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-900">自动提取待办</h2>
            <div className="mt-3 space-y-2">
              {todos.length ? todos.map((todo, index) => (
                <p key={`${todo}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{index + 1}. {todo}</p>
              )) : <p className="text-sm text-slate-500">暂无待办，建议在记录中使用 TODO: 或 待办: 前缀。</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-900">会议纪要</h2>
            <pre className="mt-3 min-h-28 whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{summary}</pre>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold text-slate-900">历史记录</h2>
        {meetings.length ? (
          <div className="mt-3 space-y-3">
            {meetings.map((item) => (
              <article key={item.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("zh-CN", { hour12: false })}</p>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.notes}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => loadMeeting(item)} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">加载</button>
                  <button
                    type="button"
                    onClick={() => setMeetings((current) => current.filter((row) => row.id !== item.id))}
                    className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
                  >
                    删除
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">暂无历史会议记录。</p>
        )}
      </div>
    </section>
  );
}
