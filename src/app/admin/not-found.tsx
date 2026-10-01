import Link from "next/link";
import { AdminHeader } from "@/components/admin/bits";
import { buttonClass } from "@/components/ui/button";

/** An admin address that leads nowhere: the page may have been deleted, or the user may not have access to it. */
export default function AdminNotFound() {
  return (
    <div className="page pb-16">
      <AdminHeader
        title="Fant ikke siden"
        description="Siden finnes ikke, er slettet, eller du har ikke tilgang til den. Hvis du mener du burde ha det, ber du styret om tilgang."
      />
      <div className="flex flex-wrap gap-2">
        <Link href="/admin" className={buttonClass({ size: "md" })}>
          Til oversikten
        </Link>
        <Link href="/admin/grupper" className={buttonClass({ variant: "secondary", size: "md" })}>
          Mine grupper
        </Link>
      </div>
    </div>
  );
}
