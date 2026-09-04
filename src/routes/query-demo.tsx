import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

const getConnectionHint = (): string =>
  "Use fmFetch or generated clients once your FileMaker file is ready.";

export const QueryDemoPage = () => {
  const hintQuery = useQuery({
    queryFn: getConnectionHint,
    queryKey: ["starter-connection-hint"] as const,
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
      <section className="border-border bg-card rounded-3xl border p-8 shadow-sm">
        <p className="text-muted-foreground text-sm font-medium tracking-[0.2em] uppercase">
          React Query ready
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          TanStack Query is preconfigured
        </h1>
        <p className="text-muted-foreground mt-4">
          This route is rendered by TanStack Router using hash history, which is
          recommended for FileMaker Web Viewer apps.
        </p>

        <div className="border-border bg-background mt-6 rounded-xl border p-4 text-sm">
          {hintQuery.isLoading ? "Loading starter data..." : hintQuery.data}
        </div>

        <div className="mt-6">
          <Link
            className="border-border bg-card inline-flex rounded-full border px-4 py-2 text-sm font-medium"
            to="/"
          >
            Back to starter
          </Link>
        </div>
      </section>
    </main>
  );
};
