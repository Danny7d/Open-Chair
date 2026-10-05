import { i as __toESM } from "../_runtime.mjs";
import { c as require_react, s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Navigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as ArrowLeft, a as Square, c as Pause, f as Headphones, h as Download, o as Repeat, s as Play, t as VolumeX, v as Armchair } from "../_libs/lucide-react.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/@radix-ui/react-slider+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { a as cn, d as useSession, i as STEM_IDS, l as player, n as STEMS, r as STEM_BY_ID, s as formatTime, t as Button } from "./button-Cr--ncUy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/session-yEoIwao6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide", {
	variants: { variant: {
		default: "bg-elevated text-muted shadow-[var(--shadow-border)]",
		solid: "bg-accent text-accent-fg",
		ghost: "bg-transparent text-muted shadow-[var(--shadow-border)]"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
function Waveform({ peaks, mixPeak, duration, currentTime, muted, dissolving = false, progress = 0, loopEnabled, loopStart = 0, loopEnd = 0, onSeek }) {
	const canvasRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
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
				const cy = restY + (layerH * i + layerH / 2 - restY) * split;
				const amp = layerH * .42 * (.35 + .65 * split);
				const color = getComputedStyle(canvas).getPropertyValue(STEM_BY_ID[id].colorVar);
				ctx.globalAlpha = muted[id] ? .18 : .55 + .35 * split;
				ctx.strokeStyle = color.trim() || "#d8d4cc";
				ctx.lineWidth = 1;
				ctx.beginPath();
				for (let x = 0; x < w; x++) {
					const y = cy - (data[Math.min(data.length - 1, Math.floor(x / w * data.length))] ?? 0) * amp;
					if (x === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				}
				for (let x = w - 1; x >= 0; x--) {
					const v = data[Math.min(data.length - 1, Math.floor(x / w * data.length))] ?? 0;
					ctx.lineTo(x, cy + v * amp);
				}
				ctx.closePath();
				ctx.fillStyle = ctx.strokeStyle;
				ctx.globalAlpha = muted[id] ? .06 : .16 + .1 * split;
				ctx.fill();
				ctx.globalAlpha = muted[id] ? .2 : .7;
				ctx.stroke();
			});
			if (duration > 0) {
				const x = currentTime / duration * w;
				ctx.globalAlpha = 1;
				ctx.strokeStyle = "rgba(243,241,236,0.85)";
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(x, 0);
				ctx.lineTo(x, h);
				ctx.stroke();
			}
			if (loopEnabled && duration > 0) {
				const x0 = loopStart / duration * w;
				const x1 = loopEnd / duration * w;
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
		loopEnd
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("relative h-44 w-full overflow-hidden rounded-lg bg-elevated sm:h-56"),
		style: { boxShadow: "var(--shadow-border)" },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "block h-full w-full cursor-pointer",
			onClick: (e) => {
				if (!onSeek || duration <= 0) return;
				const rect = e.currentTarget.getBoundingClientRect();
				onSeek((e.clientX - rect.left) / rect.width * duration);
			}
		})
	});
}
function Slider({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
		"data-slot": "slider",
		className: cn("relative flex w-full touch-none items-center select-none", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
			className: "relative h-1 w-full grow overflow-hidden rounded-full bg-elevated",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full bg-accent" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-3.5 rounded-full bg-fg shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:pointer-events-none" })]
	});
}
function StemRack({ states, levels, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "flex flex-col gap-2",
		children: STEMS.map((stem) => {
			const st = states[stem.id];
			const silent = st.mute || Object.values(states).some((s) => s.solo) && !st.solo;
			const Icon = stem.icon;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: cn("grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg bg-surface px-3 py-2.5 sm:grid-cols-[auto_7.5rem_1fr_auto] sm:gap-4 sm:px-4", silent && "opacity-55"),
				style: { boxShadow: "var(--shadow-border)" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-9 items-center justify-center rounded-sm bg-elevated",
						style: { color: `var(${stem.colorVar})` },
						"aria-hidden": true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							className: "size-4",
							strokeWidth: 1.75
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm font-medium text-fg",
							children: stem.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hidden truncate text-xs text-subtle sm:block",
							children: stem.hint
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "col-span-3 flex items-center gap-3 sm:col-span-1 sm:col-start-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
							"aria-label": `${stem.label} level`,
							min: 0,
							max: 1,
							step: .01,
							value: [st.volume],
							onValueChange: ([v]) => onChange(stem.id, { volume: v ?? 0 }),
							className: "min-w-0 flex-1"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
							value: silent ? 0 : levels[stem.id] ?? 0,
							colorVar: stem.colorVar
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1 justify-self-end",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconToggle, {
							pressed: st.solo,
							label: `Solo ${stem.short}`,
							onPressed: () => onChange(stem.id, { solo: !st.solo }),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Headphones, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconToggle, {
							pressed: st.mute,
							label: `Mute ${stem.short}`,
							onPressed: () => onChange(stem.id, { mute: !st.mute }),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" })
						})]
					})
				]
			}, stem.id);
		})
	});
}
function IconToggle({ pressed, label, onPressed, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-pressed": pressed,
		"aria-label": label,
		onClick: onPressed,
		className: cn("relative flex size-11 items-center justify-center rounded-sm text-muted transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-fg active:scale-[0.96]", pressed && "bg-elevated text-fg"),
		children
	});
}
function Meter({ value, colorVar }) {
	const h = Math.min(1, value * 4);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		"aria-hidden": true,
		className: "relative h-7 w-1.5 overflow-hidden rounded-full bg-elevated",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "absolute inset-x-0 bottom-0 rounded-full transition-[height] duration-75",
			style: {
				height: `${h * 100}%`,
				background: `var(${colorVar})`
			}
		})
	});
}
function Transport({ playing, currentTime, duration, rate, loopEnabled, countIn, onPlay, onStop, onSeek, onRate, onToggleLoop, onToggleCountIn, onExport }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3 rounded-xl bg-surface p-4",
		style: { boxShadow: "var(--shadow-border)" },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-10 text-xs tabular-nums text-muted",
					children: formatTime(currentTime)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					"aria-label": "Seek",
					min: 0,
					max: Math.max(.01, duration),
					step: .01,
					value: [Math.min(currentTime, duration)],
					onValueChange: ([v]) => onSeek(v ?? 0)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-10 text-right text-xs tabular-nums text-muted",
					children: formatTime(duration)
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						"aria-label": playing ? "Pause" : "Play",
						onClick: onPlay,
						children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "ml-0.5 size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "secondary",
						"aria-label": "Stop",
						onClick: onStop,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: loopEnabled ? "default" : "secondary",
						"aria-label": "Loop",
						"aria-pressed": loopEnabled,
						onClick: onToggleLoop,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: countIn ? "default" : "secondary",
						"aria-pressed": countIn,
						onClick: onToggleCountIn,
						children: "Count-in"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center gap-2 text-xs text-muted",
					children: ["Speed", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: String(rate),
						onChange: (e) => onRate(Number(e.target.value)),
						className: "h-9 rounded-sm bg-elevated px-2 text-fg shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "0.75",
								children: "0.75×"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "0.9",
								children: "0.9×"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "1",
								children: "1×"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "1.1",
								children: "1.1×"
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: onExport,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), "Mix"]
				})]
			})]
		})]
	});
}
function RoleRow({ active, onPick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1",
		children: [
			["karaoke", "Karaoke"],
			["singer", "Singer"],
			["harmony", "Harmony"],
			["guitarist", "Guitarist"],
			["bassist", "Bassist"],
			["drummer", "Drummer"],
			["keys", "Keys"],
			["full", "Full mix"]
		].map(([id, label]) => {
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => onPick(id),
				className: cn("h-10 shrink-0 rounded-full px-3.5 text-sm font-medium transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.96]", active === id ? "bg-accent text-accent-fg" : "bg-elevated text-muted hover:text-fg"),
				children: label
			}, id);
		})
	});
}
var zeroLevels = Object.fromEntries(STEM_IDS.map((id) => [id, 0]));
function SessionView() {
	const session = useSession();
	const [levels, setLevels] = (0, import_react.useState)(zeroLevels);
	(0, import_react.useEffect)(() => {
		if (session.status === "idle") return;
		const onKey = (e) => {
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
			if (e.code === "Space") {
				e.preventDefault();
				togglePlay();
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
	}, [
		session.status,
		session.stems,
		session.playing,
		session.countIn
	]);
	(0, import_react.useEffect)(() => {
		if (!session.playing) return;
		let raf = 0;
		const tick = () => {
			const t = player.getTime();
			session.setTime(t);
			setLevels(player.levels());
			if (!useSession.getState().loopEnabled && t >= player.duration - .05) {
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
		if (session.countIn && player.getTime() < .05) await player.countIn(session.song?.bpm ?? 100);
		await player.play();
		session.setPlaying(true);
	}
	if (session.status === "idle") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	const muted = Object.fromEntries(STEM_IDS.map((id) => [id, session.stems[id].mute]));
	const dissolving = session.status === "decoding" || session.status === "dissolving";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-24 pt-6 sm:px-5 sm:pt-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					onClick: () => {
						player.stop();
						session.reset();
					},
					className: "inline-flex h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-fg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), "Library"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-2 text-xs uppercase tracking-widest text-subtle",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Armchair, {
						className: "size-4 text-fg",
						strokeWidth: 1.6
					}), "Open Chair"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-3xl tracking-tight sm:text-4xl",
						children: session.song?.title ?? "Untitled"
					}), session.song && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: session.song.isolation === "true" ? "True stems" : "On-device split" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						session.song?.subtitle,
						session.song?.key !== "—" && ` · ${session.song?.key}`,
						session.song?.bpm ? ` · ${session.song.bpm} BPM` : ""
					]
				})]
			}),
			session.status === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl bg-surface px-5 py-4 text-sm text-fg",
				style: { boxShadow: "var(--shadow-border)" },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: session.error }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "secondary",
					size: "sm",
					className: "mt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						onClick: () => session.reset(),
						children: "Back to library"
					})
				})]
			}),
			dissolving && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: session.progressLabel
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-1 overflow-hidden rounded-full bg-elevated",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full bg-accent transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
						style: { width: `${Math.round(session.progress * 100)}%` }
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waveform, {
				peaks: session.peaks,
				mixPeak: session.mixPeak,
				duration: session.song?.duration ?? 0,
				currentTime: session.currentTime,
				muted,
				dissolving: dissolving || session.status === "ready",
				progress: dissolving ? session.progress : 1,
				loopEnabled: session.loopEnabled,
				loopStart: session.loopStart,
				loopEnd: session.loopEnd,
				onSeek: (t) => {
					if (session.status !== "ready") return;
					player.seek(t);
					session.setTime(t);
				}
			}),
			session.status === "ready" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleRow, {
					active: session.activeRole,
					onPick: (id) => session.applyRole(id)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Transport, {
					playing: session.playing,
					currentTime: session.currentTime,
					duration: session.song?.duration ?? 0,
					rate: session.rate,
					loopEnabled: session.loopEnabled,
					countIn: session.countIn,
					onPlay: () => void togglePlay(),
					onStop: () => {
						player.stop();
						session.setPlaying(false);
						session.setTime(0);
					},
					onSeek: (t) => {
						player.seek(t);
						session.setTime(t);
					},
					onRate: (r) => session.setRate(r),
					onToggleLoop: () => {
						const next = !session.loopEnabled;
						session.setLoop(next, 0, session.song?.duration ?? 0);
					},
					onToggleCountIn: () => session.setCountIn(!session.countIn),
					onExport: () => {
						const blob = player.exportMix(session.stems);
						const a = document.createElement("a");
						a.href = URL.createObjectURL(blob);
						a.download = `${session.song?.title ?? "open-chair"}-mix.wav`;
						a.click();
						URL.revokeObjectURL(a.href);
						toast.success("Mix downloaded");
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StemRack, {
					states: session.stems,
					levels,
					onChange: (id, patch) => session.setStem(id, patch)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs leading-relaxed text-subtle",
					children: [
						session.song?.kind === "studio" ? "Each chair is a true stem from the studio session. Mute is complete — the part is gone." : "Split on-device. Vocals, drums, and bass isolate most cleanly. Stereo mixes work better than mono.",
						" ",
						"Keys 1–7 mute chairs. Space plays."
					]
				})
			] })
		]
	});
}
function Session() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionView, {}) });
}
//#endregion
export { Session as component };
