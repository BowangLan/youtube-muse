"use client";

import { useIsPlaying } from "@/hooks/use-is-playing";
import type {
  SpotifySearchFilter,
  SpotifySearchResult,
  SpotifySearchType,
} from "@/lib/spotify/api";
import type { CatalogSearchResult } from "@/lib/store/search-store";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { SpotifyResultsGrid } from "./spotify/spotify-results-grid";
import { YouTubeResultCard } from "./youtube-result-card";

type CatalogSearchResultsSectionProps = {
  query: string;
  source: "youtube" | "spotify";
  spotifyType: SpotifySearchFilter;
  isSearching: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMoreError: string | null;
  error: string | null;
  results: CatalogSearchResult[];
  currentResultId: string | null;
  onResultClick: (index: number) => void;
  onSpotifySectionMore: (type: SpotifySearchType) => void;
  onLoadMore: () => void;
  searchBar?: React.ReactNode;
  emptyState?: React.ReactNode;
};

const SPOTIFY_SECTIONS: Array<{ type: SpotifySearchType; label: string }> = [
  { type: "track", label: "Tracks" },
  { type: "album", label: "Albums" },
  { type: "artist", label: "Artists" },
  { type: "playlist", label: "Playlists" },
];

export function CatalogSearchResultsSection({
  query,
  source,
  spotifyType,
  isSearching,
  isLoadingMore,
  hasMore,
  loadMoreError,
  error,
  results,
  currentResultId,
  onResultClick,
  onSpotifySectionMore,
  onLoadMore,
  searchBar,
  emptyState,
}: CatalogSearchResultsSectionProps) {
  const isPlaying = useIsPlaying();
  const isSpotifyOverview = source === "spotify" && spotifyType === "all";
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (
      !target ||
      source !== "spotify" ||
      spotifyType === "all" ||
      !hasMore ||
      isSearching ||
      isLoadingMore ||
      loadMoreError
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isSearching, loadMoreError, onLoadMore, source, spotifyType]);

  const renderSpotifyResults = (sectionResults: SpotifySearchResult[]) => (
    <SpotifyResultsGrid
      results={sectionResults}
      getResultIndex={(result) => results.indexOf(result)}
      currentResultId={currentResultId}
      isPlaying={isPlaying}
      onResultClick={onResultClick}
    />
  );

  return (
    <section className="h-full min-h-0 overflow-y-auto pb-(--bottom-spacing)">
      <div className="mb-4 flex flex-col gap-4 pb-1">
        {searchBar}
        <h2 className="h2">Search Results</h2>
      </div>

      {isSearching ? (
        <div className="flex h-[61.8vh] items-center justify-center text-white/60">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Searching {source === "spotify" ? "Spotify" : "YouTube"}...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : results.length === 0 ? (
        (emptyState ?? (
          <div className="flex h-[50vh] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 text-white/50">
            <Search className="size-8" />
            <p className="text-sm">
              {query.trim()
                ? `No ${source === "spotify" ? "Spotify results" : "videos"} found for "${query.trim()}".`
                : `Search ${source === "spotify" ? "Spotify's catalog" : "YouTube videos"} above.`}
            </p>
          </div>
        ))
      ) : isSpotifyOverview ? (
        <div className="space-y-10">
          {SPOTIFY_SECTIONS.map((section) => {
            const sectionResults = results.filter(
              (result): result is SpotifySearchResult =>
                result.source === "spotify" && result.resultType === section.type,
            );
            if (sectionResults.length === 0) return null;
            return (
              <section key={section.type} aria-labelledby={`spotify-${section.type}-heading`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3
                    id={`spotify-${section.type}-heading`}
                    className="text-sm font-medium text-foreground/85"
                  >
                    {section.label}
                  </h3>
                  <button
                    type="button"
                    onClick={() => onSpotifySectionMore(section.type)}
                    className="group/more inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    Load more
                    <ArrowRight className="size-3 transition-transform group-hover/more:translate-x-0.5" />
                  </button>
                </div>
                {renderSpotifyResults(sectionResults)}
              </section>
            );
          })}
        </div>
      ) : source === "spotify" ? (
        <>
          {renderSpotifyResults(
            results.filter((result): result is SpotifySearchResult => result.source === "spotify"),
          )}
          <div ref={loadMoreRef} className="flex min-h-24 items-center justify-center py-6">
            {isLoadingMore ? (
              <span className="inline-flex items-center gap-2 text-xs text-white/45">
                <Loader2 className="size-4 animate-spin" />
                Loading more results…
              </span>
            ) : loadMoreError ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-xs text-red-300/80">{loadMoreError}</p>
                <button
                  type="button"
                  onClick={onLoadMore}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  Try again
                </button>
              </div>
            ) : hasMore ? (
              <span className="sr-only">More results load as you scroll</span>
            ) : (
              <span className="text-[11px] text-white/25">End of results</span>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {results.map((result, index) =>
            result.source === "youtube" ? (
              <YouTubeResultCard
                key={`youtube:${result.id}`}
                result={result}
                index={index}
                currentResultId={currentResultId}
                isPlaying={isPlaying}
                onResultClick={onResultClick}
              />
            ) : null,
          )}
        </div>
      )}
    </section>
  );
}
