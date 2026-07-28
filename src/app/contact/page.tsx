"use client";

import { useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent("Suggestion from " + (name.trim() || "a visitor"));
    const body = encodeURIComponent(message.trim());
    // Use a hidden anchor click — most reliable way to trigger mailto: across browsers
    const a = document.createElement('a');
    a.href = `mailto:meromade@proton.me?subject=${subject}&body=${body}`;
    a.click();
    setSent(true);
  }

  return (
    <Container className="py-16 max-w-xl">
      <h1 className="font-display text-4xl font-semibold text-brown-900 mb-2">
        Got a suggestion?
      </h1>
      <p className="text-brown-700 font-sans text-sm mb-8">
        We'd love to hear from you — whether it's a product idea, feedback, or anything else on your mind.
      </p>

      {sent ? (
        <div className="rounded-3xl bg-rose-50 border border-rose-200 p-8 text-center">
          <p className="font-display text-xl text-brown-900 mb-1">Thank you!</p>
          <p className="text-sm font-sans text-brown-700">
            Your email client should have opened. We'll get back to you soon.
          </p>
          <p className="text-xs font-sans text-brown-700/60 mt-3">
            Didn't open? Email us directly at{" "}
            <a href="mailto:meromade@proton.me" className="text-rose-400 hover:underline">
              meromade@proton.me
            </a>
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-2xl bg-white/30 border border-white/40 p-4 text-center text-sm text-brown-700">
            Or email us directly at{" "}
            <a href="mailto:meromade@proton.me" className="text-rose-400 hover:underline font-medium">
              meromade@proton.me
            </a>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-brown-700 font-sans mb-1.5 uppercase tracking-wide">
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Sara"
              className="w-full rounded-2xl border border-brown-900/15 bg-white/60 px-4 py-3 text-sm text-brown-900 placeholder:text-brown-700/40 focus:border-rose-400/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brown-700 font-sans mb-1.5 uppercase tracking-wide">
              Your message <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="I'd love to see more of…"
              className="w-full rounded-2xl border border-brown-900/15 bg-white/60 px-4 py-3 text-sm text-brown-900 placeholder:text-brown-700/40 focus:border-rose-400/60 focus:outline-none resize-none"
            />
          </div>
          <button
            type="submit"
            className="self-start rounded-full bg-brown-900 px-7 py-3 text-sm font-medium text-blush-100 hover:opacity-90 transition-opacity"
          >
            Send suggestion
          </button>
        </form>
        </>
      )}
    </Container>
  );
}
