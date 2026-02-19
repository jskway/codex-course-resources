import type { Metadata } from "next";
import { LogoutButton } from "@/src/components/auth/logout-button";
import { getCurrentSession } from "@/src/lib/session";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TinyNotes",
  description: "TinyNotes app shell",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <div className="min-h-screen bg-(--background)">
          <header className="bg-(--background-elevated)">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
              <Link href="/" className="text-lg font-semibold tracking-tight text-(--foreground)">
                TinyNotes
              </Link>
              <nav
                aria-label="Primary navigation"
                className="flex items-center gap-6 text-sm font-medium"
              >
                {session ? (
                  <>
                    <Link
                      href="/notes"
                      className="text-(--foreground-muted) transition-colors hover:text-(--accent)"
                    >
                      Notes
                    </Link>
                    <Link
                      href="/notes/new"
                      className="text-(--foreground-muted) transition-colors hover:text-(--accent)"
                    >
                      New note
                    </Link>
                    <LogoutButton />
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-(--foreground-muted) transition-colors hover:text-(--accent)"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="text-(--foreground-muted) transition-colors hover:text-(--accent)"
                    >
                      Register
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </header>
          <div className="mx-auto w-full max-w-5xl px-4 py-8">{children}</div>
        </div>
      </body>
    </html>
  );
}
