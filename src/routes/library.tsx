import { createFileRoute, Link } from "@tanstack/react-router";
import { clearHistory, toggleFavorite, useLibrary } from "@/lib/library";
import { Poster, Section } from "@/components/nime";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Your library — NIME" },
      { name: "description", content: "Your favorite anime and watch history on NIME." },
      { property: "og:title", content: "Your library — NIME" },
      { property: "og:description", content: "Favorites and watch history, saved on this device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Library,
});

function Library() {
  const { favorites, history } = useLibrary();
  return (
    <main className="py-4">
      <Section title="Favorites">
        {favorites.length === 0 ? <Empty text="No favorites yet. Tap the heart on any anime." /> : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {favorites.map((f) => (
              <div key={f.mal_id}>
                <Link to="/anime/$id" params={{ id: String(f.mal_id) }} className="block aspect-[2/3] overflow-hidden rounded-lg ring-1 ring-border transition hover:ring-primary">
                  <Poster anime={f} />
                </Link>
                <p className="mt-2 line-clamp-1 text-sm font-semibold">{f.title}</p>
                <button onClick={() => toggleFavorite(f)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
              </div>
            ))}
          </div>
        )}
      </Section>
      <Section title="Watch history" action={history.length > 0 && <button onClick={clearHistory} className="text-sm text-muted-foreground hover:text-destructive">Clear history</button>}>
        {history.length === 0 ? <Empty text="Nothing watched yet." /> : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {history.map((h) => (
              <li key={h.mal_id}>
                <Link to="/watch/$id/$ep" params={{ id: String(h.mal_id), ep: String(h.episode) }} className="flex items-center gap-4 rounded-lg border bg-card p-3 hover:border-primary">
                  <div className="h-20 w-14 shrink-0 overflow-hidden rounded"><Poster anime={h} /></div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-semibold">{h.title}</p>
                    <p className="text-sm text-muted-foreground">Episode {h.episode} · {new Date(h.watchedAt).toLocaleString()}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}

const Empty = ({ text }: { text: string }) => <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">{text}</p>;
