import { useEffect, useRef } from "react";
import { STEM_IDS, STEM_BY_ID, type StemId } from "@/lib/stems";
import { cn } from "@/lib/utils";

type WaveformProps = {
  peaks: Record<StemId, Float32Array> | null;
  mixPeak: Float32Array | null;
  duration: number;
  currentTime: number;
  muted: Record<StemId, boolean>;
  dissolving?: boolean;
  progress?: number;
  loopEnabled?: boolean;
  loopStart?: number;
  loopEnd?: number;
  onSeek?: (t: number) => void;
};

export function Waveform({
  peaks,
  mixPeak,
  duration,
  currentTime,
  muted,
  dissolving = false,
  progress = 0,
  loopEnabled,
  loopStart = 0,
  loopEnd = 0,
  onSeek,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const layerH = h / STEM_IDS.length;
      const split = dissolving ? Math.min(1, progress) : 1;

      STEM_IDS.forEach((id, i) => {
        const data = peaks?.[id] ?? mixPeak;
        if (!data || data.length === 0) return;
        const restY = h / 2;
        const targetY = layerH * i + layerH / 2;
        const cy = restY + (targetY - restY) * split;
        const amp = (layerH * 0.42) * (0.35 + 0.65 * split);
        const color = getComputedStyle(canvas).getPropertyValue(
          STEM_BY_ID[id].colorVar,
        );
        ctx.globalAlpha = muted[id] ? 0.18 : 0.55 + 0.35 * split;
        ctx.strokeStyle = color.trim() || "#d8d4cc";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const idx = Math.min(
            data.length - 1,
            Math.floor((x / w) * data.length),
          );
          const v = data[idx] ?? 0;
          const y = cy - v * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let x = w - 1; x >= 0; x--) {
          const idx = Math.min(
            data.length - 1,
            Math.floor((x / w) * data.length),
          );
          const v = data[idx] ?? 0;
          ctx.lineTo(x, cy + v * amp);
        }
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.globalAlpha = muted[id] ? 0.06 : 0.16 + 0.1 * split;
        ctx.fill();
        ctx.globalAlpha = muted[id] ? 0.2 : 0.7;
        ctx.stroke();
      });

      if (duration > 0) {
        const x = (currentTime / duration) * w;
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(243,241,236,0.85)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      if (loopEnabled && duration > 0) {
        const x0 = (loopStart / duration) * w;
        const x1 = (loopEnd / duration) * w;
        ctx.fillStyle = "rgba(243,241,236,0.06)";
        ctx.fillRect(x0, 0, x1 - x0, h);
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [
    peaks,
    mixPeak,
    duration,
    currentTime,
    muted,
    dissolving,
    progress,
    loopEnabled,
    loopStart,
    loopEnd,
  ]);

  return (
    <div
      className={cn(
        "relative h-36 w-full overflow-hidden rounded-lg bg-elevated sm:h-44",
      )}
      style={{ boxShadow: "var(--shadow-border)" }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full cursor-pointer"
        onClick={(e) => {
          if (!onSeek || duration <= 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const t = ((e.clientX - rect.left) / rect.width) * duration;
          onSeek(t);
        }}
      />
    </div>
  );
}
