import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { refreshSpotifyTokens, type SpotifyTokens } from "@/lib/spotify/auth";
import {
  fetchAllSavedTracks,
  fetchSpotifyLibrary,
  fetchSpotifyPlaylistTracks,
  fetchSpotifyProfile,
  getErrorLogDetails,
  SpotifyApiError,
  type SpotifyFavoriteTrack,
  type SpotifyPlaylist,
  type SpotifyProfile,
} from "@/lib/spotify/api";

export const SPOTIFY_FAVORITES_PLAYLIST_ID = "spotify:favorites";
export const spotifyPlaylistId = (id: string) => `spotify:playlist:${id}`;
export const spotifySourcePlaylistId = (id: string) => {
  if (id === SPOTIFY_FAVORITES_PLAYLIST_ID) return id;
  const prefix = "spotify:playlist:";
  return id.startsWith(prefix) ? id.slice(prefix.length) : null;
};
export const isSpotifyPlaylistId = (id: string | null | undefined) =>
  id?.startsWith("spotify:") ?? false;

interface SpotifyState {
  tokens: SpotifyTokens | null;
  profile: SpotifyProfile | null;
  favorites: SpotifyFavoriteTrack[];
  favoritesLoaded: boolean;
  playlists: SpotifyPlaylist[];
  isSyncing: boolean;
  syncError: string | null;
  loadingPlaylistIds: string[];
  playlistErrors: Record<string, string>;
  lastSyncedAt: number | null;
}

interface SpotifyActions {
  connect: (tokens: SpotifyTokens) => Promise<void>;
  disconnect: () => void;
  /** Returns a valid access token, refreshing it if expired. */
  getValidAccessToken: () => Promise<string | null>;
  syncLibrary: () => Promise<void>;
  loadPlaylistContents: (playlistId: string) => Promise<SpotifyFavoriteTrack[] | null>;
}

function spotifyErrorMessage(error: SpotifyApiError) {
  if (error.status === 401) return "Spotify session expired. Please reconnect.";
  if (error.status === 403) return "Spotify does not allow this playlist's contents to be read.";
  if (error.status === 429) {
    return error.retryAfter
      ? `Spotify rate limit reached. Try again in ${error.retryAfter} seconds.`
      : "Spotify rate limit reached. Please try again shortly.";
  }
  return `Spotify request failed (${error.status}). Previously loaded data was kept.`;
}

export const useSpotifyStore = create<SpotifyState & SpotifyActions>()(
  persist(
    (set, get) => ({
      tokens: null,
      profile: null,
      favorites: [],
      favoritesLoaded: false,
      playlists: [],
      isSyncing: false,
      syncError: null,
      loadingPlaylistIds: [],
      playlistErrors: {},
      lastSyncedAt: null,

      connect: async (tokens) => {
        set({ tokens, syncError: null });
        await Promise.allSettled([
          fetchSpotifyProfile(tokens.accessToken)
            .then((profile) => set({ profile }))
            .catch((error) => {
              console.error(
                `[spotify-store] Failed to load Spotify profile\n${JSON.stringify(
                  getErrorLogDetails(error),
                  null,
                  2,
                )}`,
              );
            }),
          get().syncLibrary(),
        ]);
      },

      disconnect: () => {
        set({
          tokens: null,
          profile: null,
          favorites: [],
          favoritesLoaded: false,
          playlists: [],
          isSyncing: false,
          syncError: null,
          loadingPlaylistIds: [],
          playlistErrors: {},
          lastSyncedAt: null,
        });
      },

      getValidAccessToken: async () => {
        const { tokens } = get();
        if (!tokens) return null;
        if (Date.now() < tokens.expiresAt - 60_000) return tokens.accessToken;
        try {
          const refreshed = await refreshSpotifyTokens(tokens.refreshToken);
          set({ tokens: { ...refreshed, scope: refreshed.scope ?? tokens.scope } });
          return refreshed.accessToken;
        } catch (error) {
          console.error(
            `[spotify-store] Failed to refresh access token\n${JSON.stringify(
              getErrorLogDetails(error),
              null,
              2,
            )}`,
          );
          set({ syncError: "Spotify session expired. Please reconnect." });
          return null;
        }
      },

      syncLibrary: async () => {
        if (get().isSyncing) {
          console.info("[spotify-store] Ignored sync request because a sync is already running");
          return;
        }

        const startedAt = performance.now();
        console.info("[spotify-store] Starting Spotify library sync");
        set({ isSyncing: true, syncError: null });
        try {
          const accessToken = await get().getValidAccessToken();
          if (!accessToken) {
            console.warn("[spotify-store] Aborted sync because no valid access token is available");
            return;
          }

          const result = await fetchSpotifyLibrary(accessToken);
          const previousPlaylists = get().playlists;
          const refreshedPlaylists = result.data.map((playlist) => {
            const previous = previousPlaylists.find((item) => item.id === playlist.id);
            if (!previous) return playlist;
            return {
              ...playlist,
              tracks: previous.tracks,
              tracksLoaded: previous.tracksLoaded ?? previous.tracks.length > 0,
            };
          });
          const playlists = result.error
            ? [
                ...refreshedPlaylists,
                ...previousPlaylists.filter(
                  (previous) => !refreshedPlaylists.some((playlist) => playlist.id === previous.id),
                ),
              ]
            : refreshedPlaylists;

          set({
            playlists,
            syncError: result.error ? spotifyErrorMessage(result.error) : null,
            lastSyncedAt: result.error ? get().lastSyncedAt : Date.now(),
          });
          console.info("[spotify-store] Spotify library sync completed", {
            durationMs: Math.round(performance.now() - startedAt),
            playlistCount: playlists.length,
            partial: result.error !== null,
          });
        } catch (error) {
          const apiError = error instanceof SpotifyApiError ? error : null;
          console.error(
            `[spotify-store] Spotify library sync failed\n${JSON.stringify(
              {
                durationMs: Math.round(performance.now() - startedAt),
                status: apiError?.status,
                path: apiError?.path,
                retryAfter: apiError?.retryAfter,
                responseBody: apiError?.responseBody,
                error: getErrorLogDetails(error),
              },
              null,
              2,
            )}`,
          );

          if (apiError?.status === 401) {
            set({ syncError: "Spotify session expired. Please reconnect." });
          } else if (apiError?.status === 429) {
            const retryMessage = apiError.retryAfter
              ? ` Try again in ${apiError.retryAfter} seconds.`
              : " Please try again shortly.";
            set({ syncError: `Spotify rate limit reached.${retryMessage}` });
          } else {
            set({ syncError: "Failed to sync your Spotify library. Please try again." });
          }
        } finally {
          set({ isSyncing: false });
        }
      },

      loadPlaylistContents: async (playlistId) => {
        const state = get();
        const existingTracks =
          playlistId === SPOTIFY_FAVORITES_PLAYLIST_ID
            ? state.favorites
            : state.playlists.find((playlist) => playlist.id === playlistId)?.tracks;
        const isLoaded =
          playlistId === SPOTIFY_FAVORITES_PLAYLIST_ID
            ? state.favoritesLoaded
            : state.playlists.find((playlist) => playlist.id === playlistId)?.tracksLoaded;

        if (isLoaded && !state.playlistErrors[playlistId]) return existingTracks ?? [];
        if (state.loadingPlaylistIds.includes(playlistId)) return null;

        set((current) => ({
          loadingPlaylistIds: [...current.loadingPlaylistIds, playlistId],
          playlistErrors: Object.fromEntries(
            Object.entries(current.playlistErrors).filter(([id]) => id !== playlistId),
          ),
        }));

        try {
          const accessToken = await get().getValidAccessToken();
          if (!accessToken) return null;

          const result =
            playlistId === SPOTIFY_FAVORITES_PLAYLIST_ID
              ? await fetchAllSavedTracks(accessToken)
              : await fetchSpotifyPlaylistTracks(accessToken, playlistId);
          const hasUsableResult = result.error === null || result.data.length > 0;

          set((current) => ({
            ...(playlistId === SPOTIFY_FAVORITES_PLAYLIST_ID
              ? {
                  favorites: hasUsableResult ? result.data : current.favorites,
                  favoritesLoaded: hasUsableResult || current.favoritesLoaded,
                }
              : {
                  playlists: current.playlists.map((playlist) =>
                    playlist.id === playlistId
                      ? {
                          ...playlist,
                          tracks: hasUsableResult ? result.data : playlist.tracks,
                          tracksLoaded: hasUsableResult || playlist.tracksLoaded,
                        }
                      : playlist,
                  ),
                }),
            playlistErrors: result.error
              ? {
                  ...current.playlistErrors,
                  [playlistId]: spotifyErrorMessage(result.error),
                }
              : Object.fromEntries(
                  Object.entries(current.playlistErrors).filter(([id]) => id !== playlistId),
                ),
          }));

          if (!hasUsableResult) return null;
          return result.data;
        } catch (error) {
          console.error(
            `[spotify-store] Failed to load Spotify playlist contents\n${JSON.stringify(
              { playlistId, error: getErrorLogDetails(error) },
              null,
              2,
            )}`,
          );
          set((current) => ({
            playlistErrors: {
              ...current.playlistErrors,
              [playlistId]: "Failed to load playlist. Previously loaded data was kept.",
            },
          }));
          return null;
        } finally {
          set((current) => ({
            loadingPlaylistIds: current.loadingPlaylistIds.filter((id) => id !== playlistId),
          }));
        }
      },
    }),
    {
      name: "spotify-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tokens: state.tokens,
        profile: state.profile,
        // Cap favorites to avoid blowing localStorage (~5 MB limit).
        // Full list stays in memory and can be re-fetched via the API.
        favorites: state.favorites.slice(0, 500),
        favoritesLoaded: state.favoritesLoaded,
        // Strip per-playlist tracks — they're loaded on demand via loadPlaylistContents.
        playlists: state.playlists.map(({ tracks: _tracks, ...rest }) => rest),
        lastSyncedAt: state.lastSyncedAt,
      }),
    },
  ),
);
