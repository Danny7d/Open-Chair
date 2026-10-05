import type { ReactNode } from "react";
import { Headphones, VolumeX } from "lucide-react";
import { STEMS, type StemId, type StemState } from "@/lib/stems";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type StemRackProps = {
  states: Record<StemId, StemState>;
  levels: Record<StemId, number>;
  onChange: (id: StemId, patch: Partial<StemState>) => void;
};

export function StemRack({ states, levels, onChange }: StemRackProps) {
  return (
    <ul className="flex flex-col gap-2">
      {STEMS.map((stem) => {
        const st = states[stem.id];
        const silent = st.mute || (Object.values(states).some((s) => s.solo) && !st.solo);
        const Icon = stem.icon;
        return (
          <li
            key={stem.id}
            className={cn(
              "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg bg-surface px-3 py-2 sm:grid-cols-[auto_7.5rem_1fr_auto] sm:gap-4 sm:px-4 sm:py-2.5",
              silent && "opacity-55",
            )}
            style={{ boxShadow: "var(--shadow-border)" }}
          >
            <span
              className="flex size-9 items-center justify-center rounded-sm bg-elevated"
              style={{ color: `var(${stem.colorVar})` }}
              aria-hidden
            >
              <Icon className="size-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg">{stem.label}</p>
              <p className="hidden truncate text-xs text-subtle sm:block">
                {stem.hint}
              </p>
            </div>
            <div className="col-span-3 flex items-center gap-3 sm:col-span-1 sm:col-start-3">
              <Slider
                aria-label={`${stem.label} level`}
                min={0}
                max={1}
                step={0.01}
                value={[st.volume]}
                onValueChange={([v]) => onChange(stem.id, { volume: v ?? 0 })}
                className="min-w-0 flex-1"
              />
              <Meter value={silent ? 0 : levels[stem.id] ?? 0} colorVar={stem.colorVar} />
            </div>
            <div className="flex items-center gap-1 justify-self-end">
              <IconToggle
                pressed={st.solo}
                label={`Solo ${stem.short}`}
                onPressed={() => onChange(stem.id, { solo: !st.solo })}
              >
                <Headphones className="size-4" />
              </IconToggle>
              <IconToggle
                pressed={st.mute}
                label={`Mute ${stem.short}`}
                onPressed={() => onChange(stem.id, { mute: !st.mute })}
              >
                <VolumeX className="size-4" />
              </IconToggle>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function IconToggle({
  pressed,
  label,
  onPressed,
  children,
}: {
  pressed: boolean;
  label: string;
  onPressed: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onPressed}
      className={cn(
        "relative flex size-11 items-center justify-center rounded-sm transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.96]",
        pressed ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function Meter({ value, colorVar }: { value: number; colorVar: string }) {
  const h = Math.min(1, value * 4);
  return (
    <span
      aria-hidden
      className="relative h-7 w-1.5 overflow-hidden rounded-full bg-elevated"
    >
      <span
        className="absolute inset-x-0 bottom-0 rounded-full transition-[height] duration-75"
        style={{
          height: `${h * 100}%`,
          background: `var(${colorVar})`,
        }}
      />
    </span>
  );
}
