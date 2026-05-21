"use client";

import { useEffect, useRef, useState } from "react";

export function ScreenRecorderTool() {
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const cameraRef = useRef<HTMLVideoElement | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [includeMic, setIncludeMic] = useState(true);
  const [previewCamera, setPreviewCamera] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [status, setStatus] = useState("等待开始录制");

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
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  async function setupCameraPreview(enabled: boolean) {
    if (!enabled) {
      cameraStream?.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
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

  async function startRecording() {
    try {
      setStatus("正在申请屏幕权限...");
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const tracks = [...displayStream.getVideoTracks(), ...displayStream.getAudioTracks()];

      if (includeMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          tracks.push(...micStream.getAudioTracks());
        } catch {
          setStatus("麦克风权限未启用，将仅录制屏幕声音");
        }
      }

      const mixedStream = new MediaStream(tracks);
      setScreenStream(mixedStream);

      const recorder = new MediaRecorder(mixedStream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setDownloadUrl((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous);
          }
          return url;
        });
        setStatus("录制完成，可下载视频");
      };

      recorder.start(1000);
      setMediaRecorder(recorder);
      setRecording(true);
      setStatus("录制中...");

      displayStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        stopRecording();
      });
    } catch {
      setStatus("录制启动失败，请检查浏览器权限");
    }
  }

  function stopRecording() {
    mediaRecorder?.stop();
    setRecording(false);

    mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
    setMediaRecorder(null);
    setScreenStream(null);
  }

  async function toggleCameraPreview() {
    const next = !previewCamera;
    setPreviewCamera(next);
    await setupCameraPreview(next);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">录屏控制台</h2>

        <div className="flex flex-wrap gap-3">
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
          开启摄像头预览（不叠加进视频）
        </label>

        <p className="text-sm font-medium text-slate-600">{status}</p>

        {downloadUrl ? (
          <a
            href={downloadUrl}
            download={`screen-record-${Date.now()}.webm`}
            className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            下载录制视频
          </a>
        ) : null}

        <video ref={previewRef} autoPlay muted playsInline className="w-full rounded-2xl border border-slate-200 bg-black/80" />
      </article>

      <article className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">摄像头预览</h2>
        <p className="text-sm text-slate-600">用于教程录制时观察画面状态，后续可扩展人像同录叠加模式。</p>
        <video ref={cameraRef} autoPlay muted playsInline className="aspect-video w-full rounded-2xl border border-slate-200 bg-slate-100" />
      </article>
    </section>
  );
}
