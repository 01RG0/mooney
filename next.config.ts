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
};

export default nextConfig;
