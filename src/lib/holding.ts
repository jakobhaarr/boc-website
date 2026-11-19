/**
 * TEMPORARY holding page for the club's own domain while the site is made ready (test users and demo quotes cleared).
 *
 * On the hosts in HOLD_HOSTS every request is answered with /under-arbeid (status 503, noindex), see src/proxy.ts. Other
 * hosts (boc.jakobjolstad.com, the Vercel address, localhost) show the real site as usual, so admin can be used there in the
 * meantime. It holds by default: the site opens on the club's domain only when the environment variable SITE_LIVE is set
 * to «on» (Vercel › Settings › Environment Variables, then redeploy). Remove this file, the page and the proxy check when
 * the domain has been live for a while.
 */
export const HOLD_HOSTS = ["baerumock.no", "www.baerumock.no"];

export const isHeldHost = (host: string | null | undefined) => {
  if (process.env.SITE_LIVE?.trim().toLowerCase() === "on") return false;
  return HOLD_HOSTS.includes((host ?? "").split(":")[0].toLowerCase());
};

/**
 * Pages that open on the held hosts anyway, while the rest of the domain shows the holding page. The page's own server
 * actions are posted to the same path, so they pass too; build output and files are outside the proxy already.
 *
 *   /strategi/2027-2030  the working page for the strategy (lib/strategy-2027-2030.ts), sent as a link to the
 *                        participants of the strategy meeting. Remove it from the list when the page has served its turn.
 */
export const OPEN_PATHS = ["/strategi/2027-2030"];

export const isOpenPath = (pathname: string) => OPEN_PATHS.includes(pathname.replace(/\/+$/, "") || "/");
