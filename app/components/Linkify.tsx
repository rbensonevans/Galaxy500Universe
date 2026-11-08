import Link from "next/link";
import { topicHref } from "@/lib/topics";

// Post text with web links made clickable (opening in a new tab) and
// #hashtags linking to their topic on the Universal Feed. Only http(s) links
// are matched, so nothing like javascript: becomes a link. Trailing
// punctuation (a sentence's period, a closing bracket) stays text. Hashtags
// follow the database's rule (start of text or after a space; see
// extract_hashtags in supabase/migrations/0028_topics.sql).
const TOKEN_PATTERN = /https?:\/\/[^\s<>"]+|(?<=^|\s)#[A-Za-z][A-Za-z0-9_]{1,49}(?![A-Za-z0-9_])/g;
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
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const start = match.index;
    if (match[0].startsWith("#")) {
      parts.push(text.slice(last, start));
      parts.push(
        <Link key={start} href={topicHref(match[0].slice(1).toLowerCase())} className={linkClassName}>
          {match[0]}
        </Link>,
      );
      last = start + match[0].length;
      continue;
    }
    const url = match[0].replace(TRAILING, "");
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
