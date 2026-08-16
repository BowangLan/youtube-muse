import type { SpotifyPlaylistSearchResult } from "@/lib/spotify/api";
import { catalogAuthorNames, catalogPrimaryImage } from "@/lib/types/catalog-search";
import { ExternalLink, ListMusic } from "lucide-react";

export function SpotifyPlaylistResultCard({ result }: { result: SpotifyPlaylistSearchResult }) {
  const imageUrl = catalogPrimaryImage(result.images);

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noreferrer"
      className="group relative flex min-h-36 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.035] p-4 transition hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      aria-label={`Open playlist ${result.title} on Spotify`}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover opacity-25 transition duration-500 group-hover:scale-105 group-hover:opacity-35"
        />
      )}
      <span className="absolute inset-0 bg-linear-to-r from-black/90 via-black/65 to-black/25" />
      <span className="relative flex min-w-0 flex-1 flex-col justify-between">
        <span className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#68db91]">
          <ListMusic className="size-3.5" />
          Playlist
        </span>
        <span>
          <span className="block truncate text-base font-medium text-white sm:text-lg">
            {result.title}
          </span>
          <span className="mt-1 block truncate text-xs text-white/60">
            By {catalogAuthorNames(result.authors) || "Spotify"}
          </span>
          <span className="mt-2 block font-mono text-[11px] text-white/40">
            {result.totalItems !== null ? `${result.totalItems} tracks` : ""}
          </span>
        </span>
      </span>
      <ExternalLink className="relative size-4 shrink-0 text-white/35 transition-colors group-hover:text-white/75" />
    </a>
  );
}
