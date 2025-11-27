"use client";

import Image from "next/image";
import { getThumbnailUrl } from "@/lib/utils/youtube";
import { Music } from "lucide-react";
import { usePlaylistStore } from "@/lib/store/playlist-store";

export function NowPlaying() {
  const { getCurrentTrack } = usePlaylistStore();
  const track = getCurrentTrack();
  if (!track) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50">
            <Music className="h-12 w-12 text-zinc-600" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-white tracking-tight">
              No Track Selected
            </h2>
            <p className="text-sm text-zinc-500">
              Add a track to your playlist to start listening
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-white/5 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur-lg lg:p-8">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-center">
        {/* Album Art */}
        <div className="group relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-black/30 ring-1 ring-white/5">
          <div className="absolute inset-0 scale-[1.02] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_40%)]" />
          <Image
            src={getThumbnailUrl(track.id)}
            alt={track.title}
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
        </div>

        {/* Track Info */}
        <div className="space-y-4 text-left">
          <p className="text-xs uppercase tracking-[0.25em] text-white/50">
            Now playing
          </p>
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-white">
            {track.title}
          </h2>
          <p className="text-sm text-zinc-400">{track.author || "Unknown Artist"}</p>

          <div className="flex flex-wrap gap-2 text-xs text-white/60">
            <span className="rounded-full border border-white/10 px-3 py-1">YouTube</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Focus ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
