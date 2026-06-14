"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "./actions";

type Profile = {
  username: string | null;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
};

const initialState: ProfileState = {};

const inputClass =
  "rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30";

export default function ProfileForm({
  profile,
  email,
}: {
  profile: Profile | null;
  email: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
    >
      <div className="grid grid-cols-1 gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/70">Email</span>
          <input
            value={email}
            disabled
            className={`${inputClass} cursor-not-allowed text-white/50`}
          />
          <span className="text-xs text-white/30">
            Your email is managed by your account and can&apos;t be changed here.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/70">Handle</span>
          <div className="flex items-center gap-2">
            <span className="text-white/40">@</span>
            <input
              name="username"
              defaultValue={profile?.username ?? ""}
              placeholder="yourhandle"
              pattern="[a-zA-Z0-9_]{3,20}"
              className={`${inputClass} flex-1`}
            />
          </div>
          <span className="text-xs text-white/30">
            3–20 letters, numbers, or underscores. Others use this to send you
            Galaxy Credits.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/70">Display name</span>
          <input
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            placeholder="How you appear across the universe"
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-white/70">Location</span>
            <input
              name="location"
              defaultValue={profile?.location ?? ""}
              placeholder="Earth, Milky Way"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-white/70">Website</span>
            <input
              name="website"
              type="url"
              defaultValue={profile?.website ?? ""}
              placeholder="https://…"
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/70">Bio</span>
          <textarea
            name="bio"
            rows={4}
            defaultValue={profile?.bio ?? ""}
            placeholder="Tell the universe about yourself…"
            className={`${inputClass} resize-y`}
          />
        </label>
      </div>

      {state.error && (
        <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-5 rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-2.5 font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
