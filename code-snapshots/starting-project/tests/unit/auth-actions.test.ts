import { beforeEach, describe, expect, test, vi } from "vitest";
import { loginAction, registerAction } from "@/app/(public)/auth-actions";
import { initialAuthState } from "@/app/(public)/auth-types";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  redirect: vi.fn(),
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signInEmail: mocks.signInEmail,
      signUpEmail: mocks.signUpEmail,
    },
  },
}));

function createFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }

  return formData;
}

describe("auth actions", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.headers.mockResolvedValue(new Headers({ "x-test": "unit" }));
    mocks.redirect.mockImplementation(() => undefined);
    mocks.signInEmail.mockResolvedValue({});
    mocks.signUpEmail.mockResolvedValue({});
  });

  test("logs in with normalized credentials and redirects to notes", async () => {
    const headers = new Headers({ "x-test": "login" });
    mocks.headers.mockResolvedValue(headers);

    await loginAction(
      initialAuthState,
      createFormData({
        email: "  USER@Example.COM  ",
        password: "  Password123!  ",
      }),
    );

    expect(mocks.signInEmail).toHaveBeenCalledWith({
      body: {
        email: "user@example.com",
        password: "Password123!",
        rememberMe: true,
      },
      headers,
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/notes");
  });

  test("returns a generic login error without leaking internals", async () => {
    mocks.signInEmail.mockRejectedValue(new Error("password hash failed"));

    const result = await loginAction(
      initialAuthState,
      createFormData({
        email: "  USER@Example.COM  ",
        password: "WrongPassword123!",
      }),
    );

    expect(result).toEqual({
      email: "user@example.com",
      error: "Invalid email or password.",
      name: "",
    });
    expect(result.error).not.toContain("password hash");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  test("registers with normalized input and redirects to notes", async () => {
    const headers = new Headers({ "x-test": "register" });
    mocks.headers.mockResolvedValue(headers);

    await registerAction(
      initialAuthState,
      createFormData({
        email: "  NEW@Example.COM  ",
        name: "  New User  ",
        password: "  Password123!  ",
      }),
    );

    expect(mocks.signUpEmail).toHaveBeenCalledWith({
      body: {
        email: "new@example.com",
        name: "New User",
        password: "Password123!",
      },
      headers,
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/notes");
  });

  test("returns a generic registration error for duplicate or failing signups", async () => {
    mocks.signUpEmail.mockRejectedValue(new Error("UNIQUE constraint failed: user.email"));

    const result = await registerAction(
      initialAuthState,
      createFormData({
        email: "  Taken@Example.COM  ",
        name: "  Taken User  ",
        password: "Password123!",
      }),
    );

    expect(result).toEqual({
      email: "taken@example.com",
      error: "Unable to create an account with those details.",
      name: "Taken User",
    });
    expect(result.error).not.toContain("UNIQUE");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
