import { AuthPageShell } from "@/src/components/auth/auth-page-shell";
import { CredentialsAuthForm } from "@/src/components/auth/credentials-auth-form";
import { redirectIfAuthenticated } from "@/src/lib/session";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <AuthPageShell>
      <CredentialsAuthForm mode="login" />
    </AuthPageShell>
  );
}
