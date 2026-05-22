"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { AuthActionState } from "./auth-types";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getFormString(formData, "email").toLowerCase();
  const password = getFormString(formData, "password");

  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe: true,
      },
      headers: await headers(),
    });
  } catch (error) {
    console.error("Login failed", error);

    return {
      email,
      error: "Invalid email or password.",
      name: "",
    };
  }

  redirect("/notes");
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getFormString(formData, "email").toLowerCase();
  const name = getFormString(formData, "name");
  const password = getFormString(formData, "password");

  try {
    await auth.api.signUpEmail({
      body: {
        email,
        name,
        password,
      },
      headers: await headers(),
    });
  } catch (error) {
    console.error("Registration failed", error);

    return {
      email,
      error: "Unable to create an account with those details.",
      name,
    };
  }

  redirect("/notes");
}
