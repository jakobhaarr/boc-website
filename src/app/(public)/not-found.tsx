import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page py-24 lg:py-32">
      <p className="t-label text-ink-3">404</p>
      <h1 className="mt-2 t-h1">Siden finnes ikke</h1>
      <p className="mt-4 max-w-[48ch] t-body text-ink-2">
        Lenken kan være gammel, eller gruppen kan ha fått nytt navn. Du finner alle idretter og grupper fra forsiden.
      </p>
      <div className="mt-8 flex flex-wrap gap-2.5">
        <ButtonLink href="/" brand>
          Til forsiden
        </ButtonLink>
        <ButtonLink href="/aktiviteter" variant="secondary" brand slant="both">
          Aktiviteter
        </ButtonLink>
      </div>
    </div>
  );
}
