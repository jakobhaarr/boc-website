import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/error-reporting";

/** Runs once when the server starts (Node and edge). Reports server errors to Sentry when SENTRY_DSN is set; see lib/error-reporting.ts. */
export function register() {
  Sentry.init(sentryOptions(process.env.SENTRY_DSN));
}

/** Next calls this for every error thrown while rendering, in a route or in a server action. */
export const onRequestError = Sentry.captureRequestError;
