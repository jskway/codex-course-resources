import { getCurrentSession } from "@/src/lib/session";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/notes");
  }

  redirect("/login");
}
