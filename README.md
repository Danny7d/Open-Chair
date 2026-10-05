# Open Chair

**Mute the part you want to play. Sit in.**

Open Chair is a browser-based "music minus one" tool. Drop in a song, and it
estimates separate parts of the mix (lead vocal, backing vocals, drums, bass,
guitar, keys, and the rest). Mute the part you want to play or sing, then
practice along with everything else.

**Live demo:** https://open-chair-one.vercel.app

Everything runs on your device. Audio is decoded and processed in the browser,
and uploaded files are never sent to a server.

## Features

- **Seven "chairs":** lead vocal, features (backing vocals), drums, bass,
  guitar, piano/keys, and other. Each has its own level slider, mute, and solo.
- **Role presets:** Singer, Guitarist, Bassist, Drummer, Keys, or Full mix.
  One tap mutes the part you play.
- **Practice tools:** loop a section, count-in, and speed control
  (0.75x, 0.9x, 1x, 1.1x).
- **Export:** download the current mix (respecting your mutes and levels)
  as a WAV file.
- **Keyboard shortcuts:** `Space` play/pause, `Home` jump to start,
  `1` to `7` toggle each chair.
- **Three demo songs** so you can try the mixer without uploading anything.

## How it works (and what to expect)

Uploaded songs go through a spectral split that runs in a Web Worker
(`src/lib/audio/unmix-core.ts`). It is **classical signal processing, not a
machine-learning model**:

1. Short-time Fourier transform (2048-point FFT, hop 512, Hann window).
2. Mid/side analysis to find content panned to the center, which is where lead
   vocals usually sit.
3. Harmonic/percussive separation with median filters, to split sustained
   sounds from drum hits.
4. Hand-tuned frequency masks to assign the rest to bass, guitar, and keys.
5. Inverse FFT and overlap-add to rebuild each part.

What that means in practice:

- **Treat every stem as an estimate.** Vocals, drums, and bass separate best.
  Guitar and keys are mostly frequency-band guesses, and instruments sharing a
  range will bleed into each other. Expect audible artifacts.
- **Stereo works better than mono.** The vocal extraction depends on left and
  right differing, so a mono recording can't be split that way.
- **Output stems are mono.**
- **Speed control also shifts pitch.** There is no pitch-preserving time
  stretch yet.
- **Limits:** uploads up to 28 MB and 6 minutes.

The three **Studio cuts** are different: they are synthesized in the browser
(`src/lib/audio/studio.ts`), with each instrument rendered separately. Muting
one removes it completely, which makes them a good way to explore the mixer but
not a preview of how a real upload will sound.

## Run it locally

Requires Node.js 20.19+ or 22.12+ (a Vite requirement).

```bash
npm install
npm run dev
```

The dev server starts on http://localhost:8080.

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the dev server                  |
| `npm run build`     | Production build                      |
| `npm run typecheck` | Type-check with `tsc`                 |
| `npm run lint`      | Lint with ESLint                      |
| `npm run format`    | Format with Prettier                  |
| `npm test`          | Run the test suites (see note below)  |

**About `npm test`:** a handful of the scaffold's share-card/PWA metadata tests
currently fail, and they failed before any cleanup. There are no tests for the
audio code yet.

No environment variables are needed. `.grok/app-env.json` sets
`VITE_AUTH_ENABLED=false` for local dev and build, so there is no sign-in.

## Stack

TanStack Start and Router, React 19, Vite, Tailwind CSS 4, Radix UI, Zustand,
the Web Audio API, and a Web Worker for the heavy DSP. Deployed on Vercel.

## Project layout

```
src/
  components/app/   mixer UI: stem rack, transport, waveform, home and session views
  lib/audio/        FFT, spectral split (unmix-core), worker, player, demo synth
  lib/stems.ts      stem definitions, role presets, gain logic
  store/session.ts  playback and mixer state (Zustand)
  routes/           app routes
scripts/            build, preview, and check scripts
```

`src/lib/auth`, `src/lib/app-data`, and `src/lib/multiplayer` are dormant code
from the app scaffold. Sign-in is disabled and nothing in the app uses them.

## Status and ideas

This is an early prototype. Things worth doing next:

- Replace the heuristic split with an on-device ML model for better stems.
- Pitch-preserving speed control, plus key shifting for singers.
- Record yourself over the backing track.
- Lyrics display.

## Copyright

Open Chair processes files you provide, on your device. Only use music you have
the right to use.
