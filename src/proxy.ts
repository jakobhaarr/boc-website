import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin-auth";

/**
 * Admin pages ask for the shared password (lib/admin-auth.ts) before they
 * render. The server actions check it again themselves, since an action is
 * a POST that can be sent from anywhere.
 */
export async function proxy(request: NextRequest) {
  if (await isAdminToken(request.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.next();
  const login = new URL("/logg-inn", request.url);
  login.searchParams.set("neste", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
