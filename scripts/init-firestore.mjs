/**
 * Initializes all Firestore collections with a _init placeholder document.
 * Run once: node scripts/init-firestore.mjs
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY in .env.local
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (no dotenv needed)
const envPath = resolve(__dirname, "../.env.local");
const envLines = readFileSync(envPath, "utf8").split("\n");
for (const line of envLines) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length && !process.env[key.trim()]) {
    process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
  }
}

const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!key) {
  console.error("❌  FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(key)) });
}

const db = getFirestore();

// Top-level collections to initialize
const TOP_LEVEL = [
  "users",
  "products",
  "categories",
  "orders",
  "reviews",
  "wishlists",
  "coupons",
  "stockAlerts",
];

// Nested: analytics parent doc + its sub-collections
const ANALYTICS_SUBCOLLECTIONS = [
  { parent: "productViews", sub: "products" },
  { parent: "searchTerms",  sub: "terms"    },
  { parent: "cartEvents",   sub: "events"   },
  { parent: "pageViews",    sub: "daily"    },
  { parent: "pageViews",    sub: "counters" },
];

async function initCollection(ref, label) {
  const docRef = ref.doc("_init");
  const snap = await docRef.get();
  if (snap.exists) {
    console.log(`  ✓ ${label} — already exists, skipped`);
    return;
  }
  await docRef.set({
    _init: true,
    _note: "Placeholder to create collection. Safe to delete once real data exists.",
    createdAt: new Date().toISOString(),
  });
  console.log(`  ✓ ${label} — created`);
}

async function main() {
  console.log("\n🔥  Initializing Firestore collections…\n");

  for (const name of TOP_LEVEL) {
    await initCollection(db.collection(name), name);
  }

  // analytics parent docs + sub-collections
  for (const { parent, sub } of ANALYTICS_SUBCOLLECTIONS) {
    // The parent "analytics/<parent>" is a document, not a collection
    const parentRef = db.collection("analytics").doc(parent);
    const parentSnap = await parentRef.get();
    if (!parentSnap.exists) {
      await parentRef.set({
        _init: true,
        _note: "Analytics namespace document.",
        createdAt: new Date().toISOString(),
      });
      console.log(`  ✓ analytics/${parent} — created`);
    } else {
      console.log(`  ✓ analytics/${parent} — already exists, skipped`);
    }

    // Sub-collection under the analytics doc
    await initCollection(
      parentRef.collection(sub),
      `analytics/${parent}/${sub}`
    );
  }

  // notifications is a sub-collection per user — nothing to init at the top level
  console.log(`  - notifications — per-user sub-collection, no top-level init needed`);

  console.log("\n✅  Done! You can now delete the _init documents from the Firebase console.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌  Error:", err.message);
  process.exit(1);
});
