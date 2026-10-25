import { useEffect, useState, useCallback } from "react";

export type SavedAnime = { mal_id: number; title: string; image?: string | null | undefined };
export type HistoryItem = SavedAnime & { episode: number; watchedAt: number };

const FAV = "nime:favorites";
const HIST = "nime:history";
const EVT = "nime:library";

function read<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function write<T>(key: string, v: T[]) {
  localStorage.setItem(key, JSON.stringify(v));
  window.dispatchEvent(new Event(EVT));
}

export function toggleFavorite(a: SavedAnime) {
  const list = read<SavedAnime>(FAV);
  write(FAV, list.some((x) => x.mal_id === a.mal_id) ? list.filter((x) => x.mal_id !== a.mal_id) : [a, ...list]);
}
export function addHistory(item: Omit<HistoryItem, "watchedAt">) {
  const list = read<HistoryItem>(HIST).filter((x) => x.mal_id !== item.mal_id);
  write(HIST, [{ ...item, watchedAt: Date.now() }, ...list].slice(0, 50));
}
export const clearHistory = () => write(HIST, []);

export function useLibrary() {
  const [fav, setFav] = useState<SavedAnime[]>([]);
  const [hist, setHist] = useState<HistoryItem[]>([]);
  const sync = useCallback(() => { setFav(read(FAV)); setHist(read(HIST)); }, []);
  useEffect(() => {
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, [sync]);
  return { favorites: fav, history: hist, isFavorite: (id: number) => fav.some((f) => f.mal_id === id) };
}
