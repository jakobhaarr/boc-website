import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/error-reporting";

/** Reports errors in the browser to Sentry when NEXT_PUBLIC_SENTRY_DSN is set (a DSN is not secret; it only lets errors in). */
Sentry.init(sentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN));
