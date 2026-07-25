/**
 * Sets role: "admin" custom claim on a Firebase Auth user by email.
 *
 * Usage:
 *   node scripts/set-admin.mjs radomgamerx999@gmail.com
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY in .env.local
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (mirrors init-firestore.mjs pattern)
const envPath = resolve(__dirname, "../.env.local");
const envLines = readFileSync(envPath, "utf8").split("\n");
for (const line of envLines) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length && !process.env[key.trim()]) {
    process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
  }
}

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error("❌  FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) });
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/set-admin.mjs <email>");
  process.exit(1);
}

async function main() {
  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { role: "admin" });
  console.log(`✅  role: "admin" set on ${email} (uid: ${user.uid})`);
  console.log(
    "⚠️   The user must sign out and sign back in for the new claim to take effect."
  );
}

main().catch((err) => {
  console.error("❌  Error:", err.message);
  process.exit(1);
});
