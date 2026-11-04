import { AdminHeader } from "@/components/admin/bits";
import { FeedbackPanel } from "@/components/admin/feedback-panel";
import { formatDayMonth, relativeTime } from "@/lib/dates";
import { loadAdmin } from "@/lib/data/queries";

export const metadata = { title: "Tilbakemelding" };

/** TEMPORARY (lib/leader-tasks.ts): a user's own feedback to the web administrator, as many as they like. */
export default async function FeedbackPage() {
  const { db, user, now } = await loadAdmin();
  const rows = db.feedback
    .filter((f) => f.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((f) => ({ id: f.id, topic: f.topic, message: f.message, page: f.page, images: f.images, when: relativeTime(f.createdAt, now) || formatDayMonth(f.createdAt.slice(0, 10)), edited: !!f.updatedAt }));
  return (
    <div className="page pb-16">
      <AdminHeader title="Tilbakemelding" description="Fortell oss hva som fungerer og hva som ikke gjør det. Du kan sende flere, og endre eller slette dem senere. Bare nettsideansvarlig leser dem." />
      <div className="max-w-2xl">
        <FeedbackPanel rows={rows} />
      </div>
    </div>
  );
}
