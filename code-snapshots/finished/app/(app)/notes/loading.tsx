export default function NotesLoading() {
  return (
    <section className="space-y-4">
      <div className="h-8 w-52 animate-pulse rounded-md bg-(--surface-soft)" />
      <div className="h-4 w-72 animate-pulse rounded-md bg-(--surface-soft)" />
      <div className="space-y-3 pt-2">
        <div className="h-20 animate-pulse rounded-xl border border-(--border) bg-(--surface-soft)" />
        <div className="h-20 animate-pulse rounded-xl border border-(--border) bg-(--surface-soft)" />
        <div className="h-20 animate-pulse rounded-xl border border-(--border) bg-(--surface-soft)" />
      </div>
    </section>
  );
}
