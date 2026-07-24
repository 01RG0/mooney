"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/icons";

type Mode = "login" | "signup" | "pick-avatar" | "done";

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

// Map Firebase error codes to user-friendly messages.
function firebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/weak-password":
      return "Password must be at least 8 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed. Please try again.";
    case "auth/cancelled-popup-request":
      return "";
    default:
      return "Something went wrong. Please try again.";
  }
}

// ─── Spinner ────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-30"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

// ─── Google icon (colour) ────────────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// ─── AuthCard ────────────────────────────────────────────────────────────────

export function AuthCard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Prevents the auth redirect from firing during the post-signup avatar flow.
  const skipRedirect = useRef(false);

  // Redirect already-authenticated users to the shop.
  useEffect(() => {
    if (!loading && user && !skipRedirect.current) {
      router.replace("/shop");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-64 w-full max-w-md items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (mode === "done") {
    return (
      <div className="w-full max-w-md rounded-4xl border border-white/40 bg-white/30 px-8 py-10 shadow-[0_8px_40px_rgba(31,14,0,0.12)] backdrop-blur-xl transition-all duration-300 text-center">
        {selectedAvatar ? (
          <span className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full ring-2 ring-rose-400/40 ring-offset-2 ring-offset-transparent">
            <Image
              src={selectedAvatar}
              alt="Your profile"
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          </span>
        ) : (
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-400 text-white">
            <CheckIcon className="h-8 w-8" />
          </span>
        )}
        <h1 className="mt-4 font-display text-3xl font-semibold text-brown-900">
          Welcome to Meromade
        </h1>
        <p className="mt-2 font-script text-xl text-rose-400">
          your community awaits
        </p>
        <p className="mt-4 text-sm text-brown-700">
          Your account is ready. Start exploring artisan-made pieces from makers
          we know by name.
        </p>
        <ButtonLink
          href="/shop"
          size="lg"
          className="mt-6 w-full"
          onClick={() => { skipRedirect.current = false; }}
        >
          Browse the shop
          <ArrowRightIcon className="h-4 w-4" />
        </ButtonLink>
      </div>
    );
  }

  const isLogin = mode === "login";

  async function handleGoogleSignIn() {
    setAuthError("");
    setSubmitting(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      // onAuthStateChanged in AuthContext will update user → redirect fires.
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      const msg = firebaseErrorMessage(code);
      if (msg) setAuthError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword(email: string) {
    if (!email) {
      setAuthError("Enter your email address above, then click Forgot password.");
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setAuthError(""); // clear errors
      // Surface success via a dedicated message — reuse authError slot with a green variant
      // handled by the caller via a separate state; here we keep it simple.
      alert(`Password reset email sent to ${email}.`);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setAuthError(firebaseErrorMessage(code));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogin(
    email: string,
    password: string,
    remember: boolean,
  ) {
    setAuthError("");
    setSubmitting(true);
    try {
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence,
      );
      await signInWithEmailAndPassword(auth, email, password);
      // redirect handled by useEffect above
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setAuthError(firebaseErrorMessage(code));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignup(
    email: string,
    password: string,
    confirm: string,
    name: string,
    username: string,
    referral: string,
  ): Promise<boolean> {
    setAuthError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAuthError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return false;
    }
    if (password !== confirm) {
      setAuthError("Passwords do not match.");
      return false;
    }

    setSubmitting(true);
    skipRedirect.current = true;
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      try {
        const db = getFirestore();
        await setDoc(doc(db, "users", credential.user.uid), {
          name,
          username,
          referral,
          email,
          createdAt: new Date().toISOString(),
        });
      } catch {
        // profile save is best-effort; does not block signup
      }
      return true;
    } catch (err: unknown) {
      skipRedirect.current = false;
      const code = (err as { code?: string }).code ?? "";
      setAuthError(firebaseErrorMessage(code));
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-4xl border border-white/40 bg-white/30 px-8 py-10 shadow-[0_8px_40px_rgba(31,14,0,0.12)] backdrop-blur-xl transition-all duration-300">
      {mode === "pick-avatar" ? (
        <AvatarPicker
          onComplete={(avatar) => {
            setSelectedAvatar(avatar);
            setMode("done");
          }}
        />
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

          {/* Inline auth error */}
          {authError && (
            <p
              role="alert"
              className="mt-4 rounded-2xl border border-rose-300/50 bg-rose-50/70 px-4 py-2.5 text-sm text-rose-600"
            >
              {authError}
            </p>
          )}

          {/* Form */}
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => e.preventDefault()}
            noValidate
          >
            {isLogin ? (
              <LoginFields
                submitting={submitting}
                onSubmit={handleLogin}
                onForgotPassword={handleForgotPassword}
              />
            ) : (
              <SignupFields
                submitting={submitting}
                onSubmit={async (email, password, confirm, name, username, referral) => {
                  const ok = await handleSignup(email, password, confirm, name, username, referral);
                  if (ok) setMode("pick-avatar");
                }}
              />
            )}
          </form>

          {/* Divider + Google */}
          <div className="relative mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-brown-900/10" />
            <span className="shrink-0 text-xs text-brown-700/60">or</span>
            <div className="h-px flex-1 bg-brown-900/10" />
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleGoogleSignIn}
            className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-full border border-brown-900/15 bg-white/60 px-7 py-3 text-sm font-medium text-brown-900 transition-colors hover:border-brown-900/30 hover:bg-white/80 disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? (
              <Spinner />
            ) : (
              <GoogleIcon className="h-4 w-4 shrink-0" />
            )}
            Continue with Google
          </button>

          {/* Toggle */}
          <p className="mt-6 text-center text-sm text-brown-700">
            {isLogin ? "New here?" : "Already a member?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(isLogin ? "signup" : "login");
                setAuthError("");
              }}
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

// ─── AvatarPicker ─────────────────────────────────────────────────────────────

function AvatarPicker({
  onComplete,
}: {
  onComplete: (avatar: string | null) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
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

      <div className="mt-6 grid grid-cols-5 gap-3">
        {AVATARS.map((src) => (
          <button
            key={src}
            type="button"
            onClick={() => setSelected(src)}
            aria-label="Select profile picture"
            aria-pressed={selected === src}
            className={`group relative aspect-square overflow-hidden rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 ${
              selected === src
                ? "scale-105 ring-[3px] ring-rose-400 ring-offset-2 ring-offset-transparent"
                : "ring-2 ring-transparent hover:scale-105 hover:ring-brown-900/20"
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

      <div className="mt-8 flex flex-col gap-3">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!selected}
          onClick={() => onComplete(selected)}
        >
          Continue <ArrowRightIcon className="h-4 w-4" />
        </Button>
        <button
          type="button"
          onClick={() => onComplete(null)}
          className="text-center text-sm text-brown-700 transition-colors hover:text-brown-900"
        >
          Skip for now
        </button>
      </div>
    </>
  );
}

// ─── LoginFields ──────────────────────────────────────────────────────────────

function LoginFields({
  submitting,
  onSubmit,
  onForgotPassword,
}: {
  submitting: boolean;
  onSubmit: (email: string, password: string, remember: boolean) => void;
  onForgotPassword: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  return (
    <>
      <Field
        id="login-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <Field
        id="login-password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between pt-1 text-xs text-brown-700">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded accent-rose-400"
          />
          Remember me
        </label>
        <button
          type="button"
          onClick={() => onForgotPassword(email)}
          className="transition-colors hover:text-brown-900 focus-visible:underline"
        >
          Forgot password?
        </button>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="mt-2 w-full"
        disabled={submitting}
        onClick={() => onSubmit(email, password, remember)}
      >
        {submitting ? <Spinner /> : <>Log In <ArrowRightIcon className="h-4 w-4" /></>}
      </Button>
    </>
  );
}

// ─── SignupFields ─────────────────────────────────────────────────────────────

function SignupFields({
  submitting,
  onSubmit,
}: {
  submitting: boolean;
  onSubmit: (email: string, password: string, confirm: string, name: string, username: string, referral: string) => void;
}) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [referral, setReferral] = useState("");

  return (
    <>
      <Field
        id="signup-name"
        label="Full Name"
        type="text"
        value={name}
        onChange={setName}
        placeholder="Your name"
        autoComplete="name"
      />
      <Field
        id="signup-username"
        label="Username"
        type="text"
        value={username}
        onChange={setUsername}
        placeholder="e.g. basket_lover"
        autoComplete="username"
      />
      <Field
        id="signup-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <Field
        id="signup-password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        autoComplete="new-password"
      />
      <Field
        id="signup-confirm"
        label="Confirm Password"
        type="password"
        value={confirm}
        onChange={setConfirm}
        placeholder="••••••••"
        autoComplete="new-password"
      />

      <Dropdown
        label="How did you find us?"
        name="referral"
        options={HOW_OPTIONS}
        value={referral}
        onChange={setReferral}
      />

      <label className="flex cursor-pointer items-start gap-3 pt-1 text-xs text-brown-700">
        <input
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded accent-rose-400"
        />
        <span>
          I agree to the{" "}
          <a
            href="/terms"
            className="underline underline-offset-2 transition-colors hover:text-brown-900"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="underline underline-offset-2 transition-colors hover:text-brown-900"
          >
            Privacy Policy
          </a>
        </span>
      </label>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="mt-2 w-full"
        disabled={submitting}
        onClick={() => onSubmit(email, password, confirm, name, username, referral)}
      >
        {submitting ? (
          <Spinner />
        ) : (
          <>Create Account <ArrowRightIcon className="h-4 w-4" /></>
        )}
      </Button>
    </>
  );
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

function Dropdown({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
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
      <label
        id={`${name}-label`}
        className="mb-1.5 block text-sm font-medium text-brown-900"
      >
        {label}
      </label>
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${name}-label`}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 ${
          open
            ? "border-rose-400/60 bg-white/50"
            : "border-brown-900/15 bg-white/40 hover:border-brown-900/30"
        } ${value ? "text-brown-900" : "text-brown-700/50"}`}
      >
        <span>{value || "Select an option…"}</span>
        <ChevronIcon
          className={`h-4 w-4 shrink-0 text-brown-700 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-labelledby={`${name}-label`}
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-brown-900/10 bg-blush-50 shadow-[0_8px_32px_rgba(31,14,0,0.12)]"
        >
          {options.map((opt, i) => (
            <li key={opt} role="option" aria-selected={value === opt}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-rose-400/10 ${
                  i !== options.length - 1 ? "border-b border-brown-900/6" : ""
                } ${value === opt ? "font-medium text-rose-400" : "text-brown-900"}`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                    value === opt ? "bg-rose-400" : "bg-transparent"
                  }`}
                />
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  id,
  label,
  value,
  onChange,
  ...inputProps
}: {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange">) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-brown-900"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-brown-900/15 bg-white/40 px-4 py-3 text-sm text-brown-900 placeholder:text-brown-700/50 transition-colors focus:border-rose-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/20"
        {...inputProps}
      />
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  );
}
