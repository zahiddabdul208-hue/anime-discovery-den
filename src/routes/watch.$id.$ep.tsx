import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, VideoOff } from "lucide-react";
import { fetchAnime, fetchEpisodes, displayTitle } from "@/lib/jikan";
import { getVideo } from "@/lib/videos";
import { addHistory } from "@/lib/library";
import { Loading, ErrorState } from "@/components/nime";

export const Route = createFileRoute("/watch/$id/$ep")({
  head: () => ({
    meta: [
      { title: "Watch — NIME" },
      { name: "description", content: "Watch authorized episodes on NIME." },
      { property: "og:title", content: "Watch — NIME" },
      { property: "og:description", content: "Watch authorized episodes on NIME." },
      { property: "og:type", content: "video.episode" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Watch,
});

function Watch() {
  const p = Route.useParams();
  const id = Number(p.id), ep = Math.max(1, Number(p.ep) || 1);
  const q = useQuery({ queryKey: ["anime", id], queryFn: () => fetchAnime(id), staleTime: 6e5 });
  const a = q.data?.data;
  const eps = useQuery({ queryKey: ["episodes", id], queryFn: () => fetchEpisodes(a!), enabled: !!a, staleTime: 6e5 });
  const video = getVideo(id, ep);
  const [videoError, setVideoError] = useState(false);
  useEffect(() => setVideoError(false), [id, ep]);

  useEffect(() => {
    if (a) addHistory({ mal_id: a.mal_id, title: displayTitle(a), image: a.image, episode: ep });
  }, [a, ep]);

  if (q.isLoading) return <Loading label="Loading player…" />;
  if (q.isError || !a) return <ErrorState message="Couldn't load this anime." onRetry={() => q.refetch()} />;
  const total = eps.data?.length ?? a.episodes ?? 1;
  const epTitle = eps.data?.find((e) => e.mal_id === ep)?.title;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <Link to="/anime/$id" params={{ id: String(id) }} className="text-sm text-muted-foreground hover:text-foreground">← {displayTitle(a)}</Link>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Episode {ep}{epTitle && epTitle !== `Episode ${ep}` ? ` — ${epTitle}` : ""}</h1>

      <div className="mt-4 overflow-hidden rounded-xl bg-card ring-1 ring-border">
        {video && !videoError ? (
          <video key={`${id}-${ep}`} controls playsInline preload="metadata" poster={a.image ?? undefined} className="aspect-video w-full bg-background" onError={() => setVideoError(true)}>
            <source src={video.src} type="video/mp4" />
            Your browser does not support HTML5 video.
          </video>
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center" role="status">
            <VideoOff className="h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="font-semibold">{videoError ? "The video failed to load." : "No authorized video is configured for this episode."}</p>
            <p className="max-w-md text-sm text-muted-foreground">NIME only plays videos from sources you own or are licensed to stream.</p>
          </div>
        )}
      </div>
      {video && !videoError && (
        <p className="mt-3 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm text-gold">
          {video.label} · {video.license}
        </p>
      )}

      <div className="mt-5 flex justify-between gap-3">
        {ep > 1 ? (
          <Link to="/watch/$id/$ep" params={{ id: String(id), ep: String(ep - 1) }} className="inline-flex items-center gap-1 rounded-full bg-secondary px-4 py-2 text-sm font-semibold hover:bg-accent"><ChevronLeft className="h-4 w-4" aria-hidden />Previous</Link>
        ) : <span />}
        {ep < total && (
          <Link to="/watch/$id/$ep" params={{ id: String(id), ep: String(ep + 1) }} className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Next<ChevronRight className="h-4 w-4" aria-hidden /></Link>
        )}
      </div>
    </main>
  );
}
