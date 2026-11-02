import * as Sentry from "@sentry/nextjs";
import { SENTRY_OPTIONS } from "@/lib/sentry-options";

// Server and edge error tracking. Next.js calls register() once per runtime
// and onRequestError for every uncaught error in pages, route handlers, server
// actions, and the proxy.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(SENTRY_OPTIONS);
  }
}

export const onRequestError = Sentry.captureRequestError;
