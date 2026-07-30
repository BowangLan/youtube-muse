"use client";

import * as React from "react";
import { Loader2, LogOut, RefreshCw } from "lucide-react";
import { usePlayerStore } from "@/lib/store/player-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useSpotifyPlayerStore } from "@/lib/store/spotify-player-store";
import {
  SPOTIFY_FAVORITES_PLAYLIST_ID,
  isSpotifyPlaylistId,
  spotifyPlaylistId,
  useSpotifyStore,
} from "@/lib/store/spotify-store";
import {
  isSpotifyConfigured,
  redirectToSpotifyAuthorize,
  SPOTIFY_CONNECT_PARAM,
  tokensHaveLibraryScopes,
  tokensHavePlaybackScopes,
} from "@/lib/spotify/auth";
import type { SpotifyPlaylist } from "@/lib/spotify/api";
import type { Playlist } from "@/lib/types/playlist";
import { toSpotifyTrack } from "@/lib/spotify/convert";
import { useV4AppStateStore } from "@/lib/store/v4-app-state-store";
import { useIsPlaying } from "@/hooks/use-is-playing";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

function SpotifyLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.502 17.308a.747.747 0 0 1-1.029.249c-2.818-1.722-6.365-2.111-10.542-1.157a.748.748 0 1 1-.333-1.458c4.571-1.045 8.492-.595 11.655 1.338.352.215.464.676.249 1.028zm1.469-3.267a.935.935 0 0 1-1.286.308c-3.226-1.983-8.144-2.558-11.96-1.4a.936.936 0 0 1-.543-1.79c4.36-1.323 9.78-.682 13.481 1.596.44.27.578.846.308 1.286zm.126-3.403C15.23 8.34 8.876 8.129 5.186 9.25a1.122 1.122 0 1 1-.652-2.148c4.237-1.286 11.28-1.038 15.73 1.605a1.123 1.123 0 0 1-1.147 1.931z" />
    </svg>
  );
}

function toPlaylist(playlist: SpotifyPlaylist): Playlist {
  const now = Date.now();
  return {
    id: spotifyPlaylistId(playlist.id),
    name: playlist.name,
    description: playlist.description || `Spotify playlist by ${playlist.ownerName}`,
    tracks: playlist.tracks.map(toSpotifyTrack),
    createdAt: now,
    updatedAt: now,
  };
}

function SpotifyPlaylistCard({
  playlist,
  imageUrl,
  contentId,
  contentLoaded,
  totalTracks,
  isLoading,
  loadError,
}: {
  playlist: Playlist;
  imageUrl: string | null;
  contentId: string;
  contentLoaded: boolean;
  totalTracks: number | null;
  isLoading: boolean;
  loadError: string | null;
}) {
  const dispatch = usePlayerStore((state) => state.dispatch);
  const openPlaylistDetail = useV4AppStateStore((state) => state.openPlaylistDetail);
  const loadPlaylistContents = useSpotifyStore((state) => state.loadPlaylistContents);
  const currentPlaylistId = usePlaylistStore((state) => state.currentPlaylistId);
  const setCurrentPlaylist = usePlaylistStore((state) => state.setCurrentPlaylist);
  const setCurrentTrackIndex = usePlaylistStore((state) => state.setCurrentTrackIndex);
  const setPlaylistTracks = usePlaylistStore((state) => state.setPlaylistTracks);
  const isPlaying = useIsPlaying();
  const isActive = currentPlaylistId === playlist.id;
  const isCurrentlyPlaying = isActive && isPlaying;

  const ensureContent = async () => {
    if (contentLoaded) return playlist.tracks;
    const tracks = await loadPlaylistContents(contentId);
    if (!tracks) return null;
    const normalizedTracks = tracks.map(toSpotifyTrack);
    setPlaylistTracks(playlist.id, normalizedTracks);
    return normalizedTracks;
  };

  const openPlaylist = async () => {
    const tracks = await ensureContent();
    if (!tracks) return;
    openPlaylistDetail(playlist.id);
  };

  const togglePlayback = async (event: React.MouseEvent) => {
    event.stopPropagation();
    const tracks = await ensureContent();
    if (!tracks || tracks.length === 0) return;
    if (isActive) {
      dispatch({ type: "UserTogglePlay" });
    } else {
      setCurrentPlaylist(playlist.id);
      setCurrentTrackIndex(0);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex min-h-40 w-full flex-col justify-between overflow-hidden rounded-2xl bg-white/3 p-5 text-left transition hover:scale-[1.01] hover:bg-white/6 active:scale-95",
        isActive && "intent-card-active",
      )}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25 transition duration-300 group-hover:opacity-35"
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-black/20" />
      <button
        type="button"
        aria-label={`Open ${playlist.name} playlist`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        disabled={isLoading}
        onClick={() => void openPlaylist()}
      />

      <div className="relative z-20 pointer-events-none flex items-start gap-2">
        <SpotifyLogo className="mt-1 size-4 shrink-0 text-[#1DB954]" />
        <div className="min-w-0">
          <h3 className="truncate text-lg/tight font-medium text-foreground md:text-2xl/tight">
            {playlist.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs/tight text-muted-foreground md:text-sm/tight">
            {playlist.description}
          </p>
        </div>
      </div>

      <div className="relative z-20 pointer-events-none mt-8 space-y-1 font-mono text-xs text-muted-foreground md:text-sm">
        <div>
          {totalTracks === null
            ? contentLoaded
              ? `${playlist.tracks.length.toLocaleString()} tracks`
              : "Load on open"
            : `${totalTracks.toLocaleString()} tracks`}
        </div>
        {loadError && <div className="font-sans text-[11px] text-red-300">{loadError}</div>}
      </div>

      <button
        type="button"
        aria-label={`${isCurrentlyPlaying ? "Pause" : "Play"} ${playlist.name}`}
        disabled={isLoading || (contentLoaded && playlist.tracks.length === 0)}
        onClick={(event) => void togglePlayback(event)}
        className="absolute bottom-3 right-4 z-30 flex size-10 items-center justify-center rounded-full bg-black/25 opacity-100 transition hover:scale-110 hover:bg-white/10 disabled:opacity-30 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isCurrentlyPlaying ? (
          <Icons.Pause className="size-5" />
        ) : (
          <Icons.Play className="size-5 translate-x-px" />
        )}
      </button>
    </div>
  );
}

export function SpotifyFavoritesSection() {
  const tokens = useSpotifyStore((state) => state.tokens);
  const profile = useSpotifyStore((state) => state.profile);
  const favorites = useSpotifyStore((state) => state.favorites);
  const favoritesLoaded = useSpotifyStore((state) => state.favoritesLoaded);
  const spotifyPlaylists = useSpotifyStore((state) => state.playlists);
  const isSyncing = useSpotifyStore((state) => state.isSyncing);
  const syncError = useSpotifyStore((state) => state.syncError);
  const loadingPlaylistIds = useSpotifyStore((state) => state.loadingPlaylistIds);
  const playlistErrors = useSpotifyStore((state) => state.playlistErrors);
  const syncLibrary = useSpotifyStore((state) => state.syncLibrary);
  const disconnect = useSpotifyStore((state) => state.disconnect);
  const playerReady = useSpotifyPlayerStore((state) => state.isReady);
  const playbackError = useSpotifyPlayerStore((state) => state.playbackError);
  const ensurePlaylist = usePlaylistStore((state) => state.ensurePlaylist);
  const updatePlaylist = usePlaylistStore((state) => state.updatePlaylist);
  const setPlaylistTracks = usePlaylistStore((state) => state.setPlaylistTracks);
  const deletePlaylist = usePlaylistStore((state) => state.deletePlaylist);

  const isConnected = tokens !== null;
  const canPlayback = isConnected && tokensHavePlaybackScopes(tokens?.scope);
  const canSyncLibrary = isConnected && tokensHaveLibraryScopes(tokens?.scope);

  const libraryPlaylists = React.useMemo(() => {
    const now = Date.now();
    return [
      {
        id: SPOTIFY_FAVORITES_PLAYLIST_ID,
        name: "Spotify Favorites",
        description: "Your liked songs on Spotify",
        tracks: favorites.map(toSpotifyTrack),
        createdAt: now,
        updatedAt: now,
        contentId: SPOTIFY_FAVORITES_PLAYLIST_ID,
        contentLoaded: favoritesLoaded ?? favorites.length > 0,
        totalTracks: favoritesLoaded ? favorites.length : null,
        imageUrl: favorites[0]?.albumArtUrl ?? null,
      },
      ...spotifyPlaylists.map((playlist) => ({
        ...toPlaylist(playlist),
        contentId: playlist.id,
        contentLoaded: playlist.tracksLoaded ?? playlist.tracks.length > 0,
        totalTracks: playlist.totalTracks,
        imageUrl: playlist.imageUrl,
      })),
    ];
  }, [favorites, favoritesLoaded, spotifyPlaylists]);

  React.useEffect(() => {
    if (canSyncLibrary) void syncLibrary();
  }, [canSyncLibrary, syncLibrary]);

  React.useEffect(() => {
    const currentIds = new Set(isConnected ? libraryPlaylists.map((playlist) => playlist.id) : []);
    usePlaylistStore.getState().playlists.forEach((playlist) => {
      if (isSpotifyPlaylistId(playlist.id) && !currentIds.has(playlist.id)) {
        deletePlaylist(playlist.id);
      }
    });
    if (!isConnected) return;
    libraryPlaylists.forEach((playlist) => {
      ensurePlaylist(playlist.id, playlist.name, playlist.description, playlist.tracks);
      updatePlaylist(playlist.id, {
        name: playlist.name,
        description: playlist.description,
      });
      if (playlist.contentLoaded) setPlaylistTracks(playlist.id, playlist.tracks);
    });
  }, [
    deletePlaylist,
    ensurePlaylist,
    isConnected,
    libraryPlaylists,
    setPlaylistTracks,
    updatePlaylist,
  ]);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(SPOTIFY_CONNECT_PARAM) !== "1") return;
    url.searchParams.delete(SPOTIFY_CONNECT_PARAM);
    window.history.replaceState(null, "", url.toString());
    if (!isConnected && isSpotifyConfigured()) {
      void redirectToSpotifyAuthorize();
    }
  }, [isConnected]);

  if (!isSpotifyConfigured()) return null;

  return (
    <section className="mt-10 space-y-4" aria-label="Spotify playlists">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <SpotifyLogo className="size-5 text-[#1DB954]" />
          <h2 className="text-lg font-medium text-foreground/90">Spotify</h2>
          {isConnected && (
            <span className="text-xs text-muted-foreground">
              {libraryPlaylists.length} playlists
            </span>
          )}
        </div>

        {isConnected && (
          <div className="flex items-center gap-1">
            {profile && (
              <span className="mr-1 hidden text-xs text-muted-foreground sm:inline">
                {profile.displayName}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              title="Sync Spotify library"
              disabled={isSyncing}
              onClick={() => void syncLibrary()}
            >
              <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon-sm" title="Disconnect Spotify" onClick={disconnect}>
              <LogOut className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-white/5 bg-card/20 p-6">
          <p className="text-sm text-muted-foreground">
            Connect Spotify to sync your liked songs and playlists. Playback requires Spotify
            Premium.
          </p>
          {syncError && <p className="text-xs text-red-400">{syncError}</p>}
          <Button
            className="gap-2 rounded-full bg-[#1DB954] text-black hover:bg-[#1ed760]"
            onClick={() => void redirectToSpotifyAuthorize()}
          >
            <SpotifyLogo className="size-4" />
            Connect Spotify
          </Button>
        </div>
      ) : (
        <>
          {(!canPlayback || !canSyncLibrary) && (
            <div className="flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
              <p className="flex-1 text-xs text-yellow-200/80">
                Reconnect Spotify to grant library and playback permissions.
              </p>
              <Button size="sm" variant="ghost" onClick={() => void redirectToSpotifyAuthorize()}>
                Reconnect
              </Button>
            </div>
          )}
          {canPlayback && playbackError && <p className="text-xs text-red-400">{playbackError}</p>}
          {canPlayback && !playbackError && !playerReady && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Preparing Spotify player…
            </p>
          )}
          {syncError && <p className="text-xs text-red-400">{syncError}</p>}

          {isSyncing && favorites.length === 0 && spotifyPlaylists.length === 0 ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Syncing Spotify playlist metadata…
            </div>
          ) : (
            <div
              className="grid gap-4 md:gap-5"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              }}
            >
              {libraryPlaylists.map((playlist) => (
                <SpotifyPlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  imageUrl={playlist.imageUrl}
                  contentId={playlist.contentId}
                  contentLoaded={playlist.contentLoaded}
                  totalTracks={playlist.totalTracks}
                  isLoading={loadingPlaylistIds.includes(playlist.contentId)}
                  loadError={playlistErrors[playlist.contentId] ?? null}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
