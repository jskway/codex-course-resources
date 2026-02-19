export type AuthPageShellProps = {
  children: React.ReactNode;
};

export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-11rem)] w-full items-center justify-center py-8">
      {children}
    </main>
  );
}
