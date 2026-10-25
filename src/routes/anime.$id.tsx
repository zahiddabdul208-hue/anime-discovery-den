import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Play, Star } from "lucide-react";
import { fetchAnime, fetchEpisodes, displayTitle } from "@/lib/jikan";
import { Poster, FavoriteButton, Loading, ErrorState } from "@/components/nime";

export const Route = createFileRoute("/anime/$id")({
  head: () => ({
    meta: [
      { title: "Anime details — NIME" },
      { name: "description", content: "Synopsis, genres and episodes on NIME." },
      { property: "og:title", content: "Anime details — NIME" },
      { property: "og:description", content: "Synopsis, genres and episodes on NIME." },
      { property: "og:type", content: "video.tv_show" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Detail,
});

function Detail() {
  const id = Number(Route.useParams().id);
  const q = useQuery({ queryKey: ["anime", id], queryFn: () => fetchAnime(id), enabled: id > 0, staleTime: 6e5 });
  const a = q.data?.data;
  const eps = useQuery({ queryKey: ["episodes", id], queryFn: () => fetchEpisodes(a!), enabled: !!a, staleTime: 6e5 });

  if (!(id > 0)) return <ErrorState message="Invalid anime ID." />;
  if (q.isLoading) return <Loading label="Loading anime…" />;
  if (q.isError || !a) return <ErrorState message="Couldn't load this anime. The data service may be busy." onRetry={() => q.refetch()} />;

  return (
    <main>
      <div className="relative overflow-hidden">
        {a.image && <img src={a.image} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-25 blur-2xl" />}
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row">
          <div className="aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-xl shadow-glow ring-1 ring-border md:w-64">
            <Poster anime={a} />
          </div>
          <div className="max-w-3xl">
            {a.demo && <p className="mb-2 inline-block rounded bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold">DEMO DATA</p>}
            <h1 className="text-3xl font-extrabold sm:text-5xl">{displayTitle(a)}</h1>
            {a.title_english && a.title_english !== a.title && <p className="mt-1 text-muted-foreground">{a.title}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {a.score && <span className="inline-flex items-center gap-1 font-semibold text-foreground"><Star className="h-4 w-4 fill-gold text-gold" aria-hidden />{a.score}</span>}
              {[a.type, a.year, a.status, a.episodes && `${a.episodes} eps`].filter(Boolean).map((x) => <span key={String(x)}>{x}</span>)}
            </div>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Genres">
              {a.genres.map((g) => (
                <li key={g.mal_id}><Link to="/explore" search={{ genre: g.mal_id }} className="rounded-full border px-3 py-1 text-xs font-medium hover:border-primary hover:text-primary">{g.name}</Link></li>
              ))}
            </ul>
            <p className="mt-5 whitespace-pre-line leading-relaxed text-muted-foreground">{a.synopsis || "No synopsis available."}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/watch/$id/$ep" params={{ id: String(id), ep: "1" }} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:bg-primary/90">
                <Play className="h-4 w-4 fill-current" aria-hidden /> Episode 1
              </Link>
              <FavoriteButton anime={a} withLabel />
            </div>
          </div>
        </div>
      </div>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h2 className="mb-4 text-2xl font-bold">Episodes</h2>
        {eps.isLoading ? <Loading label="Loading episodes…" /> : (
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(eps.data ?? []).map((e) => (
              <li key={e.mal_id}>
                <Link to="/watch/$id/$ep" params={{ id: String(id), ep: String(e.mal_id) }} className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent font-display text-sm font-bold">{e.mal_id}</span>
                  <span className="line-clamp-1 text-sm font-medium">{e.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
