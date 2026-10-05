import {
  Download,
  Pause,
  Play,
  Repeat,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn, formatTime } from "@/lib/utils";

type TransportProps = {
  playing: boolean;
  currentTime: number;
  duration: number;
  rate: number;
  loopEnabled: boolean;
  countIn: boolean;
  onPlay: () => void;
  onStop: () => void;
  onSeek: (t: number) => void;
  onRate: (r: number) => void;
  onToggleLoop: () => void;
  onToggleCountIn: () => void;
  onExport: () => void;
};

export function Transport({
  playing,
  currentTime,
  duration,
  rate,
  loopEnabled,
  countIn,
  onPlay,
  onStop,
  onSeek,
  onRate,
  onToggleLoop,
  onToggleCountIn,
  onExport,
}: TransportProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface p-3 sm:p-4"
      style={{ boxShadow: "var(--shadow-border)" }}
    >
      <div className="flex items-center gap-3">
        <span className="w-10 text-xs tabular-nums text-muted">
          {formatTime(currentTime)}
        </span>
        <Slider
          aria-label="Seek"
          min={0}
          max={Math.max(0.01, duration)}
          step={0.01}
          value={[Math.min(currentTime, duration)]}
          onValueChange={([v]) => onSeek(v ?? 0)}
        />
        <span className="w-10 text-right text-xs tabular-nums text-muted">
          {formatTime(duration)}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            aria-label={playing ? "Pause" : "Play"}
            onClick={onPlay}
          >
            {playing ? (
              <Pause className="size-5" />
            ) : (
              <Play className="ml-0.5 size-5" />
            )}
          </Button>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Stop"
            onClick={onStop}
          >
            <Square className="size-4" />
          </Button>
          <Button
            size="icon"
            variant={loopEnabled ? "default" : "secondary"}
            aria-label="Loop"
            aria-pressed={loopEnabled}
            onClick={onToggleLoop}
          >
            <Repeat className="size-4" />
          </Button>
          <Button
            size="sm"
            variant={countIn ? "default" : "secondary"}
            aria-pressed={countIn}
            onClick={onToggleCountIn}
          >
            Count-in
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted">
            Speed
            <select
              value={String(rate)}
              onChange={(e) => onRate(Number(e.target.value))}
              className="h-9 rounded-sm bg-elevated px-2 text-fg shadow-[var(--shadow-border)]"
            >
              <option value="0.75">0.75×</option>
              <option value="0.9">0.9×</option>
              <option value="1">1×</option>
              <option value="1.1">1.1×</option>
            </select>
          </label>
          <Button size="sm" variant="ghost" onClick={onExport}>
            <Download className="size-3.5" />
            Mix
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RoleRow({
  active,
  onPick,
}: {
  active: string | null;
  onPick: (id: string) => void;
}) {
  const roles = [
    ["karaoke", "Karaoke"],
    ["singer", "Singer"],
    ["harmony", "Harmony"],
    ["guitarist", "Guitarist"],
    ["bassist", "Bassist"],
    ["drummer", "Drummer"],
    ["keys", "Keys"],
    ["full", "Full mix"],
  ] as const;

  return (
    <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
      {roles.map(([id, label]) => {
        const on = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            className={cn(
              "h-10 shrink-0 rounded-full px-3.5 text-sm font-medium transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.96]",
              on
                ? "bg-accent text-accent-fg"
                : "bg-elevated text-muted hover:text-fg",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
