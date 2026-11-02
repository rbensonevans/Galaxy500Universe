// TEMPORARY: throws so we can confirm server errors reach Sentry. Remove after
// the first test event shows up.
export function GET() {
  throw new Error("Sentry test error from /api/sentry-test");
}
