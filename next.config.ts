import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let phones on the local network use the dev server at this laptop's LAN
  // address (dev-only; Next 16 blocks unknown origins from dev assets/HMR).
  // Update if the laptop's IP changes (`ipconfig getifaddr en0`).
  allowedDevOrigins: ["10.187.166.33"],
};

export default nextConfig;
