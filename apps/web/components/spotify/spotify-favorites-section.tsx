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
import { SpotifyLogo } from "@/components/spotify/spotify-logo";

function toPlaylist(playlist: SpotifyPlaylist): Playlist {
  const now = Date.now();
  const tracks = playlist.tracks ?? [];
  return {
    id: spotifyPlaylistId(playlist.id),
    name: playlist.name,
    description: playlist.description || `Spotify playlist by ${playlist.ownerName}`,
    tracks: tracks.map(toSpotifyTrack),
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

  const openPlaylist = () => {
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
        "group relative flex min-h-44 w-full flex-col justify-between overflow-hidden rounded-2xl bg-white/3 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-white/6 active:translate-y-0 active:scale-[0.98]",
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
        aria-busy={isLoading}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        onClick={openPlaylist}
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
              : "Tracks load when opened"
            : `${totalTracks.toLocaleString()} tracks`}
        </div>
        {loadError && <div className="font-sans text-[11px] text-red-300">{loadError}</div>}
      </div>

      <button
        type="button"
        aria-label={`${isCurrentlyPlaying ? "Pause" : "Play"} ${playlist.name}`}
        disabled={isLoading || (contentLoaded && playlist.tracks.length === 0)}
        onClick={(event) => void togglePlayback(event)}
        className="absolute bottom-3 right-4 z-30 flex size-11 items-center justify-center rounded-full bg-black/45 text-white/90 opacity-90 transition duration-200 hover:scale-105 hover:bg-black/65 hover:opacity-100 active:scale-[0.98] disabled:opacity-30"
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
        name: "Liked Songs",
        description: "Songs you've saved on Spotify",
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
        contentLoaded: playlist.tracksLoaded ?? (playlist.tracks?.length ?? 0) > 0,
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
    <section className="space-y-5" aria-label="Spotify library">
      <div className="flex min-h-16 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SpotifyLogo className="size-6 shrink-0 text-[#1DB954]" />
          <div className="min-w-0">
            <h1 className="text-xl font-medium text-foreground/90">Spotify Library</h1>
            <p className="truncate text-xs text-muted-foreground">
              {isConnected
                ? profile?.displayName
                  ? `Connected as ${profile.displayName}`
                  : `${libraryPlaylists.length} playlists available`
                : "Liked Songs and playlists, inside Muse"}
            </p>
          </div>
        </div>

        {isConnected && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sync Spotify library"
              title="Sync Spotify library"
              disabled={isSyncing}
              onClick={() => void syncLibrary()}
              className="size-11"
            >
              <RefreshCw className={cn("size-4", isSyncing && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Disconnect Spotify"
              title="Disconnect Spotify"
              onClick={disconnect}
              className="size-11"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.035] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(29,185,84,0.13),transparent_42%)]" />
          <div className="relative max-w-xl space-y-4">
            <div className="space-y-1.5">
              <h2 className="text-lg font-medium text-foreground">
                Bring your Spotify library into Muse
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Sync Liked Songs and playlists, then listen without switching apps. In-app playback
                requires Spotify Premium.
              </p>
            </div>
            {syncError && <p className="text-xs text-red-400">{syncError}</p>}
            <Button
              className="h-11 gap-2 rounded-full bg-[#1DB954] px-5 font-medium text-black hover:bg-[#1ed760] active:scale-[0.98]"
              onClick={() => void redirectToSpotifyAuthorize()}
            >
              <SpotifyLogo className="size-4" />
              Connect Spotify
            </Button>
            <p className="text-xs text-muted-foreground">You'll continue securely on Spotify.</p>
          </div>
        </div>
      ) : (
        <>
          {(!canPlayback || !canSyncLibrary) && (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 sm:flex-row sm:items-center">
              <p className="flex-1 text-xs text-yellow-200/80">
                Spotify needs updated permission to sync your library and play tracks here.
              </p>
              <Button size="sm" variant="ghost" onClick={() => void redirectToSpotifyAuthorize()}>
                Reconnect
              </Button>
            </div>
          )}
          {canPlayback && playbackError && (
            <div
              role="alert"
              className="rounded-xl border border-red-400/15 bg-red-400/5 px-4 py-3 text-sm text-red-300"
            >
              {playbackError}
            </div>
          )}
          {canPlayback && !playbackError && !playerReady && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Preparing Spotify player…
            </p>
          )}
          {syncError && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border border-red-400/15 bg-red-400/5 px-4 py-3 text-sm text-red-300 sm:flex-row sm:items-center"
            >
              <p className="flex-1">{syncError}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void syncLibrary()}
                disabled={isSyncing}
              >
                Try again
              </Button>
            </div>
          )}

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
