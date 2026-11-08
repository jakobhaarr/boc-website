import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";
import { scrubEvent, sentryOptions } from "../error-reporting";

const event = (over: Partial<ErrorEvent> = {}) => ({ type: undefined, ...over }) as ErrorEvent;

describe("scrubEvent: personal data never leaves with an error", () => {
  it("drops cookies, headers, body, query string and user", () => {
    const out = scrubEvent(
      event({
        request: { url: "https://x.no/a", cookies: { s: "1" }, headers: { cookie: "s=1" }, data: { name: "Kari" }, query_string: "epost=a@b.no" },
        user: { email: "a@b.no", id: "u1" },
      }),
    );
    expect(out.request).toEqual({ url: "https://x.no/a" });
    expect(out.user).toBeUndefined();
  });
  it("blanks e-mail addresses in messages, exception texts and breadcrumbs", () => {
    const out = scrubEvent(
      event({ message: "Kunne ikke sende til kari.nordmann@example.no", exception: { values: [{ value: "bad address ola@x.co" }] }, breadcrumbs: [{ message: "til a+b@c.org" }] }),
    );
    expect(out.message).toBe("Kunne ikke sende til [e-post fjernet]");
    expect(out.exception?.values?.[0].value).toBe("bad address [e-post fjernet]");
    expect(out.breadcrumbs?.[0].message).toBe("til [e-post fjernet]");
  });
  it("leaves an event without personal data alone", () => expect(scrubEvent(event({ message: "Timeout" })).message).toBe("Timeout"));
});

describe("sentryOptions", () => {
  it("is off without a DSN", () => expect(sentryOptions(undefined).enabled).toBe(false));
  it("sends errors only, with no default personal data", () => {
    const o = sentryOptions("https://key@o1.ingest.de.sentry.io/1");
    expect(o.tracesSampleRate).toBe(0);
    expect(o.sendDefaultPii).toBe(false);
    expect(o.beforeSend).toBe(scrubEvent);
  });
});
