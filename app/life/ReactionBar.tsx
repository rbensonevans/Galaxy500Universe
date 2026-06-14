import { toggleReaction } from "./actions";
import { EMOJIS, type ReactionSummary, type TargetType } from "./reactions";

// Emoji reaction row. Each emoji is a submit button in a single server-action
// form, so toggling works without any client-side JavaScript. The total like
// count is shown alongside.
export default function ReactionBar({
  targetType,
  targetId,
  summary,
}: {
  targetType: TargetType;
  targetId: string;
  summary: ReactionSummary;
}) {
  return (
    <form action={toggleReaction} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />

      {EMOJIS.map((emoji) => {
        const count = summary.counts[emoji] ?? 0;
        const mine = summary.mine.has(emoji);
        return (
          <button
            key={emoji}
            type="submit"
            name="emoji"
            value={emoji}
            aria-pressed={mine}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-sm leading-none transition ${
              mine
                ? "border-violet-400/50 bg-violet-500/20 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            <span>{emoji}</span>
            {count > 0 && (
              <span className="text-xs tabular-nums text-white/70">{count}</span>
            )}
          </button>
        );
      })}

      <span className="ml-1 text-xs text-white/40">
        {summary.total} like{summary.total === 1 ? "" : "s"}
      </span>
    </form>
  );
}
