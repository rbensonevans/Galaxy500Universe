"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { randomUUID } from "@/lib/uuid";
import { AVATAR_BUCKET } from "@/lib/avatar";
import Avatar from "@/app/components/Avatar";
import type { Verification } from "@/lib/verification";
import { setAvatar } from "./actions";

const SIZE = 512; // stored photos are SIZE x SIZE
const MAX_INPUT_BYTES = 20 * 1024 * 1024;

// Center-crop to a square and scale to SIZE x SIZE JPEG, so a large phone
// photo becomes a ~50–100 KB file that loads quickly everywhere it's shown.
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't process images.");
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that image."))),
      "image/jpeg",
      0.88,
    ),
  );
}

export default function AvatarUploader({
  userId,
  path,
  name,
  verification,
}: {
  userId: string;
  path: string | null;
  name: string;
  verification?: Verification | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onPick(file: File | undefined) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      try {
        if (file.size > MAX_INPUT_BYTES) throw new Error("Photos must be 20 MB or smaller.");
        let blob: Blob;
        try {
          blob = await toSquareJpeg(file);
        } catch {
          throw new Error("Couldn't read that photo. Try a JPEG, PNG, or WebP image.");
        }
        const newPath = `${userId}/${randomUUID()}.jpg`;
        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(newPath, blob, { contentType: "image/jpeg", upsert: false });
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
        const result = await setAvatar(newPath);
        if (result.error) throw new Error(result.error);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't update your photo.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  function onRemove() {
    setError(null);
    startTransition(async () => {
      const result = await setAvatar(null);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        title="Change profile photo"
        className="group relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      >
        <Avatar path={path} name={name} className="h-20 w-20 text-3xl" verification={verification} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
          {isPending ? "Saving…" : "Change"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="text-violet-300 hover:text-violet-200 disabled:opacity-50"
        >
          {isPending ? "Saving…" : path ? "Change photo" : "Add photo"}
        </button>
        {path && !isPending && (
          <button type="button" onClick={onRemove} className="text-white/40 hover:text-white/70">
            Remove
          </button>
        )}
      </div>
      {error && <p className="max-w-[12rem] text-center text-xs text-rose-300">{error}</p>}
    </div>
  );
}
