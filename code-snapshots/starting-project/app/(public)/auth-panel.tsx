import Link from "next/link";

type AuthMode = "login" | "register";

const authCopy: Record<
  AuthMode,
  {
    title: string;
    eyebrow: string;
    description: string;
    submitLabel: string;
    switchPrompt: string;
    switchHref: string;
    switchLabel: string;
  }
> = {
  login: {
    title: "Log in",
    eyebrow: "Welcome back",
    description: "Access your private notes with your email and password.",
    submitLabel: "Log in",
    switchPrompt: "Need an account?",
    switchHref: "/register",
    switchLabel: "Create one",
  },
  register: {
    title: "Create account",
    eyebrow: "Start writing",
    description: "Create your TinyNotes account with an email and password.",
    submitLabel: "Sign up",
    switchPrompt: "Already have an account?",
    switchHref: "/login",
    switchLabel: "Log in",
  },
};

export function AuthPage({ mode }: { mode: AuthMode }) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-6 py-12 text-foreground">
      <AuthPanel mode={mode} />
    </main>
  );
}

export function AuthPanel({ mode }: { mode: AuthMode }) {
  const copy = authCopy[mode];

  return (
    <section className="w-full max-w-md rounded-lg border border-acc-2 bg-acc-1/80 p-8 shadow-xl shadow-black/10">
      <p className="text-sm font-medium text-acc-4">{copy.eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-acc-5">{copy.title}</h1>
      <p className="mt-4 text-base leading-7 text-foreground/75">{copy.description}</p>

      <form className="mt-8 space-y-5">
        <label className="block text-sm font-medium text-foreground">
          Email
          <input
            autoComplete="email"
            className="mt-2 w-full rounded-md border border-acc-2 bg-background px-3 py-2 text-base text-foreground shadow-sm outline-none transition placeholder:text-foreground/40 focus:border-acc-4 focus:ring-2 focus:ring-acc-2"
            name="email"
            placeholder="you@example.com"
            type="email"
          />
        </label>

        <label className="block text-sm font-medium text-foreground">
          Password
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="mt-2 w-full rounded-md border border-acc-2 bg-background px-3 py-2 text-base text-foreground shadow-sm outline-none transition focus:border-acc-4 focus:ring-2 focus:ring-acc-2"
            name="password"
            type="password"
          />
        </label>

        <button
          className="w-full rounded-md bg-acc-3 px-4 py-2.5 text-sm font-semibold text-background shadow-sm transition hover:bg-acc-4 focus:outline-none focus:ring-2 focus:ring-acc-4 focus:ring-offset-2 focus:ring-offset-background"
          type="button"
        >
          {copy.submitLabel}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-center">
        <p className="text-sm text-foreground/70">{copy.switchPrompt}</p>
        <Link
          className="block w-full rounded-md border border-acc-2 bg-background px-4 py-2.5 text-sm font-semibold text-acc-5 shadow-sm transition hover:border-acc-3 hover:bg-acc-2 focus:outline-none focus:ring-2 focus:ring-acc-2 focus:ring-offset-2 focus:ring-offset-background"
          href={copy.switchHref}
        >
          {copy.switchLabel}
        </Link>
      </div>
    </section>
  );
}
