type AreaShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function AreaShell({ children, className }: AreaShellProps) {
  return (
    <section
      className={`mx-auto w-full max-w-3xl rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-xl shadow-black/30 ${className ?? ""}`}
    >
      {children}
    </section>
  );
}
