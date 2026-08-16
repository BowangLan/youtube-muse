import type { SpotifyArtistSearchResult } from "@/lib/spotify/api";
import { UserRound } from "lucide-react";
import { SpotifyResultImage } from "./spotify-result-image";

export function SpotifyArtistResultCard({ result }: { result: SpotifyArtistSearchResult }) {
  return (
    <a
      href={result.url}
      target="_blank"
      rel="noreferrer"
      className="group flex min-w-0 flex-col items-center rounded-2xl border border-transparent px-3 py-5 text-center transition-colors hover:border-white/10 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      aria-label={`Open artist ${result.title} on Spotify`}
    >
      <span className="relative size-28 overflow-hidden rounded-full bg-white/[0.05] shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-[1.03] sm:size-32">
        <SpotifyResultImage
          result={result}
          icon={UserRound}
          className="size-full rounded-full object-cover"
        />
      </span>
      <span className="mt-4 block w-full truncate text-sm font-medium text-white/90">
        {result.title}
      </span>
      <span className="mt-1 block w-full truncate text-xs text-white/45">
        {result.genres.slice(0, 2).join(" • ") || "Artist"}
      </span>
      <span className="mt-1 block text-[11px] text-white/30">
        {result.followersTotal !== null
          ? `${result.followersTotal.toLocaleString()} followers`
          : ""}
      </span>
    </a>
  );
}
