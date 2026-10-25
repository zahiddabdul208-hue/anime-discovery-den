// Authorized video sources.
// Only add URLs you own or are licensed to stream. Keys are "<mal_id>:<episode>"
// or "<mal_id>:*" for every episode of a title. "*" applies to all titles.
export type VideoSource = { src: string; label: string; license: string };

const DEMO: VideoSource = {
  // Blender Foundation open movie, licensed CC BY 3.0 (https://peach.blender.org).
  src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  label: "Demo video: Big Buck Bunny (Blender Foundation)",
  license: "CC BY 3.0 — not the anime episode",
};

export const VIDEO_SOURCES: Record<string, VideoSource> = {
  // Remove this line to disable the demo video everywhere.
  "*": DEMO,
};

export function getVideo(animeId: number, ep: number): VideoSource | null {
  return VIDEO_SOURCES[`${animeId}:${ep}`] ?? VIDEO_SOURCES[`${animeId}:*`] ?? VIDEO_SOURCES["*"] ?? null;
}
