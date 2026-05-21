"use client";

import { useEffect, useRef, useState } from "react";

interface Stroke {
  color: string;
  width: number;
  points: Array<{ x: number; y: number }>;
}

interface Sticky {
  id: string;
  text: string;
  x: number;
  y: number;
}

export function TeamWhiteboardTool() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const [color, setColor] = useState("#0f172a");
  const [width, setWidth] = useState(2);
  const [stickies, setStickies] = useState<Sticky[]>([]);
  const [noteText, setNoteText] = useState("讨论要点");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const all = current ? [...strokes, current] : strokes;
    all.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i += 1) ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      ctx.stroke();
    });
  }, [strokes, current]);

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const p = pointFromEvent(event);
    setCurrent({ color, width, points: [p] });
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!current) return;
    const p = pointFromEvent(event);
    setCurrent({ ...current, points: [...current.points, p] });
  }

  function onPointerUp() {
    if (!current) return;
    setStrokes((prev) => [...prev, current]);
    setCurrent(null);
  }

  function addSticky() {
    if (!noteText.trim()) return;
    setStickies((prev) => [...prev, { id: `${Date.now()}`, text: noteText.trim(), x: 40 + prev.length * 18, y: 40 + prev.length * 18 }]);
  }

  function applyTemplate(template: "brainstorm" | "timeline") {
    if (template === "brainstorm") {
      setStickies([
        { id: "a", text: "问题", x: 80, y: 120 },
        { id: "b", text: "想法1", x: 260, y: 60 },
        { id: "c", text: "想法2", x: 260, y: 190 },
      ]);
    } else {
      setStickies([
        { id: "a", text: "里程碑1", x: 60, y: 120 },
        { id: "b", text: "里程碑2", x: 260, y: 120 },
        { id: "c", text: "里程碑3", x: 460, y: 120 },
      ]);
    }
  }

  function replay() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let index = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const timer = window.setInterval(() => {
      if (index >= strokes.length) {
        window.clearInterval(timer);
        return;
      }
      const stroke = strokes[index];
      if (stroke.points.length > 1) {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i += 1) ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        ctx.stroke();
      }
      index += 1;
    }, 120);
  }

  return (
    <section className="space-y-4 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-9 w-12 rounded border border-slate-200" />
        <input type="range" min={1} max={8} value={width} onChange={(event) => setWidth(Number(event.target.value))} />
        <button type="button" onClick={() => setStrokes([])} className="rounded-full border border-slate-300 px-3 py-1 text-xs">清空画布</button>
        <button type="button" onClick={replay} className="rounded-full border border-slate-300 px-3 py-1 text-xs">回放绘制</button>
        <button type="button" onClick={() => applyTemplate("brainstorm")} className="rounded-full border border-slate-300 px-3 py-1 text-xs">头脑风暴模板</button>
        <button type="button" onClick={() => applyTemplate("timeline")} className="rounded-full border border-slate-300 px-3 py-1 text-xs">时间线模板</button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <canvas
          ref={canvasRef}
          width={900}
          height={460}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="h-auto w-full touch-none"
        />
        {stickies.map((sticky) => (
          <div key={sticky.id} className="absolute rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-900 shadow" style={{ left: sticky.x, top: sticky.y }}>
            {sticky.text}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="便签内容" className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        <button type="button" onClick={addSticky} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">添加便签</button>
      </div>
    </section>
  );
}
