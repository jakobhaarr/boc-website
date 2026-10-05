import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { ExternalManager, type ExternalRow } from "@/components/admin/external-manager";
import { loadAdmin } from "@/lib/data/queries";
import { relativeTime } from "@/lib/dates";
import { externalUsage } from "@/lib/externals";
import { isClubAdmin } from "@/lib/permissions";
import { userById } from "@/lib/content";

export const metadata = { title: "Eksterne" };

export default async function ExternalsPage() {
  const { db, user, now } = await loadAdmin();
  if (!isClubAdmin(user)) redirect("/admin");

  const rows: ExternalRow[] = [...db.externals]
    .sort((a, b) => a.name.localeCompare(b.name, "nb"))
    .map((e) => ({
      id: e.id,
      name: e.name,
      note: e.note,
      photos: externalUsage(db, e.id),
      addedBy: userById(db, e.createdByUserId)?.name ?? "ukjent",
      added: relativeTime(e.createdAt, now),
    }));

  return (
    <div className="page pb-16">
      <AdminHeader
        title="Eksterne"
        description="Personer utenfor medlemsregisteret som klubben nevner, for eksempel en fotograf som har tatt et bilde. De legges til når noen laster opp et bilde, og trenger ikke annet enn et navn."
      />
      <ExternalManager rows={rows} />
    </div>
  );
}
