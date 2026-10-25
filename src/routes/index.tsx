import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Play, Info, Star } from "lucide-react";
import { fetchTop, fetchGenres, displayTitle } from "@/lib/jikan";
import { Section, Row, SkeletonRow, DemoBanner, FavoriteButton } from "@/components/nime";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NIME — Discover anime" },
      { name: "description", content: "Discover trending and popular anime, browse genres, and keep your favorites on NIME." },
      { property: "og:title", content: "NIME — Discover anime" },
      { property: "og:description", content: "Trending, popular and genre picks in a cinematic anime discovery app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const trending = useQuery({ queryKey: ["top", "airing"], queryFn: () => fetchTop("airing"), staleTime: 6e5 });
  const popular = useQuery({ queryKey: ["top", "pop"], queryFn: () => fetchTop("bypopularity"), staleTime: 6e5 });
  const genres = useQuery({ queryKey: ["genres"], queryFn: fetchGenres, staleTime: 36e5 });
  const featured = trending.data?.data[0];
  const demo = trending.data?.demo || popular.data?.demo;

  return (
    <main>
      <section className="relative min-h-[70vh] overflow-hidden">
        {featured?.image && (
          <img src={featured.image} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover object-top opacity-60 blur-[2px]" />
        )}
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-end gap-8 px-4 pb-14 sm:px-6">
          {featured ? (
            <>
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Featured · Trending now</p>
                <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-6xl">{displayTitle(featured)}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {featured.score && <span className="inline-flex items-center gap-1 font-semibold text-foreground"><Star className="h-4 w-4 fill-gold text-gold" aria-hidden />{featured.score}</span>}
                  {featured.type && <span>{featured.type}</span>}
                  {featured.genres.slice(0, 3).map((g) => <span key={g.mal_id}>{g.name}</span>)}
                </div>
                <p className="mt-4 line-clamp-3 text-muted-foreground">{featured.synopsis}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/watch/$id/$ep" params={{ id: String(featured.mal_id), ep: "1" }} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:bg-primary/90">
                    <Play className="h-4 w-4 fill-current" aria-hidden /> Watch demo
                  </Link>
                  <Link to="/anime/$id" params={{ id: String(featured.mal_id) }} className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 font-semibold hover:bg-accent">
                    <Info className="h-4 w-4" aria-hidden /> Details
                  </Link>
                  <FavoriteButton anime={featured} />
                </div>
              </div>
              {featured.image && <img src={featured.image} alt={`${displayTitle(featured)} poster`} className="ml-auto hidden w-56 rounded-xl shadow-glow ring-1 ring-border lg:block" />}
            </>
          ) : (
            <div className="h-48 w-full max-w-xl animate-pulse rounded-xl bg-card" role="status" aria-label="Loading featured anime" />
          )}
        </div>
      </section>

      {demo && <DemoBanner />}

      <Section title="Trending now">{trending.data ? <Row items={trending.data.data.slice(1)} /> : <SkeletonRow />}</Section>
      <Section title="Most popular">{popular.data ? <Row items={popular.data.data} /> : <SkeletonRow />}</Section>
      <Section title="Browse by genre">
        <div className="flex flex-wrap gap-2">
          {(genres.data?.data ?? []).slice(0, 24).map((g) => (
            <Link key={g.mal_id} to="/explore" search={{ genre: g.mal_id }} className="rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">
              {g.name}
            </Link>
          ))}
          {genres.isLoading && <span className="text-sm text-muted-foreground" role="status">Loading genres…</span>}
        </div>
      </Section>
      <footer className="mx-auto max-w-7xl px-4 py-10 text-xs text-muted-foreground sm:px-6">
        Metadata from Jikan (MyAnimeList). NIME streams only configured, authorized videos.
      </footer>
    </main>
  );
}
