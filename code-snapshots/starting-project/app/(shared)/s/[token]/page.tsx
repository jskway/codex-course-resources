export default async function SharedNotePage({
  params,
}: Readonly<{
  params: Promise<{ token: string }>;
}>) {
  const { token } = await params;

  return (
    <article className="rounded-lg border border-acc-2 bg-acc-1/80 p-8 shadow-sm">
      <p className="text-sm font-medium text-acc-4">Public shared route</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-acc-5">
        Dummy shared note view
      </h2>
      <p className="mt-5 text-base leading-7 text-foreground/75">
        Placeholder for the future sanitized public note renderer. No token lookup, database read,
        sanitization, or 404 behavior has been implemented.
      </p>
      <div className="mt-6 rounded-lg border border-acc-2 bg-acc-1/70 p-4 text-sm text-acc-5">
        Dummy route token: {token}
      </div>
    </article>
  );
}
