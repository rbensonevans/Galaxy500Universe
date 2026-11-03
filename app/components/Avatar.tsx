import { avatarUrl } from "@/lib/avatar";

// A citizen's round profile photo, or their initial on the galaxy gradient
// when they haven't uploaded one. Size and text size come from `className`.
export default function Avatar({
  path,
  name,
  className = "h-9 w-9 text-sm",
}: {
  path?: string | null;
  name: string;
  className?: string;
}) {
  const src = avatarUrl(path);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 font-bold text-white`}
    >
      {(name.replace(/^@/, "") || "?").charAt(0).toUpperCase()}
    </span>
  );
}
