import { redirect } from "next/navigation";

// The monitor is the only view: any unknown URL under the base path lands there.
export default function NotFound() {
  redirect("/pages/monitor");
}
