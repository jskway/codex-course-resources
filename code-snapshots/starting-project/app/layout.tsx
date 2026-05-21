import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TinyNotes",
  description: "A tiny private notes app with public sharing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen bg-background text-foreground antialiased`}>
        <header className="border-b border-acc-2 bg-acc-1/95 px-6 backdrop-blur">
          <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6">
            <Link className="text-lg font-semibold tracking-tight text-acc-5" href="/">
              TinyNotes
            </Link>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link
                className="rounded-md px-3 py-2 text-foreground transition hover:bg-acc-2 focus:outline-none focus:ring-2 focus:ring-acc-3"
                href="/login"
              >
                Login
              </Link>
              <Link
                className="rounded-md bg-acc-3 px-3 py-2 text-background transition hover:bg-acc-4 focus:outline-none focus:ring-2 focus:ring-acc-4 focus:ring-offset-2 focus:ring-offset-background"
                href="/register"
              >
                Register
              </Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
