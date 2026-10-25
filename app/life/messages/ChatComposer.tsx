"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { randomUUID } from "@/lib/uuid";
import { sendMessage, sendGlxy, type ChatState } from "./actions";

const initialState: ChatState = {};

// Message images go straight from the browser to the private bucket (server
// actions cap request bodies at 1 MB); only the storage path is sent along.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // matches the bucket limit
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

// Any unexpected failure (network, a rejected server call) is shown in the
// composer instead of crashing the page.
async function sendWithImage(
  prevState: ChatState,
  formData: FormData,
): Promise<ChatState> {
  try {
    return await uploadThenSend(prevState, formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't send. Try again." };
  }
}

async function uploadThenSend(
  prevState: ChatState,
  formData: FormData,
): Promise<ChatState> {
  const image = formData.get("image");
  formData.delete("image");
  if (image instanceof File && image.size > 0) {
    const ext = IMAGE_EXTENSIONS[image.type];
    if (!ext) return { error: "Images must be PNG, JPEG, GIF, or WebP." };
    if (image.size > MAX_IMAGE_BYTES) {
      return { error: "Images must be 5 MB or smaller." };
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You must be signed in." };
    const path = `${user.id}/${randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("message-images")
      .upload(path, image, { contentType: image.type, upsert: false });
    if (error) return { error: `Image upload failed: ${error.message}` };
    formData.set("image_path", path);
  }
  return sendMessage(prevState, formData);
}

const inputClass =
  "rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30";

function fmtGlxy(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Message box plus a "Send GLXY" panel. Each form resets after a successful
// send (actions return a fresh state object every time, so the effect reruns).
export default function ChatComposer({
  to,
  recipientName,
  glxyEnabled,
  balance,
}: {
  to: string;
  recipientName: string;
  /** False while a message request is pending (GLXY and images unlock on accept). */
  glxyEnabled: boolean;
  balance: number | null;
}) {
  const [msgState, msgAction, msgPending] = useActionState(sendWithImage, initialState);
  const [glxyState, glxyAction, glxyPending] = useActionState(sendGlxy, initialState);
  const [showGlxy, setShowGlxy] = useState(false);
  const msgForm = useRef<HTMLFormElement>(null);
  const glxyForm = useRef<HTMLFormElement>(null);
  const fileNameRef = useRef<HTMLParagraphElement>(null);

  // Reset the form and attachment label after a send (DOM only, no state).
  useEffect(() => {
    if (msgState.success) {
      msgForm.current?.reset();
      if (fileNameRef.current) fileNameRef.current.textContent = "";
    }
  }, [msgState]);
  useEffect(() => {
    if (glxyState.success) glxyForm.current?.reset();
  }, [glxyState]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      {showGlxy && glxyEnabled && (
        <form
          ref={glxyForm}
          action={glxyAction}
          className="mb-4 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4"
        >
          <input type="hidden" name="to" value={to} />
          <p className="text-sm font-medium text-white">
            Send GLXY to {recipientName}
          </p>
          {balance != null && (
            <p className="mt-0.5 text-xs text-white/40">
              Spendable: {fmtGlxy(balance)} GLXY
            </p>
          )}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="Amount"
              className={`${inputClass} sm:w-36`}
            />
            <input
              name="note"
              maxLength={500}
              placeholder="Add a note (optional)"
              className={`${inputClass} flex-1`}
            />
            <button
              type="submit"
              disabled={glxyPending}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {glxyPending ? "Sending…" : "Send GLXY"}
            </button>
          </div>
          {glxyState.error && (
            <p className="mt-2 text-sm text-rose-300">{glxyState.error}</p>
          )}
        </form>
      )}

      <form ref={msgForm} action={msgAction} className="flex items-end gap-2">
        <input type="hidden" name="to" value={to} />
        <button
          type="button"
          onClick={() => setShowGlxy((v) => !v)}
          disabled={!glxyEnabled}
          title={
            glxyEnabled
              ? "Send GLXY"
              : "Send GLXY unlocks once they accept your message request"
          }
          aria-pressed={showGlxy}
          className={`shrink-0 rounded-lg border px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            showGlxy && glxyEnabled
              ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-100"
              : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          GLXY
        </button>
        <label
          title={
            glxyEnabled
              ? "Attach an image"
              : "Images unlock once they accept your message request"
          }
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white/70 transition ${
            glxyEnabled ? "cursor-pointer hover:bg-white/10" : "cursor-not-allowed opacity-40"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
          </svg>
          Photo
          <input
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/gif,image/webp"
            disabled={!glxyEnabled}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (fileNameRef.current) {
                fileNameRef.current.textContent = file ? `Attached: ${file.name}` : "";
              }
            }}
          />
        </label>
        <textarea
          name="body"
          rows={1}
          maxLength={4000}
          placeholder={`Message ${recipientName}…`}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter adds a new line.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          className={`${inputClass} min-h-[2.75rem] flex-1 resize-y`}
        />
        <button
          type="submit"
          disabled={msgPending}
          className="shrink-0 rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 disabled:opacity-60"
        >
          {msgPending ? "Sending…" : "Send"}
        </button>
      </form>
      <p ref={fileNameRef} className="mt-2 truncate text-xs text-white/40 empty:hidden" />
      {msgState.error && (
        <p className="mt-2 text-sm text-rose-300">{msgState.error}</p>
      )}
    </div>
  );
}
