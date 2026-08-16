import type { SpotifyAlbumSearchResult } from "@/lib/spotify/api";
import { catalogAuthorNames } from "@/lib/types/catalog-search";
import { Album, ExternalLink } from "lucide-react";
import { SpotifyResultImage } from "./spotify-result-image";

export function SpotifyAlbumResultCard({ result }: { result: SpotifyAlbumSearchResult }) {
  return (
    <a
      href={result.url}
      target="_blank"
      rel="noreferrer"
      className="group block min-w-0 rounded-2xl border border-transparent bg-white/[0.035] p-2.5 transition hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      aria-label={`Open album ${result.title} on Spotify`}
    >
      <span className="relative block aspect-square overflow-hidden rounded-xl bg-black/30 shadow-xl shadow-black/20">
        <SpotifyResultImage result={result} icon={Album} className="size-full object-cover" />
        <span className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <ExternalLink className="absolute bottom-2 right-2 size-4 text-white opacity-0 transition-opacity group-hover:opacity-80" />
      </span>
      <span className="mt-3 block truncate text-sm font-medium text-white/90">{result.title}</span>
      <span className="mt-1 block truncate text-xs text-white/50">
        {catalogAuthorNames(result.authors)}
      </span>
      <span className="mt-1 block text-[11px] text-white/30">
        {[result.releaseDate?.slice(0, 4), result.totalTracks && `${result.totalTracks} tracks`]
          .filter(Boolean)
          .join(" • ")}
      </span>
    </a>
  );
}
