import * as Sentry from "@sentry/nextjs";
import { SENTRY_OPTIONS } from "@/lib/sentry-options";

// Browser error tracking (runs before the app becomes interactive).
Sentry.init(SENTRY_OPTIONS);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
