import { requireSessionOrRedirect } from "@/src/lib/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireSessionOrRedirect();

  return children;
}
