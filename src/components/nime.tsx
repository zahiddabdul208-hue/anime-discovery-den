import { Link } from "@tanstack/react-router";
import { Heart, Star, AlertTriangle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { displayTitle, type Anime } from "@/lib/jikan";
import { toggleFavorite, useLibrary } from "@/lib/library";
import { cn } from "@/lib/utils";

export function Header() {
  const link = "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";
  const active = { className: "text-sm font-medium text-foreground" };
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6" aria-label="Main">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
          NI<span className="text-primary">ME</span>
        </Link>
        <div className="flex gap-5">
          <Link to="/" className={link} activeProps={active} activeOptions={{ exact: true }}>Home</Link>
          <Link to="/explore" className={link} activeProps={active}>Explore</Link>
          <Link to="/library" className={link} activeProps={active}>Library</Link>
        </div>
      </nav>
    </header>
  );
}

export function Poster({ anime, className }: { anime: Pick<Anime, "image" | "title">; className?: string }) {
  return anime.image ? (
    <img src={anime.image} alt="" loading="lazy" className={cn("h-full w-full object-cover", className)} />
  ) : (
    <div className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br from-accent to-muted p-3 text-center font-display text-sm text-muted-foreground", className)}>
      {anime.title}
    </div>
  );
}

export function FavoriteButton({ anime, withLabel }: { anime: Anime; withLabel?: boolean }) {
  const { isFavorite } = useLibrary();
  const on = isFavorite(anime.mal_id);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Remove from favorites" : "Add to favorites"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite({ mal_id: anime.mal_id, title: displayTitle(anime), image: anime.image }); }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold backdrop-blur transition-colors focus-visible:outline-2 focus-visible:outline-ring",
        on ? "border-primary bg-primary text-primary-foreground" : "bg-background/60 text-foreground hover:bg-secondary",
      )}
    >
      <Heart className={cn("h-4 w-4", on && "fill-current")} aria-hidden />
      {withLabel && (on ? "In favorites" : "Add to favorites")}
    </button>
  );
}

export function AnimeCard({ anime }: { anime: Anime }) {
  return (
    <Link to="/anime/$id" params={{ id: String(anime.mal_id) }} className="group block w-full focus-visible:outline-none">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-card ring-1 ring-border transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-glow group-hover:ring-primary/60 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <Poster anime={anime} className="transition-transform duration-500 group-hover:scale-105" />
        {anime.score ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-xs font-bold backdrop-blur">
            <Star className="h-3 w-3 fill-gold text-gold" aria-hidden />{anime.score.toFixed(1)}
          </span>
        ) : null}
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <FavoriteButton anime={anime} />
        </div>
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{displayTitle(anime)}</h3>
      <p className="text-xs text-muted-foreground">{[anime.type, anime.year].filter(Boolean).join(" · ")}</p>
    </Link>
  );
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Row({ items }: { items: Anime[] }) {
  return (
    <div className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
      {items.map((a) => (
        <div key={a.mal_id} className="w-36 shrink-0 sm:w-44"><AnimeCard anime={a} /></div>
      ))}
    </div>
  );
}

export function Grid({ items }: { items: Anime[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((a) => <AnimeCard key={a.mal_id} anime={a} />)}
    </div>
  );
}

export function SkeletonRow({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-36 shrink-0 sm:w-44">
          <div className="aspect-[2/3] animate-pulse rounded-lg bg-card" />
          <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-card" />
        </div>
      ))}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto my-16 max-w-md rounded-xl border bg-card p-6 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-destructive" aria-hidden />
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Try again
        </button>
      )}
    </div>
  );
}

export function DemoBanner() {
  return (
    <div role="note" className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
      <p className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm text-gold">
        Anime data service is unavailable — showing labeled <strong>demo data</strong>.
      </p>
    </div>
  );
}
