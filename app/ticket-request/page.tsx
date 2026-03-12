import { redirect } from "next/navigation";

/**
 * Public ticket request URL: redirect to main support form.
 */
export default function TicketRequestPage() {
  redirect("/support");
}
