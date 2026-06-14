"use client";

import { useActionState, useEffect, useRef } from "react";
import { createComment, type CommentState } from "./actions";

const initialState: CommentState = {};

export default function CommentForm({ postId }: { postId: string }) {
  const [state, formAction, isPending] = useActionState(
    createComment,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="mt-3">
      <input type="hidden" name="post_id" value={postId} />
      <div className="flex items-center gap-2">
        <input
          name="content"
          placeholder="Add a comment…"
          className="flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-60"
        >
          {isPending ? "…" : "Post"}
        </button>
      </div>
      {state.error && (
        <p className="mt-1 text-xs text-rose-300">{state.error}</p>
      )}
    </form>
  );
}
