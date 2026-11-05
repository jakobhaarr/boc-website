import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin-auth";
import { isHeldHost } from "@/lib/holding";
import { DEMO_COOKIE, userIdFromDemoToken } from "@/lib/demo-login";
import { accessTokenExpired, refreshTokens, SESSION_ACCESS_COOKIE, SESSION_REFRESH_COOKIE, sessionCookie } from "@/lib/supabase-auth";

/**
 * Admin pages need either the shared password (lib/admin-auth.ts) or a
 * session from signing in by code (lib/supabase-auth.ts) before they render.
 * This only looks at whether a cookie is there and renews an expired access
 * token, since a page cannot set cookies; who the cookie belongs to is
 * decided by `signedIn` in lib/session.ts, on the page and again in every
 * server action, since an action is a POST that can be sent from anywhere.
 */
export async function proxy(request: NextRequest) {
  // The club's own domain shows only the holding page until SITE_LIVE is on (lib/holding.ts). The page itself and the
  // build output it needs stay reachable; the rest, API and admin included, is answered with 503.
  if (isHeldHost(request.headers.get("host")) && request.nextUrl.pathname !== "/under-arbeid") {
    const held = NextResponse.rewrite(new URL("/under-arbeid", request.url), { status: 503 });
    held.headers.set("Retry-After", "3600");
    held.headers.set("X-Robots-Tag", "noindex");
    return held;
  }
  if (!request.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();

  const accessToken = request.cookies.get(SESSION_ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(SESSION_REFRESH_COOKIE)?.value;
  const hasPassword = (await isAdminToken(request.cookies.get(ADMIN_COOKIE)?.value)) || !!(await userIdFromDemoToken(request.cookies.get(DEMO_COOKIE)?.value)); // a valid demo sign-in (lib/demo-login.ts) counts too

  if (refreshToken && (!accessToken || accessTokenExpired(accessToken))) {
    const tokens = await refreshTokens(refreshToken);
    if (tokens) {
      // The page that renders next must see the new cookies too, not only the browser.
      request.cookies.set(SESSION_ACCESS_COOKIE, tokens.accessToken);
      request.cookies.set(SESSION_REFRESH_COOKIE, tokens.refreshToken);
      const response = NextResponse.next({ request });
      response.cookies.set(SESSION_ACCESS_COOKIE, tokens.accessToken, sessionCookie());
      response.cookies.set(SESSION_REFRESH_COOKIE, tokens.refreshToken, sessionCookie());
      return response;
    }
    // The session is over (signed out elsewhere, deactivated): forget it.
    const response = hasPassword ? NextResponse.next() : redirectToLogin(request);
    response.cookies.delete(SESSION_ACCESS_COOKIE);
    response.cookies.delete(SESSION_REFRESH_COOKIE);
    return response;
  }

  if (hasPassword || accessToken) return NextResponse.next();
  return redirectToLogin(request);
}

function redirectToLogin(request: NextRequest) {
  const login = new URL("/logg-inn", request.url);
  login.searchParams.set("neste", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except the build output and files with an extension (images, fonts, PDFs in public/): the holding page needs the whole site's paths, the admin check below only /admin.
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
