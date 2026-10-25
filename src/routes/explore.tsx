import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { fetchSearch, fetchGenres } from "@/lib/jikan";
import { Grid, Loading, ErrorState, DemoBanner } from "@/components/nime";
import { cn } from "@/lib/utils";

type S = { q?: string | undefined; genre?: number | undefined };

export const Route = createFileRoute("/explore")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"] : undefined,
    genre: Number(s["genre"]) > 0 ? Number(s["genre"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Explore anime — NIME" },
      { name: "description", content: "Search anime by title and filter by genre on NIME." },
      { property: "og:title", content: "Explore anime — NIME" },
      { property: "og:description", content: "Search and filter thousands of anime titles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explore,
});

function Explore() {
  const { q = "", genre } = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });
  const [text, setText] = useState(q);
  useEffect(() => setText(q), [q]);
  useEffect(() => {
    const t = setTimeout(() => { if (text !== q) navigate({ search: (p) => ({ ...p, q: text || undefined }), replace: true }); }, 450);
    return () => clearTimeout(t);
  }, [text, q, navigate]);

  const genres = useQuery({ queryKey: ["genres"], queryFn: fetchGenres, staleTime: 36e5 });
  const results = useQuery({ queryKey: ["search", q, genre], queryFn: () => fetchSearch(q, genre ?? null), placeholderData: keepPreviousData });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Explore</h1>
      <form role="search" onSubmit={(e) => { e.preventDefault(); navigate({ search: (p) => ({ ...p, q: text || undefined }) }); }} className="relative mt-6">
        <label htmlFor="search" className="sr-only">Search anime</label>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input id="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search titles…" className="h-14 w-full rounded-full border bg-card pl-12 pr-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/40" />
      </form>

      <div className="scrollbar-none mt-5 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Genre filter">
        {[{ mal_id: 0, name: "All" }, ...(genres.data?.data ?? [])].map((g) => {
          const on = (genre ?? 0) === g.mal_id;
          return (
            <button key={g.mal_id} aria-pressed={on} onClick={() => navigate({ search: (p) => ({ ...p, genre: g.mal_id || undefined }) })}
              className={cn("shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary")}>
              {g.name}
            </button>
          );
        })}
      </div>

      {results.data?.demo && <div className="-mx-4 sm:-mx-6"><DemoBanner /></div>}
      <div className={cn("mt-6 transition-opacity", results.isFetching && "opacity-60")} aria-live="polite">
        {results.isLoading ? <Loading label="Searching…" /> : results.isError ? (
          <ErrorState message="Search failed." onRetry={() => results.refetch()} />
        ) : results.data && results.data.data.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No anime matched your search.</p>
        ) : results.data ? <Grid items={results.data.data} /> : null}
      </div>
    </main>
  );
}
