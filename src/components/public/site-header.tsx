"use client";

import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buttonClass, HoverArrow } from "@/components/ui/button";
import { Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { Photo as PhotoRecord } from "@/lib/types";
import { ClubCrest, type ClubLogo } from "./crest";
import { Photo } from "./photo";
import { SportsMenu } from "./sports-menu";

export interface NavItem {
  id: string;
  name: string;
  audience?: string;
  requirement?: string;
  href: string;
}

export interface NavSection {
  id: string;
  name: string | null;
  href?: string;
  items: NavItem[];
}

export interface NavSport {
  id: string;
  name: string;
  href: string;
  summary?: string;
  ages?: string;
  photo?: PhotoRecord;
  sections: NavSection[];
}

interface Props {
  clubName: string;
  letters: string;
  logo?: ClubLogo;
  sports: NavSport[];
  /** "Idretter" for a multi-sport club, "Grupper" when the club has one sport. */
  menuLabel?: string;
  /** Clubs without groups for children have no barn-og-ungdom page to point at. */
  hasYouth?: boolean;
  /** The club's theme paints the header (ClubTheme.header); see .header-dark. */
  darkHeader?: boolean;
  contact: { email: string; phone: string };
}

/**
 * Public navigation. Identity left, the club's destinations centred, one
 * action right. "Idretter" opens a floating panel with a rail of sports;
 * only the sport you point at is laid out (see SportsMenu). "Barn og
 * ungdom" sits beside it because the two answer the same question from
 * opposite sides — what the club offers, and what it offers a child. On
 * phones the same structure lives in a full-height sheet with expandable
 * sports.
 */
export function SiteHeader({ clubName, letters, logo = "crest", sports, menuLabel = "Idretter", hasYouth, darkHeader, contact }: Props) {
  const pathname = usePathname();
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<number | undefined>(undefined);

  // Close menus on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMegaOpen(false);
    setMobileOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMegaOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setMegaOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [megaOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  // Hover intent for mouse users; touch and keyboard use the button.
  const hoverOpen = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setMegaOpen(true), 80);
  };
  const hoverClose = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setMegaOpen(false), 200);
  };

  const sportActive = sports.some((s) => pathname === s.href || pathname.startsWith(`${s.href}/`));
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const item =
    "relative inline-flex h-9 items-center gap-1 rounded-md px-2.5 text-[14px] font-medium tracking-[-0.006em] whitespace-nowrap transition-colors duration-150 xl:px-3.5";
  const idle = "text-ink-2 hover:bg-sunken hover:text-ink";
  const current = "bg-sunken text-ink";

  return (
    <>
      <header
        ref={headerRef}
        onPointerLeave={hoverClose}
        className={cn(
          "sticky top-0 z-50 isolate transition-shadow duration-200",
          darkHeader ? "bg-[var(--header-bg)]" : "bg-bg",
          scrolled && !megaOpen && !mobileOpen && "shadow-[0_6px_20px_-18px_rgb(13_26_43/0.5)]",
        )}
      >
        {logo === "wordmark" && (
          <Link
            href="/"
            aria-label={`${clubName}, til forsiden`}
            className="absolute top-0 left-0 z-10 flex h-[var(--header-h)] w-[calc(max(var(--page-gutter),calc(50vw-640px))+170px)] items-center bg-club-surface text-club focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-action sm:w-[calc(max(var(--page-gutter),calc(50vw-640px))+198px)]"
            style={{
              paddingLeft: "max(var(--page-gutter), calc(50vw - 640px))",
              clipPath: "polygon(0 0, 100% 0, calc(100% - 28px) 100%, 0 100%)",
            }}
          >
            <ClubCrest letters={letters} logo={logo} className="h-5 w-auto lg:h-7" />
            {[38, 24, 10].map((right) => (
              <span
                key={right}
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-9 bg-action sm:hidden"
                style={{
                  right,
                  clipPath: "polygon(28px 0, 36px 0, 8px 100%, 0 100%)",
                }}
              />
            ))}
            {[50, 30, 10].map((right) => (
              <span
                key={right}
                aria-hidden
                className="pointer-events-none absolute inset-y-0 hidden w-9 bg-action sm:block"
                style={{
                  right,
                  clipPath: "polygon(28px 0, 36px 0, 8px 100%, 0 100%)",
                }}
              />
            ))}
          </Link>
        )}
        <div className={cn("page relative grid h-[var(--header-h)] grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]", darkHeader && "header-dark")}>
          {logo === "wordmark" ? (
            <span aria-hidden />
          ) : (
            <Link href="/" className="-ml-1.5 flex items-center gap-2.5 justify-self-start rounded-md p-1.5" aria-label={`${clubName}, til forsiden`}>
              <ClubCrest letters={letters} logo={logo} className="h-9 w-auto text-club" />
              <span className="font-display text-[18px] leading-none font-semibold tracking-[-0.02em]">{clubName}</span>
            </Link>
          )}

          <nav aria-label="Hovedmeny" className="max-lg:hidden">
            <ul className="flex items-center gap-0.5">
              <li>
                <Link href="/aktiviteter" aria-current={isActive("/aktiviteter") ? "page" : undefined} className={cn(item, isActive("/aktiviteter") ? current : idle)}>
                  Aktiviteter
                </Link>
              </li>
              <li onPointerEnter={hoverOpen}>
                <button
                  ref={triggerRef}
                  type="button"
                  aria-expanded={megaOpen}
                  aria-controls="idretter-meny"
                  onClick={() => setMegaOpen((o) => !o)}
                  className={cn(item, "[perspective:200px]", megaOpen || sportActive ? current : idle)}
                >
                  {menuLabel}
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      "size-3.5 text-ink-3 transition-transform duration-300 [transform-style:preserve-3d]",
                      megaOpen && "[transform:rotateX(180deg)]",
                    )}
                  />
                </button>
              </li>
              {[
                ...(hasYouth ? [["/barn-og-ungdom", "Barn og ungdom"]] : []),
                ["/nyheter", "Nyheter"],
                ["/om-klubben", "Om klubben"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} aria-current={isActive(href) ? "page" : undefined} className={cn(item, isActive(href) ? current : idle)}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center justify-end gap-1.5">
            <Link href="/logg-inn" className={cn(item, idle, "max-lg:hidden")}>
              Logg inn
            </Link>
            <Link
              href="/bli-med"
              className={cn(
                buttonClass({ size: "sm", brand: true }),
                // Opts into the header's own action colours, so the wordmark's
                // slashes keep the club's.
                darkHeader && "[--action-hover:var(--header-action-hover)] [--action:var(--header-action)] [--on-action:var(--on-header-action)]",
                "max-sm:hidden",
              )}
            >
              Bli medlem
              <HoverArrow />
            </Link>
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobilmeny"
              aria-label={mobileOpen ? "Lukk meny" : "Åpne meny"}
              onClick={() => setMobileOpen((o) => !o)}
              className="inline-flex size-10 items-center justify-center rounded-md text-ink shadow-[inset_0_0_0_1px_var(--border)] transition-colors hover:bg-sunken lg:hidden"
            >
              {mobileOpen ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
            </button>
          </div>

          {/* Sports panel */}
          <div
            id="idretter-meny"
            inert={!megaOpen}
            onPointerEnter={hoverOpen}
            className={cn(
              "menu-pop absolute top-[calc(100%-10px)] left-1/2 z-50 w-[min(60rem,calc(100vw-4rem))] -translate-x-1/2 pt-3 max-lg:hidden",
              megaOpen && "is-open",
            )}
          >
            <div className="overflow-hidden bg-surface shadow-popover ring-1 ring-line">
              <SportsMenu
                sports={sports}
                open={megaOpen}
                label={menuLabel}
                initialIndex={Math.max(0, sports.findIndex((s) => isActive(s.href)))}
              />
              <div className="flex items-center justify-between gap-6 border-t border-line bg-sunken px-6 py-3.5 t-small">
                <span className="text-ink-2">Usikker på hva som passer? Velg alder, så viser vi gruppene.</span>
                <span className="flex items-center gap-6">
                  <Link href="/aktiviteter" className="inline-flex items-center font-medium text-ink-2 hover:text-ink">
                    Aktivitetskalender
                    <HoverArrow />
                  </Link>
                  <Link href="/#finn-aktivitet" className="inline-flex items-center font-medium text-club hover:text-club-hover">
                    Finn din aktivitet
                    <HoverArrow />
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* While the sports panel is open, everything under the header goes to
          frosted glass, so the panel is the only thing in focus. It is only
          a veil: a press on it lands outside the header and closes the panel
          through the pointerdown handler above. */}
      <div
        aria-hidden
        className={cn(
          "fixed inset-x-0 top-[var(--header-h)] bottom-0 z-40 bg-[rgb(13_26_43/0.18)] backdrop-blur-md transition-opacity duration-200 max-lg:hidden",
          megaOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Phone navigation: stays mounted so its group photos load ahead of
          time (see .sheet-pop, globals.css) instead of after the sheet opens. */}
      <div
        id="mobilmeny"
        role="dialog"
        aria-modal="true"
        aria-label="Meny"
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        className={cn("sheet-pop fixed inset-x-0 top-[var(--header-h)] bottom-0 z-40 overflow-y-auto overscroll-contain bg-bg lg:hidden", mobileOpen && "is-open")}
      >
        <nav className="page flex min-h-full flex-col pt-3 pb-8" aria-label="Hovedmeny">
          <ul className="-mx-3">
            <MobileLink href="/aktiviteter" label="Aktiviteter" />
            {hasYouth && <MobileLink href="/barn-og-ungdom" label="Barn og ungdom" />}
            <MobileLink href="/nyheter" label="Nyheter" />
            <MobileLink href="/om-klubben" label="Om klubben" />
            <MobileLink href="/bli-med" label="Bli medlem" />
          </ul>

          <p className="mt-6 mb-2 t-meta text-ink-3">{menuLabel}</p>
          <ul className="divide-y divide-line overflow-hidden rounded-lg bg-surface shadow-[inset_0_0_0_1px_var(--border)]">
            {sports.map((s) => (
              <li key={s.id}>
                <details className="disclosure group/m">
                  <summary className="flex cursor-pointer items-center gap-3.5 p-3">
                    {s.photo && <Photo photo={s.photo} ratio={1} sizes="48px" grade={false} priority className="size-12 shrink-0 rounded-md" />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-semibold tracking-[-0.012em]">{s.name}</span>
                      {s.ages && <span className="block t-small text-ink-3">{s.ages}</span>}
                    </span>
                    <ChevronDown aria-hidden className="size-5 text-ink-3 transition-transform duration-200 group-open/m:rotate-180" />
                  </summary>
                  <div className="border-t border-line bg-sunken px-3 pt-3 pb-4">
                    <Link href={s.href} className="inline-flex items-center t-small font-medium text-club">
                      Alt om {s.name.toLowerCase()}
                      <HoverArrow />
                    </Link>
                    {s.sections.map((sec) => (
                      <div key={sec.id} className="mt-3">
                        {sec.name && <p className="t-meta text-ink-3">{sec.name}</p>}
                        <ul className="-mx-2 mt-1">
                          {sec.items.map((i) => (
                            <li key={i.id}>
                              <Link href={i.href} className="flex min-h-11 min-w-0 flex-col justify-center gap-1 rounded-md px-2 py-1.5 t-body text-ink active:bg-muted">
                                <span className="min-w-0 truncate">{i.name}</span>
                                {(i.audience || i.requirement) && (
                                  <span className="flex flex-wrap gap-1">
                                    {i.audience && <Status tone="club">{i.audience}</Status>}
                                    {i.requirement && <Status tone="danger">{i.requirement}</Status>}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </details>
              </li>
            ))}
          </ul>

          <div className="mt-auto grid gap-2 pt-8">
            <Link href="/#finn-aktivitet" className={buttonClass({ size: "lg", block: true, brand: true })}>
              Finn din aktivitet
              <HoverArrow />
            </Link>
            <Link href="/logg-inn" className={buttonClass({ variant: "secondary", size: "lg", block: true })}>
              Logg inn for lag og trenere
            </Link>
            <p className="mt-4 text-center t-small text-ink-3">
              <a href={`mailto:${contact.email}`} className="link">
                {contact.email}
              </a>
              {" · "}
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="link tnum">
                {contact.phone}
              </a>
            </p>
          </div>
        </nav>
      </div>
    </>
  );
}

function MobileLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="flex h-12 items-center justify-between rounded-md px-3 text-[17px] font-medium tracking-[-0.012em] active:bg-sunken">
        {label}
        <ChevronRight aria-hidden className="size-5 text-ink-3" />
      </Link>
    </li>
  );
}
