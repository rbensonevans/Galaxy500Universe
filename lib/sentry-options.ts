// Sentry settings shared by the browser, server, and edge runtimes.
// The DSN only lets the app send error reports in; it is safe to ship to
// browsers. Reports are sent from the live site only, never from `next dev`.
export const SENTRY_OPTIONS = {
  dsn: "https://502fd62723be06b3bac2d017b14c3e93@o4512361250357248.ingest.us.sentry.io/4512361371009024",
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  // Errors only: Vercel Speed Insights covers performance, and no names,
  // emails, IP addresses, or request bodies are attached to reports.
  tracesSampleRate: 0,
  sendDefaultPii: false,
};
