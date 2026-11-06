"use client";

import { useState } from "react";

// A YouTube video in a post. Shows the thumbnail until clicked, so a feed of
// videos doesn't load a player per post (or contact YouTube's player before
// the citizen chooses to watch). Uses YouTube's privacy-enhanced domain.
export default function YouTubeEmbed({ id }: { id: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label="Play video"
          className="group absolute inset-0 h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 68 48" className="h-12 w-[4.25rem] drop-shadow-lg transition group-hover:scale-110">
              <path d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.2.3 34 .3 34 .3s-21.2 0-26.5 1.4a8.5 8.5 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3Z" fill="#f00" />
              <path d="M45 24 27 14v20z" fill="#fff" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
