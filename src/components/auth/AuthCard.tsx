"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";

type Mode = "login" | "signup" | "pick-avatar";

const HOW_OPTIONS = [
  "Instagram",
  "Pinterest",
  "A friend or family member",
  "Google search",
  "TikTok",
  "Other",
];

const AVATARS = [
  "/avatars/Gemini_Generated_Image_93euo293euo293eu.png",
  "/avatars/Gemini_Generated_Image_b2tz4ib2tz4ib2tz.png",
  "/avatars/Gemini_Generated_Image_c3skxqc3skxqc3sk.png",
  "/avatars/Gemini_Generated_Image_mf35uymf35uymf35.png",
  "/avatars/Gemini_Generated_Image_tt6dzatt6dzatt6d.png",
];

export function AuthCard() {
  const [mode, setMode] = useState<Mode>("login");
  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-md rounded-4xl border border-white/40 bg-white/30 px-8 py-10 shadow-[0_8px_40px_rgba(31,14,0,0.12)] backdrop-blur-xl transition-all duration-300">
      {mode === "pick-avatar" ? (
        <AvatarPicker />
      ) : (
        <>
          {/* Eyebrow badge */}
          <span className="inline-block rounded-full bg-blush-200/60 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-brown-700">
            Members · Makers Community
          </span>

          {/* Heading */}
          <h1 className="mt-3 font-display text-3xl font-semibold text-brown-900">
            {isLogin ? "Welcome Back" : "Join Meromade"}
          </h1>

          {/* Script subline */}
          <p className="mt-1 font-script text-xl text-rose-400">
            {isLogin ? "handmade, with care" : "made by hand"}
          </p>

          {/* Form */}
          <form
            className="mt-7 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!isLogin) setMode("pick-avatar");
            }}
          >
            {isLogin ? <LoginFields /> : <SignupFields />}
          </form>

          {/* Toggle */}
          <p className="mt-6 text-center text-sm text-brown-700">
            {isLogin ? "New here?" : "Already a member?"}{" "}
            <button
              type="button"
              onClick={() => setMode(isLogin ? "signup" : "login")}
              className="font-medium text-brown-900 underline underline-offset-2 transition-colors hover:text-rose-400"
            >
              {isLogin ? "Join Meromade" : "Log in"}
            </button>
          </p>
        </>
      )}
    </div>
  );
}

function AvatarPicker() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      {/* Eyebrow badge */}
      <span className="inline-block rounded-full bg-blush-200/60 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-brown-700">
        One last step
      </span>

      <h2 className="mt-3 font-display text-3xl font-semibold text-brown-900">
        Choose your look
      </h2>
      <p className="mt-1 font-script text-xl text-rose-400">your community face</p>

      <p className="mt-4 text-sm text-brown-700">
        Pick a profile image to represent you in the Meromade community.
      </p>

      {/* Avatar grid */}
      <div className="mt-6 grid grid-cols-5 gap-3">
        {AVATARS.map((src) => (
          <button
            key={src}
            type="button"
            onClick={() => setSelected(src)}
            className={`group relative aspect-square overflow-hidden rounded-full transition-all duration-200 focus:outline-none ${
              selected === src
                ? "ring-[3px] ring-rose-400 ring-offset-2 ring-offset-transparent scale-105"
                : "ring-2 ring-transparent hover:ring-brown-900/20 hover:scale-105"
            }`}
          >
            <Image
              src={src}
              alt="Profile option"
              fill
              sizes="72px"
              className="object-cover"
            />
            {selected === src && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-rose-400/20">
                <CheckCircleIcon className="h-5 w-5 text-white drop-shadow" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Skip / Continue */}
      <div className="mt-8 flex flex-col gap-3">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!selected}
        >
          Continue <ArrowRightIcon className="h-4 w-4" />
        </Button>
        <button
          type="button"
          className="text-center text-sm text-brown-700 transition-colors hover:text-brown-900"
        >
          Skip for now
        </button>
      </div>
    </>
  );
}

function LoginFields() {
  return (
    <>
      <Field label="Email" type="email" name="email" placeholder="you@example.com" autoComplete="email" />
      <Field label="Password" type="password" name="password" placeholder="••••••••" autoComplete="current-password" />

      <div className="flex items-center justify-between pt-1 text-xs text-brown-700">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" className="h-4 w-4 rounded accent-rose-400" />
          Remember me
        </label>
        <button type="button" className="transition-colors hover:text-brown-900">
          Forgot password?
        </button>
      </div>

      <Button type="submit" variant="primary" size="lg" className="mt-2 w-full">
        Log In <ArrowRightIcon className="h-4 w-4" />
      </Button>
    </>
  );
}

function SignupFields() {
  return (
    <>
      <Field label="Full Name" type="text" name="name" placeholder="Your name" autoComplete="name" />
      <Field label="Username" type="text" name="username" placeholder="e.g. basket_lover" autoComplete="username" />
      <Field label="Email" type="email" name="email" placeholder="you@example.com" autoComplete="email" />
      <Field label="Password" type="password" name="password" placeholder="••••••••" autoComplete="new-password" />
      <Field label="Confirm Password" type="password" name="confirm" placeholder="••••••••" autoComplete="new-password" />

      <Dropdown label="How did you find us?" name="referral" options={HOW_OPTIONS} />

      <label className="flex cursor-pointer items-start gap-3 pt-1 text-xs text-brown-700">
        <input
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded accent-rose-400"
        />
        <span>
          I agree to the{" "}
          <a href="/terms" className="underline underline-offset-2 transition-colors hover:text-brown-900">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline underline-offset-2 transition-colors hover:text-brown-900">
            Privacy Policy
          </a>
        </span>
      </label>

      <Button type="submit" variant="primary" size="lg" className="mt-2 w-full">
        Create Account <ArrowRightIcon className="h-4 w-4" />
      </Button>
    </>
  );
}

function Dropdown({ label, name, options }: { label: string; name: string; options: string[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-brown-900">{label}</label>
      <input type="hidden" name={name} value={selected} />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400/20 ${
          open
            ? "border-rose-400/60 bg-white/50"
            : "border-brown-900/15 bg-white/40 hover:border-brown-900/30"
        } ${selected ? "text-brown-900" : "text-brown-700/50"}`}
      >
        <span>{selected || "Select an option…"}</span>
        <ChevronIcon className={`h-4 w-4 shrink-0 text-brown-700 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-brown-900/10 bg-blush-50 shadow-[0_8px_32px_rgba(31,14,0,0.12)]">
          {options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              onClick={() => { setSelected(opt); setOpen(false); }}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-rose-400/10 ${
                i !== options.length - 1 ? "border-b border-brown-900/6" : ""
              } ${selected === opt ? "font-medium text-rose-400" : "text-brown-900"}`}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${selected === opt ? "bg-rose-400" : "bg-transparent"}`} />
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, ...inputProps }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brown-900">{label}</label>
      <input
        className="w-full rounded-2xl border border-brown-900/15 bg-white/40 px-4 py-3 text-sm text-brown-900 placeholder:text-brown-700/50 transition-colors focus:border-rose-400/60 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
        {...inputProps}
      />
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  );
}
