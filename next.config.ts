import type { NextConfig } from "next";
import os from "os";

function localIPs(): string[] {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === "IPv4" && !iface.internal)
    .map((iface) => iface!.address);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: localIPs(),
  serverExternalPackages: ["firebase-admin", "jwks-rsa", "jose"],
  images: {
    remotePatterns: [
      // ImageKit CDN (avatars, product images, category images)
      { protocol: "https", hostname: "ik.imagekit.io" },
      // Google profile photos (Google sign-in avatars)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Firebase Storage (if used)
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
};

export default nextConfig;
