"use client";

import * as React from "react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { buildIntentQuery, INTENTS } from "@/lib/intents";
import { searchYouTubeVideos } from "@/app/actions/youtube-search";

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

    const intentNames = INTENTS.map((i) => i.name);
    const intentNameSet = new Set(intentNames);

    const repairIntentPlaylists = () => {
      const state = usePlaylistStore.getState();
      const playlists = state.playlists;

      const byIntentName = new Map<string, typeof playlists>();
      for (const p of playlists) {
        if (!intentNameSet.has(p.name)) continue;
        const list = byIntentName.get(p.name) ?? [];
        list.push(p);
        byIntentName.set(p.name, list);
      }

      const missingNames = intentNames.filter(
        (name) => (byIntentName.get(name)?.length ?? 0) === 0
      );

      const renamePool = intentNames.flatMap((name) => {
        const list = [...(byIntentName.get(name) ?? [])].sort(
          (a, b) => a.createdAt - b.createdAt
        );
        return list.slice(1);
      });

      // If a prior bug created many playlists with the same intent name (e.g. all "Deep Focus"),
      // reclaim duplicates to fill in missing intent names.
      for (let i = 0; i < Math.min(missingNames.length, renamePool.length); i++) {
        const targetName = missingNames[i]!;
        const targetIntent = INTENTS.find((intent) => intent.name === targetName);
        if (!targetIntent) continue;

        updatePlaylist(renamePool[i]!.id, {
          name: targetIntent.name,
          description: targetIntent.description,
        });
      }

      // Create any still-missing intent playlists (do not delete user data).
      const latest = usePlaylistStore.getState().playlists;
      const latestNames = new Set(latest.map((p) => p.name));
      for (const intent of INTENTS) {
        if (!latestNames.has(intent.name)) {
          createPlaylist(intent.name, intent.description, []);
        }
      }
    };

    const state = usePlaylistStore.getState();
    const playlists = state.playlists;
    const currentPlaylistId = state.currentPlaylistId;

    if (playlists.length === 0) {
      // Create intent playlists (empty for now, then seed via YouTube search).
      for (const intent of INTENTS) {
        createPlaylist(intent.name, intent.description, []);
      }

      // After state update, resolve created IDs and seed each intent with 5 tracks.
      setTimeout(() => {
        const state = usePlaylistStore.getState();
        const newlyCreatedPlaylists = state.playlists.filter((p) =>
          INTENTS.some((intent) => intent.name === p.name)
        );

        const firstIntentName = INTENTS[0]?.name;
        const firstIntent = newlyCreatedPlaylists.find((p) => p.name === firstIntentName);
        if (firstIntent) {
          setCurrentPlaylist(firstIntent.id);
        } else if (newlyCreatedPlaylists[0]) {
          setCurrentPlaylist(newlyCreatedPlaylists[0].id);
        }

        void (async () => {
          await Promise.allSettled(
            newlyCreatedPlaylists.map(async (playlist) => {
              const intent = INTENTS.find((i) => i.name === playlist.name);
              if (!intent) return;

              // Only seed if empty (never overwrite user data).
              const latestPlaylist = usePlaylistStore
                .getState()
                .playlists.find((p) => p.id === playlist.id);
              if (!latestPlaylist || latestPlaylist.tracks.length > 0) return;

              const query = buildIntentQuery(intent);
              const { results } = await searchYouTubeVideos(query);

              const existingIds = new Set<string>();
              const toAdd = results
                .filter((r) => {
                  if (!r?.id) return false;
                  if (existingIds.has(r.id)) return false;
                  existingIds.add(r.id);
                  return true;
                })
                .slice(0, 5);

              for (const result of toAdd) {
                const thumb =
                  result.thumbnail?.thumbnails?.[
                    result.thumbnail.thumbnails.length - 1
                  ]?.url ?? `https://i.ytimg.com/vi/${result.id}/hqdefault.jpg`;

                addTrackToPlaylist(playlist.id, {
                  id: result.id,
                  title: result.title,
                  author: result.channelTitle,
                  // Use a safe, always-valid link (channel URL isn’t provided by this API)
                  authorUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
                    result.channelTitle
                  )}`,
                  duration: 0,
                  thumbnailUrl: thumb,
                });
              }
            })
          );
        })();
      }, 0);
    } else {
      repairIntentPlaylists();

      // Ensure we have a selected playlist.
      const nextState = usePlaylistStore.getState();
      if (!currentPlaylistId && nextState.playlists.length > 0) {
        setCurrentPlaylist(nextState.playlists[0]!.id);
      }
    }
  }, [hasHydrated, createPlaylist, updatePlaylist, setCurrentPlaylist, addTrackToPlaylist]);
}




