import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { AuthPanel } from "@/app/(public)/auth-panel";

vi.mock("@/app/(public)/auth-actions", () => ({
  loginAction: vi.fn(),
  registerAction: vi.fn(),
}));

function getInput(label: string): HTMLInputElement {
  const input = screen.getByLabelText(label);

  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`Expected "${label}" to resolve to an input.`);
  }

  return input;
}

describe("AuthPanel", () => {
  test("renders the login form with accessible fields and account creation link", () => {
    render(<AuthPanel mode="login" />);

    expect(screen.getByRole("heading", { level: 1, name: "Log in" })).toBeDefined();
    expect(
      screen.getByText("Access your private notes with your email and password."),
    ).toBeDefined();

    const email = getInput("Email");
    const password = getInput("Password");

    expect(email.type).toBe("email");
    expect(email.required).toBe(true);
    expect(email.autocomplete).toBe("email");
    expect(password.type).toBe("password");
    expect(password.required).toBe(true);
    expect(password.minLength).toBe(8);
    expect(password.autocomplete).toBe("current-password");

    expect(screen.getByRole("button", { name: "Log in" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Create one" }).getAttribute("href")).toBe("/register");
  });

  test("renders the registration form with name, credential fields, and login link", () => {
    render(<AuthPanel mode="register" />);

    expect(screen.getByRole("heading", { level: 1, name: "Create account" })).toBeDefined();
    expect(
      screen.getByText("Create your TinyNotes account with an email and password."),
    ).toBeDefined();

    const name = getInput("Name");
    const email = getInput("Email");
    const password = getInput("Password");

    expect(name.type).toBe("text");
    expect(name.required).toBe(true);
    expect(name.autocomplete).toBe("name");
    expect(email.type).toBe("email");
    expect(email.required).toBe(true);
    expect(password.type).toBe("password");
    expect(password.required).toBe(true);
    expect(password.minLength).toBe(8);
    expect(password.autocomplete).toBe("new-password");

    expect(screen.getByRole("button", { name: "Sign up" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Log in" }).getAttribute("href")).toBe("/login");
  });
});
