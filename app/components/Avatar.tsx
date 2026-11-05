import { avatarUrl } from "@/lib/avatar";
import type { Verification } from "@/lib/verification";
import { BadgeDot } from "@/app/components/VerificationBadge";

// A citizen's round profile photo, or their initial on the galaxy gradient
// when they haven't uploaded one. Size and text size come from `className`.
// Pass `verification` to show their badge in the corner.
export default function Avatar({
  path,
  name,
  className = "h-9 w-9 text-sm",
  verification,
}: {
  path?: string | null;
  name: string;
  className?: string;
  verification?: Verification | null;
}) {
  const src = avatarUrl(path);
  const photo = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`${className} shrink-0 rounded-full object-cover`}
    />
  ) : (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 font-bold text-white`}
    >
      {(name.replace(/^@/, "") || "?").charAt(0).toUpperCase()}
    </span>
  );
  if (!verification) return photo;
  return (
    <span className="relative inline-flex h-fit shrink-0">
      {photo}
      <BadgeDot v={verification} />
    </span>
  );
}
