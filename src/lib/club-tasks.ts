import type { ClubTask, Db, User } from "./types";

/**
 * The club's task list (/admin/oppgaver). A club administrator (which includes the chair and the web administrator) makes,
 * changes, gives out and deletes tasks. Whoever a task is given to may move it between «Åpen», «Pågår» and «Ferdig» and
 * hand it on to another activated user. Everyone signed in sees the tasks given to them; a club administrator sees all.
 * An activated user is one who can sign in: not deactivated and with some access (`assignable`).
 */

export const TASK_STATUS_LABEL: Record<ClubTask["status"], string> = { open: "Åpen", doing: "Pågår", done: "Ferdig" };
export const TASK_TITLE_MAX = 120;
export const TASK_DESCRIPTION_MAX = 2000;
export const MAX_TASKS = 500;

/** Users a task may be given to: activated and with access to something. */
export const assignable = (db: Db): User[] => db.users.filter((u) => u.active !== false && u.roles.length > 0);

export interface TaskInput {
  title: string;
  description: string;
  /** «ÅÅÅÅ-MM-DD» or empty. */
  dueDate: string;
  /** A user id, or empty for none. */
  assigneeUserId: string;
}

/** The first problem with a task as typed, or null. */
export function taskProblem(input: TaskInput, db: Db): string | null {
  const title = input.title.trim();
  if (!title) return "Oppgaven trenger en tittel.";
  if (title.length > TASK_TITLE_MAX) return `Tittelen kan være opptil ${TASK_TITLE_MAX} tegn.`;
  if (input.description.length > TASK_DESCRIPTION_MAX) return `Beskrivelsen kan være opptil ${TASK_DESCRIPTION_MAX} tegn.`;
  if (input.dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate) || Number.isNaN(Date.parse(`${input.dueDate}T00:00:00Z`)))) return "Fristen må være en gyldig dato.";
  if (input.assigneeUserId && !assignable(db).some((u) => u.id === input.assigneeUserId)) return "Oppgaven kan bare gis til en aktivert bruker med tilgang.";
  return null;
}

/** Open and ongoing first, the nearest deadline first (none last), then newest; done ones by when they were finished. */
export function sortTasks(tasks: ClubTask[]): ClubTask[] {
  const rank = (t: ClubTask) => (t.status === "done" ? 1 : 0);
  return [...tasks].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (a.status === "done"
        ? (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
        : (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || b.createdAt.localeCompare(a.createdAt)),
  );
}
