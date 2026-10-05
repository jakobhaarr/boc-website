import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConsentAnswer } from "@/components/public/consent-answer";
import { Section } from "@/components/ui/guides";
import { loadSite } from "@/lib/data/queries";

// The link is private and works for one person: it must not be found or kept by search engines.
export const metadata: Metadata = { title: "Samtykke til bilder", robots: { index: false, follow: false } };

/**
 * Where a person answers a request to be shown in pictures (the link in the
 * mail, ConsentRequest.token). It shows the pictures and the two answers, with
 * no sign-in. A request that has been answered shows the answer instead.
 */
export default async function ConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { db, org } = await loadSite();
  const request = db.consentRequests.find((r) => r.token === token);
  if (!request) notFound();
  const person = db.people.find((p) => p.id === request.personId);
  if (!person || person.privacy.status === "anonymised") notFound();
  const photos = request.photoIds.map((id) => db.photos.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  const where = org.get(photos[0]?.nodeId ?? "")?.name ?? db.club.shortName;

  return (
    <Section className="py-12 lg:py-16">
      <div className="page">
        <div className="max-w-[40rem]">
          <p className="t-eyebrow">Samtykke til bilder</p>
          <h1 className="mt-3 t-h2">Kan vi bruke {photos.length === 1 ? "bildet" : "bildene"} av {person.firstName}?</h1>
          <p className="mt-4 t-body text-ink-2">
            {db.club.name} vil legge ut {photos.length === 1 ? "dette bildet" : `disse ${photos.length} bildene`} på nettsiden til {where}. {person.firstName} kan kjennes igjen på {photos.length === 1 ? "det" : "dem"}. Bildene ligger ikke ute før du har sagt ja. Er {person.firstName} under 18 år, svarer du som forelder eller foresatt.
          </p>
          <ul className="mt-6 grid gap-3">
            {photos.map((p) => (
              <li key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.alt} width={p.width} height={p.height} className="h-auto w-full rounded-lg ring-1 ring-line" />
              </li>
            ))}
          </ul>
          <div className="mt-8">
            {request.status === "pending" ? (
              <ConsentAnswer token={token} firstName={person.firstName} />
            ) : (
              <p role="status" className="rounded-md bg-sunken px-4 py-3 t-body text-ink">
                {request.status === "granted" ? "Du har sagt ja til bildene." : `Du har sagt nei, og bildene av ${person.firstName} brukes ikke.`}
              </p>
            )}
          </div>
          <p className="mt-6 t-small text-ink-3">
            Svaret gjelder bare {photos.length === 1 ? "dette bildet" : "disse bildene"}. Du kan når som helst be klubben ta et bilde ned: skriv til {db.club.email}.
          </p>
        </div>
      </div>
    </Section>
  );
}
