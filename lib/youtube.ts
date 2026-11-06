// Find the first YouTube video linked in a post: youtube.com/watch?v=…,
// youtu.be/…, /shorts/…, /live/… or /embed/… (www., m. and music. too).
const YOUTUBE_URL =
  /\bhttps?:\/\/(?:(?:www\.|m\.|music\.)?youtube\.com\/(?:watch\?(?:[^\s#]*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/;

export function youtubeId(text: string | null | undefined) {
  return text?.match(YOUTUBE_URL)?.[1] ?? null;
}
