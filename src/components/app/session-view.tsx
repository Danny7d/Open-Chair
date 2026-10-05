import { useEffect, useState } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { Armchair, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { player } from "@/lib/audio/player";
import { STEM_IDS, type StemId } from "@/lib/stems";
import { useSession } from "@/store/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Waveform } from "@/components/app/waveform";
import { StemRack } from "@/components/app/stem-rack";
import { RoleRow, Transport } from "@/components/app/transport";

const zeroLevels = Object.fromEntries(STEM_IDS.map((id) => [id, 0])) as Record<
  StemId,
  number
>;

export function SessionView() {
  const session = useSession();
  const [levels, setLevels] = useState(zeroLevels);

  useEffect(() => {
    if (session.status === "idle") return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        void togglePlay();
      } else if (e.key === "Home") {
        player.seek(0);
        session.setTime(0);
      } else if (/^[1-7]$/.test(e.key)) {
        const id = STEM_IDS[Number(e.key) - 1];
        if (id) session.setStem(id, { mute: !session.stems[id].mute });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status, session.stems, session.playing, session.countIn]);

  useEffect(() => {
    if (!session.playing) return;
    let raf = 0;
    const tick = () => {
      const t = player.getTime();
      session.setTime(t);
      setLevels(player.levels());
      if (!useSession.getState().loopEnabled && t >= player.duration - 0.05) {
        player.pause();
        player.seek(player.duration);
        session.setPlaying(false);
        session.setTime(player.duration);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [session.playing]);

  async function togglePlay() {
    if (session.status !== "ready") return;
    if (session.playing) {
      player.pause();
      session.setPlaying(false);
      session.setTime(player.getTime());
      return;
    }
    if (session.countIn && player.getTime() < 0.05) {
      await player.countIn(session.song?.bpm ?? 100);
    }
    await player.play();
    session.setPlaying(true);
  }

  if (session.status === "idle") {
    return <Navigate to="/" />;
  }

  const muted = Object.fromEntries(
    STEM_IDS.map((id) => [id, session.stems[id].mute]),
  ) as Record<StemId, boolean>;

  const dissolving =
    session.status === "decoding" || session.status === "dissolving";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-20 pt-5 sm:px-5 sm:pt-6">
      <header className="flex items-center justify-between gap-3">
        <Link
          to="/"
          onClick={() => {
            player.stop();
            session.reset();
          }}
          className="inline-flex h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-4" />
          Library
        </Link>
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-subtle">
          <Armchair className="size-4 text-fg" strokeWidth={1.6} />
          Open Chair
        </span>
      </header>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            {session.song?.title ?? "Untitled"}
          </h1>
          {session.song && (
            <Badge>
              {session.song.isolation === "demo" ? "Arrangement demo" : "On-device split"}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted">
          {session.song?.subtitle}
          {session.song?.key !== "—" && ` · ${session.song?.key}`}
          {session.song?.bpm ? ` · ${session.song.bpm} BPM` : ""}
        </p>
      </div>

      {session.status === "error" && (
        <div className="rounded-xl bg-surface px-5 py-4 text-sm text-fg"
          style={{ boxShadow: "var(--shadow-border)" }}
        >
          <p>{session.error}</p>
          <Button asChild variant="secondary" size="sm" className="mt-3">
            <Link to="/" onClick={() => session.reset()}>
              Back to library
            </Link>
          </Button>
        </div>
      )}

      {dissolving && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">{session.progressLabel}</p>
          <div className="h-1 overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full bg-accent transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `${Math.round(session.progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      <Waveform
        peaks={session.peaks}
        mixPeak={session.mixPeak}
        duration={session.song?.duration ?? 0}
        currentTime={session.currentTime}
        muted={muted}
        dissolving={dissolving || session.status === "ready"}
        progress={dissolving ? session.progress : 1}
        loopEnabled={session.loopEnabled}
        loopStart={session.loopStart}
        loopEnd={session.loopEnd}
        onSeek={(t) => {
          if (session.status !== "ready") return;
          player.seek(t);
          session.setTime(t);
        }}
      />

      {session.status === "ready" && (
        <>
          <RoleRow
            active={session.activeRole}
            onPick={(id) => session.applyRole(id)}
          />
          <Transport
            playing={session.playing}
            currentTime={session.currentTime}
            duration={session.song?.duration ?? 0}
            rate={session.rate}
            loopEnabled={session.loopEnabled}
            countIn={session.countIn}
            onPlay={() => void togglePlay()}
            onStop={() => {
              player.stop();
              session.setPlaying(false);
              session.setTime(0);
            }}
            onSeek={(t) => {
              player.seek(t);
              session.setTime(t);
            }}
            onRate={(r) => session.setRate(r)}
            onToggleLoop={() => {
              const next = !session.loopEnabled;
              session.setLoop(next, 0, session.song?.duration ?? 0);
            }}
            onToggleCountIn={() => session.setCountIn(!session.countIn)}
            onExport={() => {
              const blob = player.exportMix(session.stems);
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `${session.song?.title ?? "open-chair"}-mix.wav`;
              a.click();
              URL.revokeObjectURL(a.href);
              toast.success("Mix downloaded");
            }}
          />
          <StemRack
            states={session.stems}
            levels={levels}
            onChange={(id, patch) => session.setStem(id, patch)}
          />
          <p className="text-xs leading-relaxed text-subtle">
            {session.song?.kind === "studio"
              ? "A synthesized arrangement for exploring the mixer. Each chair is rendered separately, so muting it removes that part completely."
              : "Experimental spectral split, processed on this device. It estimates parts from a finished mix; results vary, and stereo files usually separate better than mono."}{" "}
            Keys 1–7 mute chairs. Space plays.
          </p>
        </>
      )}
    </div>
  );
}
