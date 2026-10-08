import { redirect } from "next/navigation";

/** Personvern and Personvern-kontroll are one page now: the requests are handled in the register at the top of it. */
export default function PrivacyContactsRedirect() {
  redirect("/admin/personvern-kontroll#henvendelser");
}
