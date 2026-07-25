/**
 * Lists all Firebase Auth users (up to 1000) with their email, uid, and custom claims.
 * Usage: node scripts/list-users.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const envLines = readFileSync(envPath, "utf8").split("\n");
for (const line of envLines) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length && !process.env[key.trim()]) {
    process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
  }
}

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)) });
}

const auth = getAuth();
const list = await auth.listUsers(1000);
console.log(`\nFound ${list.users.length} users:\n`);
for (const u of list.users) {
  const claims = u.customClaims ? JSON.stringify(u.customClaims) : "(none)";
  console.log(`  ${u.email ?? "(no email)"}  |  uid: ${u.uid}  |  claims: ${claims}`);
}
