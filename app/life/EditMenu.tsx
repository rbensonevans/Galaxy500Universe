"use client";

import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Linkify from "@/app/components/Linkify";
import { deleteComment, deletePost, editComment, editPost } from "./actions";

// Editing a post's caption or a comment: an EditScope wraps the item, its
// "…" menu (Edit / Delete) switches the EditableText inside it into a text box.

type Kind = "post" | "comment";
const EditContext = createContext<{ editing: boolean; setEditing: (v: boolean) => void }>({
  editing: false,
  setEditing: () => {},
});

export function EditScope({ children }: { children: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  return <EditContext.Provider value={{ editing, setEditing }}>{children}</EditContext.Provider>;
}

export function EditMenu({ kind, id }: { kind: Kind; id: string }) {
  const { setEditing } = useContext(EditContext);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "block w-full px-4 py-2 text-left text-sm transition hover:bg-white/10";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setConfirming(false);
        }}
        aria-label={`${kind === "post" ? "Post" : "Comment"} options`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full px-2 py-0.5 text-base leading-none text-white/40 transition hover:bg-white/10 hover:text-white"
      >
        …
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-white/15 bg-[#120f24] py-1 shadow-xl shadow-black/50"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setEditing(true);
              setOpen(false);
            }}
            className={`${item} text-white/85`}
          >
            Edit
          </button>
          {confirming ? (
            <form action={kind === "post" ? deletePost : deleteComment}>
              <input type="hidden" name="id" value={id} />
              <button type="submit" role="menuitem" className={`${item} font-medium text-rose-300`}>
                Confirm delete
              </button>
            </form>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => setConfirming(true)}
              className={`${item} text-rose-300/90`}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// The caption or comment text, or a text box while editing.
export function EditableText({
  kind,
  id,
  text,
  className,
}: {
  kind: Kind;
  id: string;
  text: string | null;
  className: string;
}) {
  const { editing, setEditing } = useContext(EditContext);
  const router = useRouter();
  const [draft, setDraft] = useState(text ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return text ? (
      <p className={className}>
        <Linkify text={text} />
      </p>
    ) : null;
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = kind === "post" ? await editPost(id, draft) : await editComment(id, draft);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function cancel() {
    setDraft(text ?? "");
    setError(null);
    setEditing(false);
  }

  return (
    <div className="mt-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && cancel()}
        autoFocus
        rows={kind === "post" ? 3 : 2}
        aria-label={kind === "post" ? "Edit caption" : "Edit comment"}
        className="w-full resize-y rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
      />
      {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={cancel}
          disabled={isPending}
          className="rounded-full px-3 py-1 text-xs text-white/60 transition hover:text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
