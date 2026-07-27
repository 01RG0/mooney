"use client";

import {
  getFirestore,
  doc,
  increment,
  setDoc,
  collection,
  addDoc,
} from "firebase/firestore";
import { auth } from "@/lib/firebase";

function uid(): string | undefined {
  return auth.currentUser?.uid;
}

// ─── Product view tracking ─────────────────────────────────────────────────
export async function trackProductView(productId: string, productSlug: string) {
  try {
    const db = getFirestore();
    // Aggregate counter (one doc per product)
    await setDoc(
      doc(db, "analytics", "productViews", "products", productId),
      { productId, slug: productSlug, views: increment(1) },
      { merge: true },
    );
    // Per-view event for logged-in users (richer analytics)
    const userId = uid();
    if (userId) {
      await addDoc(collection(db, "analytics", "productViews", "events"), {
        productId,
        slug: productSlug,
        userId,
        viewedAt: new Date().toISOString(),
      });
    }
  } catch {
    // non-fatal
  }
}

// ─── Search term tracking ──────────────────────────────────────────────────
export async function trackSearch(term: string) {
  if (!term.trim()) return;
  try {
    const db = getFirestore();
    const normalized = term.trim().toLowerCase();
    const userId = uid();
    // Aggregate counter
    await setDoc(
      doc(db, "analytics", "searchTerms", "terms", normalized),
      {
        term: normalized,
        count: increment(1),
        lastSearchedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    // Per-search event for logged-in users
    if (userId) {
      await addDoc(collection(db, "analytics", "searchTerms", "events"), {
        term: normalized,
        userId,
        searchedAt: new Date().toISOString(),
      });
    }
  } catch {
    // non-fatal
  }
}

// ─── Website page view tracking ─────────────────────────────────────────────

export async function trackPageView(path: string) {
  if (!path || path.startsWith("/admin")) return; // don't track admin views
  try {
    const db = getFirestore();
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Daily counter
    await setDoc(
      doc(db, "analytics", "pageViews", "daily", today),
      { date: today, count: increment(1) },
      { merge: true },
    );

    // Total counter
    await setDoc(
      doc(db, "analytics", "pageViews", "counters", "total"),
      { count: increment(1), updatedAt: new Date().toISOString() },
      { merge: true },
    );
  } catch {
    // non-fatal
  }
}

// ─── Cart event tracking ───────────────────────────────────────────────────
export type CartEventType = "add_to_cart" | "remove_from_cart" | "checkout_started";

export async function trackCartEvent(
  type: CartEventType,
  payload: {
    productId: string;
    productName: string;
    slug?: string;
    price: number;
    quantity: number;
    color?: string;
    orderId?: string;
  },
) {
  try {
    const db = getFirestore();
    await addDoc(collection(db, "analytics", "cartEvents", "events"), {
      type,
      userId: uid() ?? null,
      ...payload,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // non-fatal
  }
}
