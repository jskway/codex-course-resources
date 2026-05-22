export default function NotesLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="h-4 w-24 animate-pulse rounded bg-acc-2" />
          <div className="mt-3 h-4 w-36 animate-pulse rounded bg-acc-2" />
        </div>
        <div className="h-10 w-24 animate-pulse rounded-md bg-acc-2" />
      </div>
      <div className="min-h-96 animate-pulse rounded-lg border border-acc-2 bg-acc-1/70" />
    </div>
  );
}
