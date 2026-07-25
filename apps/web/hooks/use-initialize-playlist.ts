"use client";

import * as React from "react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store";
import { buildIntentQuery, INTENTS } from "@/lib/intents";
import {
  searchYouTubeUnofficial,
  type SearchVideoResult,
} from "@/app/actions/youtube-search-unofficial";
import { getYouTubeVideoDetailUnofficial } from "@/app/actions/youtube-video-detail-unofficial";
import { parseDuration } from "@/lib/utils/youtube";

/**
 * Fetch full video details for the given tracks and merge them into the
 * playlist. Search results only carry title/channel/thumbnail, so duration,
 * author thumbnail and publish date have to come from the detail endpoint.
 */
function enrichTrackDetails(playlistId: string, trackIds: string[]) {
  void Promise.allSettled(
    trackIds.map(async (trackId) => {
      const { result } = await getYouTubeVideoDetailUnofficial(
        `https://www.youtube.com/watch?v=${trackId}`
      );
      if (!result) return;

      usePlaylistStore.getState().updateTrackInfo(playlistId, trackId, {
        title: result.title || undefined,
        author: result.channel.title || undefined,
        authorUrl: result.channel.url || undefined,
        authorThumbnail: result.channel.thumbnail || undefined,
        duration: result.durationSeconds || undefined,
        thumbnailUrl: result.thumbnail || undefined,
        publishedAt: result.publishTime
          ? new Date(result.publishTime).toISOString()
          : undefined,
        publishedTimeText: result.publishTime
          ? new Date(result.publishTime).toLocaleDateString()
          : undefined,
      });
    })
  );
}

/**
 * Backfill details for tracks that were seeded before details were loaded
 * (duration 0 means the detail fetch never happened or failed).
 */
function backfillMissingTrackDetails() {
  const { playlists } = usePlaylistStore.getState();
  for (const playlist of playlists) {
    const missingIds = playlist.tracks
      .filter((track) => !track.duration)
      .map((track) => track.id);
    if (missingIds.length > 0) {
      enrichTrackDetails(playlist.id, missingIds);
    }
  }
}

/**
 * Hook to initialize default playlist on first load
 * Creates a default playlist if none exists, and sets the current playlist
 * if playlists exist but no current playlist is selected
 */
export function useInitializePlaylist() {
  const setCurrentPlaylist = usePlaylistStore((state) => state.setCurrentPlaylist);
  const createPlaylist = usePlaylistStore((state) => state.createPlaylist);
  const updatePlaylist = usePlaylistStore((state) => state.updatePlaylist);
  const addTrackToPlaylist = usePlaylistStore((state) => state.addTrackToPlaylist);

  const [hasHydrated, setHasHydrated] = React.useState(() => {
    const store = usePlaylistStore as unknown as {
      persist?: { hasHydrated?: () => boolean; onFinishHydration?: (cb: () => void) => () => void };
    };
    // Default to false to prevent initialization before hydration completes
    return store.persist?.hasHydrated?.() ?? false;
  });

  React.useEffect(() => {
    const store = usePlaylistStore as unknown as {
      persist?: { hasHydrated?: () => boolean; onFinishHydration?: (cb: () => void) => () => void };
    };

    if (store.persist?.hasHydrated?.()) {
      setHasHydrated(true);
      return;
    }

    const unsub = store.persist?.onFinishHydration?.(() => setHasHydrated(true));
    return () => {
      unsub?.();
    };
  }, []);

  const hasInitialized = React.useRef(false);

  React.useEffect(() => {
    if (!hasHydrated) return;
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const ensureIntentMetadata = (seedBuiltIns: boolean) => {
      const playlistState = usePlaylistStore.getState();
      const { playlists } = playlistState;
      const customState = useCustomIntentsStore.getState();

      const customIntentsByPlaylistId = new Map(
        customState.customIntents.map((intent) => [intent.playlistId, intent])
      );

      for (const playlist of playlists) {
        const existing = customState.intentMetadataByPlaylistId[playlist.id];
        const customIntent = customIntentsByPlaylistId.get(playlist.id);
        const builtInIntent = seedBuiltIns
          ? INTENTS.find((intent) => intent.name === playlist.name)
          : undefined;

        if (customIntent && (!existing || !existing.isCustom)) {
          customState.setIntentMetadata(playlist.id, {
            playlistId: playlist.id,
            name: customIntent.name,
            description: customIntent.description,
            keywords: [...customIntent.keywords],
            gradientClassName: customIntent.gradientClassName,
            minDuration: customIntent.minDuration,
            isCustom: true,
          });
        } else if (builtInIntent && !existing) {
          const keywords =
            customState.keywordOverrides[playlist.id] ?? builtInIntent.keywords;
          const description =
            customState.descriptionOverrides[playlist.id] ??
            builtInIntent.description;
          const minDuration =
            customState.minDurationOverrides[playlist.id] ?? 20;

          customState.setIntentMetadata(playlist.id, {
            playlistId: playlist.id,
            name: builtInIntent.name,
            description,
            keywords: [...keywords],
            gradientClassName: builtInIntent.gradientClassName,
            minDuration,
            isCustom: false,
          });
        }

        if (existing) {
          if (playlist.name !== existing.name) {
            customState.updateIntentMetadata(playlist.id, { name: playlist.name });
          }
        }
      }

      const nextOrder =
        customState.intentPlaylistOrder.length > 0
          ? [...customState.intentPlaylistOrder]
          : playlists
              .filter((playlist) => customState.intentMetadataByPlaylistId[playlist.id])
              .map((playlist) => playlist.id);

      for (const playlist of playlists) {
        if (
          customState.intentMetadataByPlaylistId[playlist.id] &&
          !nextOrder.includes(playlist.id)
        ) {
          nextOrder.push(playlist.id);
        }
      }

      if (
        nextOrder.length > 0 &&
        nextOrder.length !== customState.intentPlaylistOrder.length
      ) {
        customState.setIntentPlaylistOrder(nextOrder);
      }
    };

    const state = usePlaylistStore.getState();
    const playlists = state.playlists;
    const currentPlaylistId = state.currentPlaylistId;

    if (playlists.length === 0) {
      const customState = useCustomIntentsStore.getState();
      const hiddenIntents = new Set(customState.hiddenBuiltInIntents);
      const visibleIntents = INTENTS.filter((i) => !hiddenIntents.has(i.name));

      // Create intent playlists (empty for now, then seed via YouTube search).
      // Skip hidden intents.
      for (const intent of visibleIntents) {
        createPlaylist(intent.name, intent.description, []);
      }

      // After state update, resolve created IDs and seed each intent with 5 tracks.
      setTimeout(() => {
        const state = usePlaylistStore.getState();
        const newlyCreatedPlaylists = state.playlists.filter((p) =>
          visibleIntents.some((intent) => intent.name === p.name)
        );

        const firstIntentName = visibleIntents[0]?.name;
        const firstIntent = newlyCreatedPlaylists.find((p) => p.name === firstIntentName);
        if (firstIntent) {
          setCurrentPlaylist(firstIntent.id);
        } else if (newlyCreatedPlaylists[0]) {
          setCurrentPlaylist(newlyCreatedPlaylists[0].id);
        }

        ensureIntentMetadata(true);

        void (async () => {
          await Promise.allSettled(
            newlyCreatedPlaylists.map(async (playlist) => {
              const intent = visibleIntents.find((i) => i.name === playlist.name);
              if (!intent) return;

              // Only seed if empty (never overwrite user data).
              const latestPlaylist = usePlaylistStore
                .getState()
                .playlists.find((p) => p.id === playlist.id);
              if (!latestPlaylist || latestPlaylist.tracks.length > 0) return;

              const query = buildIntentQuery(intent);
              const { results } = await searchYouTubeUnofficial(
                query,
                "video",
                "any"
              );

              const videoResults = results.filter(
                (r): r is SearchVideoResult => "videoId" in r
              );
              const existingIds = new Set<string>();
              const toAdd = videoResults
                .filter((r) => {
                  if (!r?.videoId || !/^[a-zA-Z0-9_-]{11}$/.test(r.videoId))
                    return false;
                  if (existingIds.has(r.videoId)) return false;
                  existingIds.add(r.videoId);
                  return true;
                })
                .slice(0, 5);

              for (const result of toAdd) {
                const thumb =
                  result.thumbnail?.startsWith("//")
                    ? `https:${result.thumbnail}`
                    : result.thumbnail || `https://i.ytimg.com/vi/${result.videoId}/hqdefault.jpg`;

                addTrackToPlaylist(playlist.id, {
                  id: result.videoId,
                  title: result.title,
                  author: result.channelTitle,
                  // Use a safe, always-valid link (channel URL isn’t provided by this API)
                  authorUrl: result.channelId
                    ? `https://www.youtube.com/channel/${result.channelId}`
                    : `https://www.youtube.com/results?search_query=${encodeURIComponent(result.channelTitle)}`,
                  duration: result.lengthText ? parseDuration(result.lengthText) : 0,
                  thumbnailUrl: thumb,
                  publishedTimeText: result.publishedTime || undefined,
                });
              }

              // Search results are shallow — pull full details (exact duration,
              // author thumbnail, publish date) in the background.
              enrichTrackDetails(
                playlist.id,
                toAdd.map((result) => result.videoId)
              );
            })
          );
        })();
      }, 0);
    } else {
      const customState = useCustomIntentsStore.getState();
      const hasIntentMetadata =
        Object.keys(customState.intentMetadataByPlaylistId).length > 0;
      ensureIntentMetadata(!hasIntentMetadata);

      // Ensure we have a selected playlist.
      const nextState = usePlaylistStore.getState();
      if (!currentPlaylistId && nextState.playlists.length > 0) {
        setCurrentPlaylist(nextState.playlists[0]!.id);
      }

      // Tracks seeded before details were fetched still have duration 0 —
      // load their full info now.
      backfillMissingTrackDetails();
    }
  }, [hasHydrated, createPlaylist, updatePlaylist, setCurrentPlaylist, addTrackToPlaylist]);
}


