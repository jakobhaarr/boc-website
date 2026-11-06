import { AdminHeader } from "@/components/admin/bits";
import { TaskList, type TaskRow } from "@/components/admin/task-list";
import { loadAdmin } from "@/lib/data/queries";
import { assignable, sortTasks } from "@/lib/club-tasks";
import { isClubAdmin } from "@/lib/permissions";
import { userById } from "@/lib/content";
import { topRoleSummary } from "@/lib/user-admin";
import { todayISO } from "@/lib/dates";

export const metadata = { title: "Oppgaver" };

/**
 * The club's task list. A club administrator (chair, club administrator, web administrator) sees all tasks and makes and
 * gives them out; everyone else sees the tasks given to them, moves them along and may hand them on (lib/club-tasks.ts).
 */
export default async function TasksPage() {
  const { db, org, user } = await loadAdmin();
  const admin = isClubAdmin(user);
  const mine = (assignee?: string) => assignee === user.id;
  const rows: TaskRow[] = sortTasks(db.tasks.filter((t) => admin || mine(t.assigneeUserId))).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? "",
    dueDate: t.dueDate ?? "",
    status: t.status,
    assigneeUserId: t.assigneeUserId ?? "",
    assigneeName: t.assigneeUserId ? (userById(db, t.assigneeUserId)?.name ?? "Ukjent bruker") : "",
    createdBy: userById(db, t.createdByUserId)?.name ?? "Ukjent",
    mine: mine(t.assigneeUserId),
    doneBy: t.completedByUserId ? (userById(db, t.completedByUserId)?.name ?? "") : "",
    doneOn: t.completedAt?.slice(0, 10) ?? "",
  }));
  const people = assignable(db)
    .map((u) => ({ id: u.id, name: u.name, detail: topRoleSummary(org, u) }))
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));
  return (
    <div className="page pb-16">
      <AdminHeader
        title="Oppgaver"
        description={admin ? "Lag oppgaver for klubbens administrasjon og gi dem til aktiverte brukere. De som har en oppgave kan flytte den videre og gi den til andre." : "Oppgaver du har fått av klubbens administrasjon. Du kan flytte dem videre og gi dem til en annen."}
      />
      <TaskList rows={rows} people={people} admin={admin} today={todayISO()} />
    </div>
  );
}
