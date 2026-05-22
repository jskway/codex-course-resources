import { AuthPage } from "../auth-panel";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";

export default async function RegisterPage() {
  const session = await getCurrentSession();

  if (session !== null) {
    redirect("/notes");
  }

  return <AuthPage mode="register" />;
}
