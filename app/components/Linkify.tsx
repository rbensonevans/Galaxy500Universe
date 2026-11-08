// Post text with web links made clickable (opening in a new tab). Only
// http(s) links are matched, so nothing like javascript: becomes a link.
// Trailing punctuation (a sentence's period, a closing bracket) stays text.
const URL_PATTERN = /https?:\/\/[^\s<>"]+/g;
const TRAILING = /[.,!?;:'")\]}]+$/;

const LINK_STYLE =
  "text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 hover:text-cyan-200";

export default function Linkify({
  text,
  linkClassName = LINK_STYLE,
}: {
  text: string;
  /** Link colors, e.g. white on the violet bubbles of your own messages. */
  linkClassName?: string;
}) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const url = match[0].replace(TRAILING, "");
    const start = match.index;
    parts.push(text.slice(last, start));
    parts.push(
      <a
        key={start}
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className={`break-all ${linkClassName}`}
      >
        {url}
      </a>,
    );
    last = start + url.length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}
