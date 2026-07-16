"use client";

import { useEffect, useState } from "react";

/**
 * Dev-only theme editor. Two tabs:
 *   • Aurora  — the background streak colours + speed/intensity (--aurora-*)
 *   • Palette — every brand colour token (--color-*) used across the page
 *
 * It overrides the CSS variables on <html> (which is where Tailwind v4's
 * @theme tokens live), so every utility class updates live. Values persist to
 * localStorage and there's a copy-paste readout to hand back and bake in as the
 * shipped defaults. Rendered only in development.
 */

const HEX = /^#([0-9a-fA-F]{6})$/;

// ---- Palette tokens (must mirror the @theme defaults in globals.css) --------
type Token = { var: string; label: string; hint?: string; def: string };
type Group = { name: string; tokens: Token[] };

const PALETTE: Group[] = [
  {
    name: "Grounds",
    tokens: [
      { var: "--color-blush-50", label: "Blush 50", def: "#fbf1f0" },
      { var: "--color-blush-100", label: "Blush 100", def: "#f7e5e3" },
      { var: "--color-blush-200", label: "Blush 200", hint: "page bg", def: "#f1d6d3" },
      { var: "--color-blush-300", label: "Blush 300", def: "#ffd1d1" },
      { var: "--color-cream", label: "Cream", hint: "cards", def: "#dd9c9c" },
      { var: "--color-sand", label: "Sand", def: "#ead9c7" },
    ],
  },
  {
    name: "Accent",
    tokens: [
      { var: "--color-rose-300", label: "Rose 300", def: "#f0cbc7" },
      { var: "--color-rose-400", label: "Rose 400", hint: "primary", def: "#944a19" },
      { var: "--color-rose-500", label: "Rose 500", def: "#ed91a4" },
      { var: "--color-coral", label: "Coral", def: "#ecc4c1" },
    ],
  },
  {
    name: "Ink",
    tokens: [
      { var: "--color-brown-700", label: "Brown 700", def: "#291919" },
      { var: "--color-brown-800", label: "Brown 800", def: "#43280e" },
      { var: "--color-brown-900", label: "Brown 900", hint: "text / band", def: "#1f0e00" },
      { var: "--color-ink", label: "Ink", def: "#291c15" },
    ],
  },
];

const ALL_TOKENS = PALETTE.flatMap((g) => g.tokens);

// ---- Settings ---------------------------------------------------------------
type Aurora = {
  c1: string;
  c2: string;
  c3: string;
  fade: string;
  speed: number; // 0.5 (slower) … 2 (faster)
  opacity: number; // 0.2 … 1
};
type Settings = { aurora: Aurora; palette: Record<string, string> };

const DEFAULTS: Settings = {
  aurora: { c1: "#f0c7d3", c2: "#8f7361", c3: "#ecb5c7", fade: "#f0b7ce", speed: 0.6, opacity: 1 },
  palette: Object.fromEntries(ALL_TOKENS.map((t) => [t.var, t.def])),
};

const KEY = "mooney-theme-editor:v1";

function apply(s: Settings) {
  const root = document.documentElement.style;
  root.setProperty("--aurora-c1", s.aurora.c1);
  root.setProperty("--aurora-c2", s.aurora.c2);
  root.setProperty("--aurora-c3", s.aurora.c3);
  root.setProperty("--aurora-fade", s.aurora.fade);
  // Higher UI speed → shorter duration, so invert into the multiplier.
  root.setProperty("--aurora-speed", String(1 / s.aurora.speed));
  root.setProperty("--aurora-opacity", String(s.aurora.opacity));
  for (const t of ALL_TOKENS) {
    root.setProperty(t.var, s.palette[t.var] ?? t.def);
  }
}

export function AuroraEditor() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"aurora" | "palette">("aurora");
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [copied, setCopied] = useState(false);

  // Sync from localStorage on mount — setState here is intentional (external system).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const next: Settings =
        parsed?.aurora && parsed?.palette
          ? {
              aurora: { ...DEFAULTS.aurora, ...parsed.aurora },
              palette: { ...DEFAULTS.palette, ...parsed.palette },
            }
          : DEFAULTS;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setS(next);
    } catch {
      // corrupt storage — keep DEFAULTS
    }
  }, []);

  // Apply CSS vars and persist whenever s changes (after hydration).
  useEffect(() => {
    apply(s);
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s]);

  const setAurora = (patch: Partial<Aurora>) =>
    setS((prev) => ({ ...prev, aurora: { ...prev.aurora, ...patch } }));
  const setToken = (name: string, value: string) =>
    setS((prev) => ({ ...prev, palette: { ...prev.palette, [name]: value } }));
  const resetAll = () => setS(DEFAULTS);

  const readout =
    tab === "aurora"
      ? [
          `--aurora-c1: ${s.aurora.c1};   /* Streak A */`,
          `--aurora-c2: ${s.aurora.c2};   /* Streak B */`,
          `--aurora-c3: ${s.aurora.c3};   /* Streak C */`,
          `--aurora-fade: ${s.aurora.fade};`,
          `speed: ${s.aurora.speed.toFixed(2)}x`,
          `intensity: ${s.aurora.opacity.toFixed(2)}`,
        ].join("\n")
      : ["@theme {", ...ALL_TOKENS.map((t) => `  ${t.var}: ${s.palette[t.var] ?? t.def};`), "}"].join(
          "\n",
        );

  async function copy() {
    try {
      await navigator.clipboard.writeText(readout);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-brown-900 px-4 py-2.5 text-sm font-medium text-blush-100 shadow-lg hover:bg-brown-800"
      >
        <span aria-hidden>🎨</span> Theme editor
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-h-[85vh] w-[20rem] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-brown-900/15 bg-cream shadow-2xl">
      {/* Header + tabs */}
      <div className="shrink-0 border-b border-brown-900/10 px-4 pt-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-brown-900">Theme editor</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close editor"
            className="rounded-full px-2 py-1 text-sm text-brown-700 hover:bg-brown-900/8"
          >
            ✕
          </button>
        </div>
        <div className="mt-2 flex gap-1">
          <Tab active={tab === "aurora"} onClick={() => setTab("aurora")}>
            Aurora
          </Tab>
          <Tab active={tab === "palette"} onClick={() => setTab("palette")}>
            Palette
          </Tab>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {tab === "aurora" ? (
          <div className="space-y-3">
            <ColorRow label="Streak A" value={s.aurora.c1} onChange={(v) => setAurora({ c1: v })} />
            <ColorRow label="Streak B" value={s.aurora.c2} onChange={(v) => setAurora({ c2: v })} />
            <ColorRow label="Streak C" value={s.aurora.c3} onChange={(v) => setAurora({ c3: v })} />
            <ColorRow
              label="Edge fade"
              hint="usually = page bg"
              value={s.aurora.fade}
              onChange={(v) => setAurora({ fade: v })}
            />
            <Slider
              label="Speed"
              min={0.5}
              max={2}
              step={0.05}
              suffix="x"
              value={s.aurora.speed}
              onChange={(v) => setAurora({ speed: v })}
            />
            <Slider
              label="Intensity"
              min={0.2}
              max={1}
              step={0.05}
              value={s.aurora.opacity}
              onChange={(v) => setAurora({ opacity: v })}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {PALETTE.map((group) => (
              <div key={group.name} className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-brown-700">
                  {group.name}
                </h3>
                {group.tokens.map((t) => (
                  <ColorRow
                    key={t.var}
                    label={t.label}
                    hint={t.hint}
                    value={s.palette[t.var] ?? t.def}
                    onChange={(v) => setToken(t.var, v)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Readout + actions */}
      <div className="shrink-0 border-t border-brown-900/10 px-4 py-3">
        <textarea
          readOnly
          aria-label={`${tab === "aurora" ? "Aurora" : "Palette"} CSS output`}
          value={readout}
          onFocus={(e) => e.currentTarget.select()}
          className="h-24 w-full resize-none rounded-lg border border-brown-900/15 bg-blush-50 p-2 font-mono text-[11px] leading-relaxed text-brown-900"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={copy}
            className="flex-1 rounded-full bg-rose-400 px-3 py-2 text-sm font-medium text-white hover:bg-rose-500"
          >
            {copied ? "Copied ✓" : `Copy ${tab}`}
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="rounded-full border border-brown-900/20 px-3 py-2 text-sm text-brown-800 hover:bg-brown-900/5"
          >
            Reset all
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-brown-700">
          Tweak until you like it, hit Copy, then paste the values to me to bake
          them in as the defaults.
        </p>
      </div>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-t-lg px-3 py-1.5 text-sm font-medium " +
        (active
          ? "bg-cream text-brown-900 ring-1 ring-inset ring-brown-900/10"
          : "text-brown-700 hover:text-brown-900")
      }
    >
      {children}
    </button>
  );
}

function ColorRow({
  label,
  value,
  hint,
  onChange,
}: {
  label: string;
  value: string;
  hint?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-brown-900/15 bg-transparent p-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-medium text-brown-900">{label}</span>
          {hint && <span className="shrink-0 text-[10px] text-brown-700">{hint}</span>}
        </div>
      </div>
      <input
        type="text"
        aria-label={`${label} hex value`}
        value={value}
        spellCheck={false}
        onChange={(e) => {
          const v = e.target.value.trim();
          if (HEX.test(v)) onChange(v);
        }}
        className="w-20 rounded-md border border-brown-900/15 bg-blush-50 px-2 py-1 font-mono text-xs text-brown-900"
      />
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  suffix = "",
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-brown-900">{label}</span>
        <span className="font-mono text-xs text-brown-700">
          {value.toFixed(2)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-rose-500"
      />
    </label>
  );
}
