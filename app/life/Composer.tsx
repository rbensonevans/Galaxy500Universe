"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPost, type PostState } from "./actions";

const initialState: PostState = {};

export default function Composer({
  feed = "life",
  placeholder = "How is it going?",
}: {
  feed?: string;
  placeholder?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    createPost,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fileNameRef = useRef<HTMLParagraphElement>(null);

  // Reset the form and clear the attachment label after a successful post.
  // Only DOM is touched here (no React state), so no cascading renders.
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      if (fileNameRef.current) fileNameRef.current.textContent = "";
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
    >
      <input type="hidden" name="feed" value={feed} />
      <textarea
        name="content"
        rows={3}
        placeholder={placeholder}
        className="w-full resize-y rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
          </svg>
          Add image
          <input
            type="file"
            name="image"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (fileNameRef.current) {
                fileNameRef.current.textContent = file
                  ? `Attached: ${file.name}`
                  : "";
              }
            }}
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-2 font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Posting…" : "Post"}
        </button>
      </div>

      <p ref={fileNameRef} className="mt-2 truncate text-xs text-white/40" />

      {state.error && (
        <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {state.error}
        </p>
      )}
    </form>
  );
}
