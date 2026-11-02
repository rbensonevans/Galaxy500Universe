import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Made during the XRP LEDGER HACKATHON
  // Let phones on the local network use the dev server at this laptop's LAN
  // address (dev-only; Next 16 blocks unknown origins from dev assets/HMR).
  // Update if the laptop's IP changes (`ipconfig getifaddr en0`).
  allowedDevOrigins: ["10.187.166.33"],
};

// Sentry error tracking. Browser reports go through /monitoring on our own
// domain so ad blockers don't drop them (excluded from the proxy matcher).
// Source maps aren't uploaded yet (needs a SENTRY_AUTH_TOKEN in Vercel).
export default withSentryConfig(nextConfig, {
  org: "galaxy500universe",
  project: "galaxy500universe",
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
  telemetry: false,
});
