import { useCallback, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Armchair, Upload } from "lucide-react";
import { STUDIO_SONGS, studioDuration } from "@/lib/audio/studio";
import { isAudioFile, openStudioTrack, openUploadedFile } from "@/lib/load-session";
import { STEMS } from "@/lib/stems";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn, formatTime } from "@/lib/utils";

export function HomeView() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const goSession = useCallback(
    (work: () => Promise<void>) => {
      void work();
      void navigate({ to: "/session" });
    },
    [navigate],
  );

  const onFiles = useCallback(
    (files: FileList | File[] | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!isAudioFile(file)) {
        toast.error("Drop an audio file — WAV, MP3, or M4A.");
        return;
      }
      setBusy("upload");
      goSession(() => openUploadedFile(file));
    },
    [goSession],
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-5 pb-20 pt-10 sm:gap-16 sm:pt-16">
      <header className="flex items-center gap-2 text-muted">
        <Armchair className="size-5 text-fg" strokeWidth={1.6} />
        <span className="text-sm font-medium uppercase tracking-widest">
          Open Chair
        </span>
      </header>

      <section className="flex flex-col gap-5">
        <h1 className="font-display text-5xl leading-tight tracking-tight text-fg sm:text-6xl">
          Take the
          <br />
          <em className="italic">empty chair.</em>
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted">
          Drop a song. Mute the part you want to play. Sit in from your room —
          singer, guitarist, drummer, anywhere you belong.
        </p>
        <p className="text-xs uppercase tracking-widest text-subtle">
          {STEMS.map((s) => s.short).join(" · ")}
        </p>
      </section>

      <section>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
          className="sr-only"
          onChange={(e) => void onFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            void onFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex w-full flex-col items-start gap-3 rounded-2xl bg-surface px-6 py-8 text-left transition-[box-shadow,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-8 sm:py-10",
            over && "bg-elevated",
          )}
          style={{
            boxShadow: over ? "var(--shadow-border-hover)" : "var(--shadow-border)",
          }}
        >
          <span className="flex size-11 items-center justify-center rounded-md bg-elevated text-fg">
            <Upload className="size-4" strokeWidth={1.75} />
          </span>
          <span className="font-display text-2xl tracking-tight">
            Drop a track
          </span>
          <span className="max-w-sm text-sm leading-relaxed text-muted">
            A quick on-device split estimates lead, features, drums, bass,
            guitar, keys, and the rest. Results vary by mix. Mute your chair.
          </span>
        </button>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl tracking-tight">Studio cuts</h2>
          <p className="text-xs text-subtle">Synthesized demos · full mute</p>
        </div>
        <ul className="flex flex-col gap-3">
          {STUDIO_SONGS.map((song) => {
            const duration = studioDuration(song.studioId);
            return (
              <li key={song.id}>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => {
                    setBusy(song.id);
                    goSession(() => openStudioTrack(song.studioId));
                  }}
                  className="flex w-full items-center justify-between gap-4 rounded-xl bg-surface px-5 py-4 text-left transition-[box-shadow,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.99] disabled:opacity-60"
                  style={{ boxShadow: "var(--shadow-border)" }}
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-fg">{song.title}</span>
                    <span className="block text-sm text-muted">
                      {song.subtitle}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs tabular-nums text-subtle">
                    {song.bpm} BPM · {song.key}
                    <span className="mt-0.5 block">{formatTime(duration)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-xs leading-relaxed text-subtle">
        Uploads never leave this browser. Isolation is strongest on vocals,
        drums, and bass — guitar and keys share the middle of a dense mix.
      </p>

      <div className="flex sm:hidden">
        <Button
          className="w-full"
          onClick={() => inputRef.current?.click()}
        >
          Choose a file
        </Button>
      </div>
    </div>
  );
}
