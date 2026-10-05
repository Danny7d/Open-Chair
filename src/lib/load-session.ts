import {
  MAX_DURATION_SEC,
  MAX_UPLOAD_BYTES,
  decodeAudioFile,
  peaksFromBuffer,
  splitOnDevice,
} from "@/lib/audio/unmix";
import { player } from "@/lib/audio/player";
import {
  renderStudioSong,
  studioMeta,
  type StudioSong,
} from "@/lib/audio/studio";
import { useSession } from "@/store/session";

export async function openStudioTrack(
  id: StudioSong["studioId"],
): Promise<void> {
  player.stop();
  const meta = studioMeta(id);
  useSession.getState().setStatus("dissolving", {
    song: meta,
    progress: 0.06,
    progressLabel: "Setting the chairs…",
    error: null,
  });
  useSession.setState({ playing: false, currentTime: 0, peaks: null, mixPeak: null });
  try {
    const buffers = await renderStudioSong(id, (p) => {
      useSession.getState().setStatus("dissolving", {
        song: meta,
        progress: Math.max(0.06, p),
        progressLabel: "Pulling the room apart…",
      });
    });
    useSession
      .getState()
      .loadReady({ ...meta, duration: buffers.lead.duration }, buffers);
  } catch (err) {
    useSession.getState().setStatus("error", {
      error:
        err instanceof Error ? err.message : "Could not build the studio cut.",
    });
  }
}

export async function openUploadedFile(file: File): Promise<void> {
  player.stop();

  if (file.size > MAX_UPLOAD_BYTES) {
    useSession.getState().setStatus("error", {
      error: "Keep the file under 28 MB.",
      song: null,
    });
    return;
  }

  const song = {
    id: `upload-${Date.now()}`,
    title: file.name.replace(/\.[^.]+$/, ""),
    subtitle: "Your mix",
    bpm: 120,
    key: "—",
    duration: 0,
    kind: "upload" as const,
    isolation: "split" as const,
  };

  useSession.getState().setStatus("decoding", {
    song,
    progress: 0.04,
    progressLabel: "Reading the tape…",
    error: null,
  });
  useSession.setState({ playing: false, currentTime: 0, peaks: null, mixPeak: null });

  try {
    await player.resume();
    const ctx = player.ctx;
    if (!ctx) throw new Error("Audio is not ready yet.");
    const decoded = await decodeAudioFile(ctx, file);
    if (decoded.duration > MAX_DURATION_SEC) {
      useSession.getState().setStatus("error", {
        error: "Keep it under six minutes for an on-device split.",
      });
      return;
    }
    const mixPeak = peaksFromBuffer(decoded);
    useSession.getState().setStatus("dissolving", {
      song: { ...song, duration: decoded.duration },
      progress: 0.08,
      progressLabel: "Dissolving the mix…",
    });
    useSession.setState({ mixPeak });
    const buffers = await splitOnDevice(ctx, decoded, (p) => {
      useSession.getState().setStatus("dissolving", {
        song: { ...song, duration: decoded.duration },
        progress: 0.08 + p * 0.9,
        progressLabel: "Separating chairs…",
      });
    });
    useSession
      .getState()
      .loadReady({ ...song, duration: decoded.duration }, buffers, decoded);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not read that audio file.";
    useSession.getState().setStatus("error", {
      error: /decode/i.test(message)
        ? "That file could not be decoded. Try WAV, MP3, or M4A."
        : message,
    });
  }
}

export function isAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  return /\.(mp3|wav|m4a|aac|ogg|flac|webm)$/i.test(file.name);
}
