// The emoji palette offered for reacting to posts and comments.
export const EMOJIS = ["👍", "❤️", "😂", "🎉", "🚀", "🌟"] as const;

export type TargetType = "post" | "comment";

// Aggregated reaction state for a single target (post or comment).
export type ReactionSummary = {
  /** count of each emoji that has at least one reaction */
  counts: Record<string, number>;
  /** emojis the current user has applied to this target */
  mine: Set<string>;
  /** total number of reactions across all emojis */
  total: number;
};
