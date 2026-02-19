"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/src/lib/auth-client";

const formByMode = {
  login: {
    title: "Login",
    summary: "Sign in to access your notes.",
    submitLabel: "Login",
    switchPrompt: "No account yet?",
    switchLabel: "Register",
    switchHref: "/register",
    passwordAutoComplete: "current-password",
  },
  register: {
    title: "Register",
    summary: "Create an account to start writing notes.",
    submitLabel: "Register",
    switchPrompt: "Already have an account?",
    switchLabel: "Login",
    switchHref: "/login",
    passwordAutoComplete: "new-password",
  },
} as const;

export type CredentialsAuthFormProps = {
  mode: keyof typeof formByMode;
};

function deriveNameFromEmail(email: string) {
  const localPart = email.split("@")[0]?.trim();

  if (!localPart) {
    return "User";
  }

  return localPart;
}

export function CredentialsAuthForm({ mode }: CredentialsAuthFormProps) {
  const copy = formByMode[mode];
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    const emailValue = formData.get("email");
    const passwordValue = formData.get("password");
    const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
    const password = typeof passwordValue === "string" ? passwordValue : "";

    if (!email || !password) {
      setErrorMessage("Please provide both email and password.");
      return;
    }

    const response =
      mode === "login"
        ? await authClient.signIn.email({
            email,
            password,
            callbackURL: "/notes",
          })
        : await authClient.signUp.email({
            email,
            password,
            name: deriveNameFromEmail(email),
            callbackURL: "/notes",
          });

    if (response.error) {
      setErrorMessage(
        mode === "login"
          ? "Invalid email or password."
          : "Unable to create your account with those details.",
      );
      return;
    }

    setErrorMessage(null);
    router.push("/notes");
    router.refresh();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await handleSubmit(new FormData(event.currentTarget));
    } catch (error) {
      console.error("Auth request failed", error);
      setErrorMessage("Authentication is currently unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-2xl shadow-black/35 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground)">{copy.title}</h1>
      <p className="mt-2 text-sm text-(--foreground-muted)">{copy.summary}</p>

      <form className="mt-7 space-y-5" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium text-slate-100" htmlFor={`${mode}-email`}>
            Email
          </label>
          <input
            autoComplete="email"
            className="mt-1.5 w-full rounded-lg border border-(--border) bg-(--background-elevated) px-3 py-2.5 text-slate-100 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-(--accent) focus:ring-2 focus:ring-[#5ad5ca]/35"
            id={`${mode}-email`}
            name="email"
            required
            type="email"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-100" htmlFor={`${mode}-password`}>
            Password
          </label>
          <input
            autoComplete={copy.passwordAutoComplete}
            className="mt-1.5 w-full rounded-lg border border-(--border) bg-(--background-elevated) px-3 py-2.5 text-slate-100 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-(--accent) focus:ring-2 focus:ring-[#5ad5ca]/35"
            id={`${mode}-password`}
            minLength={8}
            name="password"
            required
            type="password"
          />
        </div>

        {errorMessage ? (
          <p
            className="rounded-md border border-red-300/25 bg-red-400/10 px-3 py-2 text-sm text-red-200"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <button
          className="w-full rounded-lg bg-(--accent) px-4 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-(--accent-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background-elevated) disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Submitting..." : copy.submitLabel}
        </button>
      </form>

      <p className="mt-5 text-sm text-(--foreground-muted)">
        {copy.switchPrompt}{" "}
        <Link
          className="font-semibold text-(--accent) underline underline-offset-4 transition-colors hover:text-teal-100"
          href={copy.switchHref}
        >
          {copy.switchLabel}
        </Link>
      </p>
    </section>
  );
}
