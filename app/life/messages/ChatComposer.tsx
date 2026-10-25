"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendMessage, sendGlxy, type ChatState } from "./actions";

const initialState: ChatState = {};

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
  /** False while a message request is pending (GLXY unlocks on accept). */
  glxyEnabled: boolean;
  balance: number | null;
}) {
  const [msgState, msgAction, msgPending] = useActionState(sendMessage, initialState);
  const [glxyState, glxyAction, glxyPending] = useActionState(sendGlxy, initialState);
  const [showGlxy, setShowGlxy] = useState(false);
  const msgForm = useRef<HTMLFormElement>(null);
  const glxyForm = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (msgState.success) msgForm.current?.reset();
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
      {msgState.error && (
        <p className="mt-2 text-sm text-rose-300">{msgState.error}</p>
      )}
    </div>
  );
}
