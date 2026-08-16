import type { SpotifySearchResult, SpotifySearchType } from "@/lib/spotify/api";
import { SpotifyAlbumResultCard } from "./spotify-album-result-card";
import { SpotifyArtistResultCard } from "./spotify-artist-result-card";
import { SpotifyPlaylistResultCard } from "./spotify-playlist-result-card";
import { SpotifyTrackResultCard } from "./spotify-track-result-card";

type SpotifyResultsGridProps = {
  results: SpotifySearchResult[];
  getResultIndex: (result: SpotifySearchResult) => number;
  currentResultId: string | null;
  isPlaying: boolean;
  onResultClick: (index: number) => void;
};

function spotifyGridClass(type: SpotifySearchType) {
  if (type === "track") return "grid gap-2 sm:grid-cols-2 lg:grid-cols-3";
  if (type === "album") return "grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6";
  if (type === "artist") return "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5";
  return "grid gap-3 md:grid-cols-2";
}

export function SpotifyResultsGrid({
  results,
  getResultIndex,
  currentResultId,
  isPlaying,
  onResultClick,
}: SpotifyResultsGridProps) {
  return (
    <div className={spotifyGridClass(results[0]?.resultType ?? "track")}>
      {results.map((result) => {
        const key = `spotify:${result.resultType}:${result.id}`;
        if (result.resultType === "track") {
          return (
            <SpotifyTrackResultCard
              key={key}
              result={result}
              index={getResultIndex(result)}
              currentResultId={currentResultId}
              isPlaying={isPlaying}
              onResultClick={onResultClick}
            />
          );
        }
        if (result.resultType === "album") {
          return <SpotifyAlbumResultCard key={key} result={result} />;
        }
        if (result.resultType === "artist") {
          return <SpotifyArtistResultCard key={key} result={result} />;
        }
        return <SpotifyPlaylistResultCard key={key} result={result} />;
      })}
    </div>
  );
}
