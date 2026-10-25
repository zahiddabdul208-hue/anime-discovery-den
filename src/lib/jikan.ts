// Jikan (unofficial MyAnimeList API) client with labeled demo fallback.
export type Anime = {
  mal_id: number;
  title: string;
  title_english?: string | null;
  synopsis?: string | null;
  score?: number | null;
  episodes?: number | null;
  year?: number | null;
  type?: string | null;
  status?: string | null;
  image?: string | null;
  genres: { mal_id: number; name: string }[];
  demo?: boolean;
};
export type Episode = { mal_id: number; title: string; aired?: string | null };
export type Genre = { mal_id: number; name: string; count?: number | undefined };
export type Result<T> = { data: T; demo: boolean };

const BASE = "https://api.jikan.moe/v4";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Jikan allows ~3 req/s; serialize calls to stay polite.
let queue: Promise<unknown> = Promise.resolve();
async function get<T>(path: string): Promise<T> {
  const run = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(BASE + path);
      if (res.status === 429) { await sleep(1000 * (attempt + 1)); continue; }
      if (!res.ok) throw new Error(`Jikan ${res.status}`);
      return (await res.json()) as T;
    }
    throw new Error("Jikan rate limited");
  };
  const p = queue.then(run, run);
  queue = p.then(() => sleep(350), () => sleep(350));
  return p;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map = (a: any): Anime => ({
  mal_id: a.mal_id, title: a.title, title_english: a.title_english, synopsis: a.synopsis,
  score: a.score, episodes: a.episodes, year: a.year ?? a.aired?.prop?.from?.year, type: a.type,
  status: a.status, image: a.images?.webp?.large_image_url ?? a.images?.jpg?.large_image_url,
  genres: (a.genres ?? []).map((g: Genre) => ({ mal_id: g.mal_id, name: g.name })),
});

export const DEMO_ANIME: Anime[] = [
  { mal_id: 900001, title: "Demo: Starlight Courier", synopsis: "Placeholder demo entry shown because the anime metadata service is unavailable.", score: 8.4, episodes: 12, year: 2026, type: "TV", status: "Demo", genres: [{ mal_id: 1, name: "Action" }, { mal_id: 24, name: "Sci-Fi" }], demo: true },
  { mal_id: 900002, title: "Demo: Lantern Garden", synopsis: "Placeholder demo entry.", score: 8.1, episodes: 10, year: 2025, type: "TV", status: "Demo", genres: [{ mal_id: 8, name: "Drama" }, { mal_id: 36, name: "Slice of Life" }], demo: true },
  { mal_id: 900003, title: "Demo: Iron Petal", synopsis: "Placeholder demo entry.", score: 7.9, episodes: 24, year: 2024, type: "TV", status: "Demo", genres: [{ mal_id: 1, name: "Action" }, { mal_id: 10, name: "Fantasy" }], demo: true },
  { mal_id: 900004, title: "Demo: Quiet Tide", synopsis: "Placeholder demo entry.", score: 7.6, episodes: 1, year: 2023, type: "Movie", status: "Demo", genres: [{ mal_id: 22, name: "Romance" }], demo: true },
  { mal_id: 900005, title: "Demo: Neon Shrine", synopsis: "Placeholder demo entry.", score: 7.4, episodes: 13, year: 2026, type: "TV", status: "Demo", genres: [{ mal_id: 7, name: "Mystery" }], demo: true },
  { mal_id: 900006, title: "Demo: Paper Comet", synopsis: "Placeholder demo entry.", score: 7.2, episodes: 12, year: 2022, type: "TV", status: "Demo", genres: [{ mal_id: 4, name: "Comedy" }], demo: true },
];
const DEMO_GENRES: Genre[] = [
  { mal_id: 1, name: "Action" }, { mal_id: 4, name: "Comedy" }, { mal_id: 8, name: "Drama" },
  { mal_id: 10, name: "Fantasy" }, { mal_id: 7, name: "Mystery" }, { mal_id: 22, name: "Romance" },
  { mal_id: 24, name: "Sci-Fi" }, { mal_id: 36, name: "Slice of Life" },
];

async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<Result<T>> {
  try { return { data: await fn(), demo: false }; }
  catch { return { data: fallback, demo: true }; }
}

export const fetchTop = (filter: "airing" | "bypopularity", limit = 18) =>
  withFallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await get<{ data: any[] }>(`/top/anime?filter=${filter}&limit=${limit}&sfw=true`);
    return dedupe(r.data.map(map));
  }, DEMO_ANIME);

export const fetchSearch = (q: string, genre: number | null) =>
  withFallback(async () => {
    const p = new URLSearchParams({ sfw: "true", limit: "24", order_by: "popularity" });
    if (q) p.set("q", q);
    if (genre) p.set("genres", String(genre));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await get<{ data: any[] }>(`/anime?${p}`);
    return dedupe(r.data.map(map));
  }, DEMO_ANIME.filter((a) =>
    a.title.toLowerCase().includes(q.toLowerCase()) && (!genre || a.genres.some((g) => g.mal_id === genre))));

export const fetchGenres = () =>
  withFallback(async () => {
    const r = await get<{ data: Genre[] }>(`/genres/anime?filter=genres`);
    return r.data.map((g) => ({ mal_id: g.mal_id, name: g.name, count: g.count }));
  }, DEMO_GENRES);

export async function fetchAnime(id: number): Promise<Result<Anime>> {
  const demo = DEMO_ANIME.find((a) => a.mal_id === id);
  if (demo) return { data: demo, demo: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await get<{ data: any }>(`/anime/${id}/full`);
  return { data: map(r.data), demo: false };
}

export async function fetchEpisodes(anime: Anime): Promise<Episode[]> {
  const synth = () => Array.from({ length: Math.min(anime.episodes ?? 1, 100) }, (_, i) => ({ mal_id: i + 1, title: `Episode ${i + 1}` }));
  if (anime.demo) return synth();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await get<{ data: any[] }>(`/anime/${anime.mal_id}/episodes`);
    const eps = r.data.map((e) => ({ mal_id: e.mal_id, title: e.title || `Episode ${e.mal_id}`, aired: e.aired }));
    return eps.length ? eps : synth();
  } catch { return synth(); }
}

function dedupe(list: Anime[]) {
  const seen = new Set<number>();
  return list.filter((a) => (seen.has(a.mal_id) ? false : (seen.add(a.mal_id), true)));
}

export const displayTitle = (a: Anime) => a.title_english || a.title;
