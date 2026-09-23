"use client";

import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { reviewArticle, setHomepage } from "@/app/actions";
import { announceChange } from "@/components/public/live-refresh";
import { Button, buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function ContentActions({
  articleId,
  href,
  canReview,
  canFeature,
  onHomepage,
}: {
  articleId: string;
  href?: string;
  canReview: boolean;
  canFeature: boolean;
  onHomepage: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const act = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      announceChange();
      router.refresh();
    });

  return (
    <div className={cn("flex flex-wrap items-center gap-2 md:justify-end", pending && "opacity-60")}>
      {canReview && (
        <>
          <Button variant="secondary" size="sm" disabled={pending} onClick={() => act(() => reviewArticle(articleId, "reject"))}>
            Avvis
          </Button>
          <Button size="sm" disabled={pending} onClick={() => act(() => reviewArticle(articleId, "approve"))}>
            Godkjenn og publiser
          </Button>
        </>
      )}
      {canFeature && (
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => act(() => setHomepage(articleId, !onHomepage))}>
          {onHomepage ? "Fjern fra forsiden" : "Legg på forsiden"}
        </Button>
      )}
      {href && (
        <a href={href} target="_blank" rel="noreferrer" className={buttonClass({ variant: "ghost", size: "sm" })}>
          Vis <ArrowUpRight aria-hidden />
        </a>
      )}
    </div>
  );
}
