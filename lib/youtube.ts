// Find the first YouTube video linked in a post: youtube.com/watch?v=…,
// youtu.be/…, /shorts/…, /live/… or /embed/… (www., m. and music. too).
const YOUTUBE_URL =
  /\bhttps?:\/\/(?:(?:www\.|m\.|music\.)?youtube\.com\/(?:watch\?(?:[^\s#]*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/;

export function youtubeId(text: string | null | undefined) {
  return text?.match(YOUTUBE_URL)?.[1] ?? null;
}

// The video's title from YouTube's public oEmbed endpoint (no API key). Null
// if YouTube is slow or the video is private or removed.
export async function fetchYouTubeTitle(id: string) {
  try {
    const watch = encodeURIComponent(`https://www.youtube.com/watch?v=${id}`);
    const res = await fetch(`https://www.youtube.com/oembed?url=${watch}&format=json`, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const { title } = (await res.json()) as { title?: unknown };
    return typeof title === "string" && title.trim() ? title.trim().slice(0, 300) : null;
  } catch {
    return null;
  }
}
