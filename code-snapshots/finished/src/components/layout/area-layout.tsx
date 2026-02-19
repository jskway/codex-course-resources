import { AreaShell } from "@/src/components/layout/area-shell";

export type AreaLayoutProps = {
  label: string;
  children: React.ReactNode;
};

export function AreaLayout({ label, children }: AreaLayoutProps) {
  return (
    <main className="min-h-screen bg-transparent px-4 py-10 text-(--foreground)">
      <AreaShell>
        <p className="text-xs font-semibold uppercase tracking-wide text-(--foreground-muted)">
          {label}
        </p>
        <div className="mt-4">{children}</div>
      </AreaShell>
    </main>
  );
}
