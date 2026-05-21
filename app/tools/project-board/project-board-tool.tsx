"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";

type TaskStatus = "todo" | "doing" | "done";
type Priority = "low" | "medium" | "high";

type BoardTask = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  dependsOn: string[];
};

const STORAGE_KEY = "web-for-myself-project-board";

function loadTasks() {
  if (typeof window === "undefined") {
    return [] as BoardTask[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as BoardTask[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => typeof item.title === "string" && typeof item.status === "string");
  } catch {
    return [];
  }
}

const columns: Array<{ key: TaskStatus; name: string }> = [
  { key: "todo", name: "待开始" },
  { key: "doing", name: "进行中" },
  { key: "done", name: "已完成" },
];

export function ProjectBoardTool() {
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("feature");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dependsInput, setDependsInput] = useState("");
  const [status, setStatus] = useState("等待创建任务");

  useEffect(() => {
    const timer = window.setTimeout(() => setTasks(loadTasks()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const tasksByStatus = useMemo(() => {
    return {
      todo: tasks.filter((task) => task.status === "todo"),
      doing: tasks.filter((task) => task.status === "doing"),
      done: tasks.filter((task) => task.status === "done"),
    };
  }, [tasks]);

  function addTask() {
    if (!title.trim()) {
      setStatus("请先输入任务标题");
      return;
    }

    const tags = tagsInput
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    const dependsOn = dependsInput
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean);

    const task: BoardTask = {
      id: `T${String(tasks.length + 1).padStart(3, "0")}-${Math.random().toString(16).slice(2, 6)}`,
      title: title.trim(),
      description: description.trim(),
      tags,
      dueDate,
      priority,
      status: "todo",
      dependsOn,
    };

    setTasks((current) => [task, ...current]);
    setTitle("");
    setDescription("");
    setTagsInput("feature");
    setDueDate("");
    setDependsInput("");
    setStatus("任务已创建");
  }

  function moveTask(id: string, nextStatus: TaskStatus) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, status: nextStatus } : task)));
  }

  function removeTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function isBlocked(task: BoardTask) {
    if (!task.dependsOn.length) {
      return false;
    }

    return task.dependsOn.some((dep) => {
      const target = tasks.find((item) => item.id === dep || item.title === dep);
      return !target || target.status !== "done";
    });
  }

  function onDropTask(event: DragEvent<HTMLElement>, statusKey: TaskStatus) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id");
    if (!taskId) {
      return;
    }
    moveTask(taskId, statusKey);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold text-slate-900">新建任务</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="任务标题" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none" />
          <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"><option value="low">低优先级</option><option value="medium">中优先级</option><option value="high">高优先级</option></select>
          <input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="标签（逗号分隔）" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none" />
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none" />
          <input value={dependsInput} onChange={(event) => setDependsInput(event.target.value)} placeholder="依赖任务ID或标题（逗号分隔）" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none lg:col-span-2" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="任务描述" className="min-h-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none lg:col-span-2" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={addTask} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">创建任务</button>
          <button type="button" onClick={() => setTasks([])} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">清空看板</button>
        </div>
        <p className="mt-2 text-sm text-slate-600">状态：{status}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column) => (
          <section
            key={column.key}
            className="min-h-[380px] rounded-3xl border border-slate-200 bg-white p-4"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => onDropTask(event, column.key)}
          >
            <h3 className="mb-3 text-base font-bold text-slate-900">{column.name}（{tasksByStatus[column.key].length}）</h3>
            <div className="space-y-3">
              {tasksByStatus[column.key].map((task) => {
                const blocked = isBlocked(task);
                return (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{task.title}</h4>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${task.priority === "high" ? "bg-rose-100 text-rose-700" : task.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{task.priority}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{task.id}</p>
                    {task.description ? <p className="mt-2 text-sm text-slate-700">{task.description}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {task.tags.map((tag) => (
                        <span key={`${task.id}-${tag}`} className="rounded-full bg-white px-2 py-1 text-xs text-slate-600">{tag}</span>
                      ))}
                    </div>
                    {task.dueDate ? <p className="mt-2 text-xs text-slate-500">截止：{task.dueDate}</p> : null}
                    {task.dependsOn.length ? <p className="mt-1 text-xs text-slate-500">依赖：{task.dependsOn.join("、")}</p> : null}
                    {blocked ? <p className="mt-1 text-xs font-semibold text-rose-600">存在未完成依赖</p> : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {column.key !== "todo" ? <button type="button" onClick={() => moveTask(task.id, "todo")} className="rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-700">移到待开始</button> : null}
                      {column.key !== "doing" ? <button type="button" onClick={() => moveTask(task.id, "doing")} className="rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-700">移到进行中</button> : null}
                      {column.key !== "done" ? <button type="button" onClick={() => moveTask(task.id, "done")} className="rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-700">移到已完成</button> : null}
                      <button type="button" onClick={() => removeTask(task.id)} className="rounded-full border border-rose-200 px-2 py-1 text-xs text-rose-700">删除</button>
                    </div>
                  </article>
                );
              })}
              {!tasksByStatus[column.key].length ? <p className="text-sm text-slate-400">暂无任务</p> : null}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
