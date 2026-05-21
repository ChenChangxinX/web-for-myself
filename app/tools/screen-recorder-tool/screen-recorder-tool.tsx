"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DragMode = "move" | "resize" | null;

interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OutputFormat {
  label: string;
  mimeType: string;
  ext: string;
}

const CANDIDATE_FORMATS: OutputFormat[] = [
  { label: "WebM (VP9 + Opus)", mimeType: "video/webm;codecs=vp9,opus", ext: "webm" },
  { label: "WebM (VP8 + Opus)", mimeType: "video/webm;codecs=vp8,opus", ext: "webm" },
  { label: "WebM", mimeType: "video/webm", ext: "webm" },
  { label: "MP4 (浏览器支持时)", mimeType: "video/mp4", ext: "mp4" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ScreenRecorderTool() {
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const cameraRef = useRef<HTMLVideoElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const frameAtDragStartRef = useRef<FrameRect | null>(null);
  const dragModeRef = useRef<DragMode>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordAnimationRef = useRef<number | null>(null);
  const audioTracksRef = useRef<MediaStreamTrack[]>([]);
  const mixedStreamRef = useRef<MediaStream | null>(null);

  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [includeMic, setIncludeMic] = useState(true);
  const [previewCamera, setPreviewCamera] = useState(false);
  const [status, setStatus] = useState("请先选择录制源");
  const [downloadInfo, setDownloadInfo] = useState<{ url: string; ext: string } | null>(null);
  const [frame, setFrame] = useState<FrameRect>({ x: 0.12, y: 0.12, width: 0.76, height: 0.76 });
  const supportedFormats = useMemo(() => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      return [] as OutputFormat[];
    }
    return CANDIDATE_FORMATS.filter((format) => MediaRecorder.isTypeSupported(format.mimeType));
  }, []);
  const [selectedMimeType, setSelectedMimeType] = useState(() => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      return "";
    }
    const first = CANDIDATE_FORMATS.find((format) => MediaRecorder.isTypeSupported(format.mimeType));
    return first?.mimeType ?? "";
  });

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      if (downloadInfo?.url) {
        URL.revokeObjectURL(downloadInfo.url);
      }
    };
  }, [downloadInfo]);

  useEffect(() => {
    return () => {
      stopScreenPreview();
      stopCameraPreview();
    };
  }, []);

  const selectedFormat = useMemo(
    () => supportedFormats.find((item) => item.mimeType === selectedMimeType) ?? null,
    [selectedMimeType, supportedFormats],
  );

  function stopScreenPreview() {
    setScreenStream((current) => {
      current?.getTracks().forEach((track) => track.stop());
      return null;
    });
  }

  function stopCameraPreview() {
    setCameraStream((current) => {
      current?.getTracks().forEach((track) => track.stop());
      return null;
    });
  }

  async function setupCameraPreview(enabled: boolean) {
    if (!enabled) {
      stopCameraPreview();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
    } catch {
      setStatus("摄像头预览打开失败，请检查权限");
      setPreviewCamera(false);
    }
  }

  async function pickCaptureSource() {
    try {
      setStatus("正在申请屏幕权限...");
      stopScreenPreview();
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setScreenStream(displayStream);
      setStatus("录制源已选择，可拖拽取景框并开始录制");

      displayStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (recording) {
          stopRecording();
        } else {
          stopScreenPreview();
          setStatus("录制源已关闭，请重新选择");
        }
      });
    } catch {
      setStatus("录制源选择失败，请检查浏览器权限");
    }
  }

  function updateFrameByPointer(clientX: number, clientY: number) {
    const video = previewRef.current;
    const dragStart = dragStartRef.current;
    const baseFrame = frameAtDragStartRef.current;
    const mode = dragModeRef.current;
    if (!video || !dragStart || !baseFrame || !mode) {
      return;
    }

    const rect = video.getBoundingClientRect();
    const dx = (clientX - dragStart.x) / rect.width;
    const dy = (clientY - dragStart.y) / rect.height;

    if (mode === "move") {
      const nextX = clamp(baseFrame.x + dx, 0, 1 - baseFrame.width);
      const nextY = clamp(baseFrame.y + dy, 0, 1 - baseFrame.height);
      setFrame({ ...baseFrame, x: nextX, y: nextY });
      return;
    }

    const minSize = 0.08;
    const nextWidth = clamp(baseFrame.width + dx, minSize, 1 - baseFrame.x);
    const nextHeight = clamp(baseFrame.height + dy, minSize, 1 - baseFrame.y);
    setFrame({ ...baseFrame, width: nextWidth, height: nextHeight });
  }

  function handleMovePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (recording) {
      return;
    }
    dragModeRef.current = "move";
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    frameAtDragStartRef.current = frame;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function handleResizePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (recording) {
      return;
    }
    dragModeRef.current = "resize";
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    frameAtDragStartRef.current = frame;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (!dragModeRef.current) {
      return;
    }
    updateFrameByPointer(event.clientX, event.clientY);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLElement>) {
    if (dragModeRef.current) {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    }
    dragModeRef.current = null;
    dragStartRef.current = null;
    frameAtDragStartRef.current = null;
  }

  async function startRecording() {
    if (recording) {
      return;
    }
    if (!screenStream) {
      await pickCaptureSource();
      return;
    }
    if (!selectedFormat) {
      setStatus("当前浏览器不支持可选录制格式");
      return;
    }

    const video = previewRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setStatus("录制源尚未准备好，请稍后重试");
      return;
    }

    try {
      const videoRect = video.getBoundingClientRect();
      const viewWidth = Math.max(videoRect.width, 1);
      const viewHeight = Math.max(videoRect.height, 1);

      const scale = Math.min(viewWidth / video.videoWidth, viewHeight / video.videoHeight);
      const renderedWidth = video.videoWidth * scale;
      const renderedHeight = video.videoHeight * scale;
      const offsetX = (viewWidth - renderedWidth) / 2;
      const offsetY = (viewHeight - renderedHeight) / 2;

      const cropDisplayX = frame.x * viewWidth;
      const cropDisplayY = frame.y * viewHeight;
      const cropDisplayW = frame.width * viewWidth;
      const cropDisplayH = frame.height * viewHeight;

      const clippedX1 = clamp(cropDisplayX, offsetX, offsetX + renderedWidth);
      const clippedY1 = clamp(cropDisplayY, offsetY, offsetY + renderedHeight);
      const clippedX2 = clamp(cropDisplayX + cropDisplayW, offsetX, offsetX + renderedWidth);
      const clippedY2 = clamp(cropDisplayY + cropDisplayH, offsetY, offsetY + renderedHeight);

      const sourceX = (clippedX1 - offsetX) / scale;
      const sourceY = (clippedY1 - offsetY) / scale;
      const sourceW = Math.max(32, (clippedX2 - clippedX1) / scale);
      const sourceH = Math.max(32, (clippedY2 - clippedY1) / scale);

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(sourceW);
      canvas.height = Math.round(sourceH);
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("无法初始化录制画布");
      }

      const canvasStream = canvas.captureStream(30);
      const tracks: MediaStreamTrack[] = [...screenStream.getAudioTracks()];
      let micTracks: MediaStreamTrack[] = [];

      if (includeMic) {
        try {
          const mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          micTracks = mic.getAudioTracks();
          tracks.push(...micTracks);
        } catch {
          setStatus("麦克风未授权，将仅录制系统音频");
        }
      }

      audioTracksRef.current = micTracks;
      const mixedStream = new MediaStream([...canvasStream.getVideoTracks(), ...tracks]);
      mixedStreamRef.current = mixedStream;

      const recorder = new MediaRecorder(mixedStream, { mimeType: selectedFormat.mimeType });
      recorderRef.current = recorder;

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedFormat.mimeType });
        const url = URL.createObjectURL(blob);
        setDownloadInfo((previous) => {
          if (previous?.url) {
            URL.revokeObjectURL(previous.url);
          }
          return { url, ext: selectedFormat.ext };
        });
        setStatus("录制完成，可下载视频文件");
      };

      const drawFrame = () => {
        context.drawImage(video, sourceX, sourceY, sourceW, sourceH, 0, 0, canvas.width, canvas.height);
        recordAnimationRef.current = requestAnimationFrame(drawFrame);
      };
      drawFrame();

      recorder.start(500);
      setRecording(true);
      setStatus("录制中... 可继续拖拽预览框查看范围，输出按开始时范围裁切");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "录制启动失败");
    }
  }

  function stopRecording() {
    if (!recording) {
      return;
    }

    recorderRef.current?.stop();
    recorderRef.current = null;

    if (recordAnimationRef.current !== null) {
      cancelAnimationFrame(recordAnimationRef.current);
      recordAnimationRef.current = null;
    }

    mixedStreamRef.current?.getTracks().forEach((track) => track.stop());
    mixedStreamRef.current = null;

    audioTracksRef.current.forEach((track) => track.stop());
    audioTracksRef.current = [];

    setRecording(false);
  }

  async function toggleCameraPreview() {
    const next = !previewCamera;
    setPreviewCamera(next);
    await setupCameraPreview(next);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">录屏控制台</h2>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={pickCaptureSource}
            disabled={recording}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            选择录制源
          </button>
          <button
            type="button"
            disabled={recording}
            onClick={startRecording}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            开始录制
          </button>
          <button
            type="button"
            disabled={!recording}
            onClick={stopRecording}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            停止录制
          </button>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={includeMic} onChange={(event) => setIncludeMic(event.target.checked)} />
          录制时采集麦克风
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={previewCamera} onChange={toggleCameraPreview} />
          开启摄像头预览（不叠加到输出视频）
        </label>

        <label className="space-y-2 text-sm font-semibold text-slate-700">
          保存格式
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal"
            value={selectedMimeType}
            onChange={(event) => setSelectedMimeType(event.target.value)}
            disabled={recording || supportedFormats.length === 0}
          >
            {supportedFormats.length === 0 ? <option value="">当前浏览器无可用录制格式</option> : null}
            {supportedFormats.map((item) => (
              <option key={item.mimeType} value={item.mimeType}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <p className="text-sm font-medium text-slate-600">{status}</p>

        {downloadInfo ? (
          <a
            href={downloadInfo.url}
            download={`screen-record-${Date.now()}.${downloadInfo.ext}`}
            className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            下载录制文件
          </a>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs text-slate-500">提示：拖拽虚线框可移动范围，右下角方块可缩放范围。</p>
          <div className="relative">
            <video
              ref={previewRef}
              autoPlay
              muted
              playsInline
              className="aspect-video w-full rounded-2xl border border-slate-200 bg-black object-contain"
            />

            {screenStream ? (
              <div
                className="absolute inset-0"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div
                  className="absolute cursor-move border-2 border-dashed border-amber-300 bg-amber-200/10"
                  style={{
                    left: `${frame.x * 100}%`,
                    top: `${frame.y * 100}%`,
                    width: `${frame.width * 100}%`,
                    height: `${frame.height * 100}%`,
                  }}
                  onPointerDown={handleMovePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                >
                  <button
                    type="button"
                    aria-label="resize frame"
                    className="absolute -bottom-2 -right-2 h-4 w-4 cursor-se-resize rounded-sm bg-amber-400"
                    onPointerDown={handleResizePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </article>

      <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">摄像头预览</h2>
        <p className="text-sm text-slate-600">用于课程讲解或演示场景，可作为人像监看窗口。</p>
        <video ref={cameraRef} autoPlay muted playsInline className="aspect-video w-full rounded-2xl border border-slate-200 bg-slate-100" />
      </article>
    </section>
  );
}
