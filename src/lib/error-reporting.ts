import type { ErrorEvent } from "@sentry/nextjs";
import { appEnv } from "./env";

/**
 * Error reporting to Sentry (instrumentation.ts on the server, instrumentation-client.ts in the browser). Off without a DSN, and
 * off on a developer's machine. Only errors are sent: no performance tracing, no session replay.
 *
 * The site holds personal data (members, children, sign-ups, consent), so what leaves is cut down to the error itself: no cookies,
 * headers, request bodies, query strings or user, and anything that looks like an e-mail address is blanked in the texts
 * (`scrubEvent`). The Sentry project should be in the EU region.
 */

const EMAIL = /[^\s@"'<>()]+@[^\s@"'<>()]+\.[^\s@"'<>()]+/g;
const blank = (text: string) => text.replace(EMAIL, "[e-post fjernet]");

export function scrubEvent<T extends ErrorEvent>(event: T): T {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.data;
    delete event.request.query_string;
  }
  delete event.user;
  if (event.message) event.message = blank(event.message);
  for (const ex of event.exception?.values ?? []) if (ex.value) ex.value = blank(ex.value);
  for (const crumb of event.breadcrumbs ?? []) if (crumb.message) crumb.message = blank(crumb.message);
  return event;
}

export function sentryOptions(dsn: string | undefined) {
  const environment = appEnv();
  return {
    dsn,
    enabled: !!dsn && environment !== "development",
    environment,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend: scrubEvent,
  };
}
