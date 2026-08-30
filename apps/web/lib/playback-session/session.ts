import { assertPlayerInvariants } from "@/lib/player-core/invariants";
import { createPlayerState, reducePlayerState } from "@/lib/player-core/reduce";
import type {
  PlaybackSource,
  PlayerAction,
  PlayerCommand,
  PlayerEvent,
  PlayerState,
} from "@/lib/player-core/types";
import type {
  PlaybackAdapter,
  PlaybackConnection,
  PlaybackObservation,
  PlaybackQueue,
  SessionTrack,
} from "./types";

type Source = { adapter: PlaybackAdapter; ready: boolean };
type Selection = {
  id: string;
  source: PlaybackSource;
  controller: AbortController;
  lastPosition: number;
  ended: boolean;
  observed: boolean;
};

const scheduleProgress = (tick: () => void) => {
  const timer = setInterval(tick, 250);
  return () => clearInterval(timer);
};

/** Owns playback policy; React and SDK lifetimes connect at its seams. */
export function createPlaybackSession({
  queue,
  schedule = scheduleProgress,
}: {
  queue: PlaybackQueue;
  schedule?: (tick: () => void) => () => void;
}) {
  let state = createPlayerState();
  let selected: Selection | null = null;
  let userInteracted = false;
  let stopProgress: (() => void) | null = null;
  let reading: Selection | null = null;
  const sources = new Map<PlaybackSource, Source>();
  const listeners = new Set<(state: PlayerState) => void>();
  const events: PlayerEvent[] = [];
  let dispatching = false;

  const isCurrent = (source: Source, selection: Selection | null) =>
    selection !== null &&
    selected === selection &&
    !selection.controller.signal.aborted &&
    sources.get(selection.source) === source &&
    source.ready;

  function invoke(source: Source, action: () => void | Promise<void>, reportFailure = true) {
    const selection = selected;
    const fail = (error: unknown) => {
      if (!reportFailure || !isCurrent(source, selection)) return;
      dispatch({
        type: "PlayerLoadFailed",
        reason: error instanceof Error ? error.message : "Playback failed",
      });
    };
    try {
      const result = action();
      if (result) void result.catch(fail);
    } catch (error) {
      fail(error);
    }
  }

  function poll() {
    const selection = selected;
    const source = selection && sources.get(selection.source);
    if (reading === selection || !source || !isCurrent(source, selection) || !state.isPlaying)
      return;
    reading = selection;
    // Completions are scoped to both source lifetime and selection.
    void Promise.resolve()
      .then(() => source.adapter.read())
      .then((observation) => {
        if (observation && isCurrent(source, selection)) observe(source, observation);
      })
      .catch(() => {
        // A missed sample is not a failed load; the next tick retries.
      })
      .finally(() => {
        if (reading === selection) reading = null;
      });
  }

  function updateProgress() {
    if (state.isPlaying && state.playerReady && !stopProgress) stopProgress = schedule(poll);
    if ((!state.isPlaying || !state.playerReady) && stopProgress) {
      stopProgress();
      stopProgress = null;
    }
  }

  function restart() {
    dispatch({ type: "UserSeek", seconds: 0 });
    dispatch({ type: "UserPlay" });
  }

  function run(command: PlayerCommand) {
    const source = sources.get(state.activeSource);
    switch (command.type) {
      case "Load": {
        if (
          !source?.ready ||
          !selected ||
          selected.source !== command.source ||
          selected.id !== command.videoId
        )
          return;
        const selection = selected;
        invoke(source, () => source.adapter.setVolume(state.volume), false);
        invoke(source, () =>
          source.adapter.load(selection.id, command.autoplay, selection.controller.signal),
        );
        return;
      }
      case "Play":
        if (source?.ready) invoke(source, () => source.adapter.play());
        return;
      case "Pause":
        if (source?.ready) invoke(source, () => source.adapter.pause());
        return;
      case "Seek":
        if (selected) selected.lastPosition = command.seconds;
        if (source?.ready) invoke(source, () => source.adapter.seek(command.seconds));
        return;
      case "SetVolume":
        if (source?.ready) invoke(source, () => source.adapter.setVolume(command.volume), false);
        return;
      case "RequestNextTrack": {
        if (queue.repeatMode() === "one") {
          restart();
          return;
        }
        const next = queue.next();
        if (next) {
          if (
            selected?.id === next.id &&
            selected.source === (next.source ?? "youtube") &&
            selected.ended
          ) {
            // A one-track repeating playlist keeps the selected identity.
            restart();
          } else selectTrack(next);
        }
        return;
      }
      case "RequestPreviousTrack": {
        const previous = queue.previous();
        if (previous) selectTrack(previous);
        return;
      }
    }
  }

  function dispatch(event: PlayerEvent) {
    if (
      (event.type === "UserPlay" || event.type === "UserTogglePlay") &&
      state.mode.tag === "error" &&
      selected
    ) {
      selected.controller.abort();
      selected = {
        ...selected,
        controller: new AbortController(),
        lastPosition: 0,
        ended: false,
        observed: false,
      };
      event = {
        type: "TrackSelected",
        videoId: selected.id,
        source: selected.source,
        autoplay: true,
      };
    }
    if (event.type === "PlayerLoadFailed") selected?.controller.abort();
    events.push(event);
    if (dispatching) return;
    dispatching = true;
    try {
      while (events.length) {
        const next = events.shift()!;
        const result = reducePlayerState(state, next);
        assertPlayerInvariants(result.state);
        state = result.state;
        updateProgress();
        for (const listener of listeners) listener(state);
        for (const command of result.commands) run(command);
      }
    } finally {
      dispatching = false;
    }
  }

  function selectTrack(track: SessionTrack | null) {
    const source = track?.source ?? "youtube";
    if (track && selected?.id === track.id && selected.source === source) return;
    if (!track && !selected) return;
    const autoplay = userInteracted || state.desiredPlayback === "playing";
    selected?.controller.abort();
    selected = track
      ? {
          id: track.id,
          source,
          controller: new AbortController(),
          lastPosition: 0,
          ended: false,
          observed: false,
        }
      : null;
    for (const [name, entry] of sources) {
      if (!track || name !== source) invoke(entry, () => entry.adapter.pause(), false);
    }
    if (!track) {
      dispatch({ type: "SelectionCleared" });
      return;
    }
    dispatch({ type: "SourceAvailabilityChanged", ready: sources.get(source)?.ready ?? false });
    dispatch({ type: "TrackSelected", videoId: track.id, source, autoplay });
  }

  function observe(source: Source, observation: PlaybackObservation): boolean {
    const selection = selected;
    if (!isCurrent(source, selection)) {
      // A remote start can finish after switching sources; silence it again.
      if (observation.state === "playing" && [...sources.values()].includes(source)) {
        invoke(source, () => source.adapter.pause(), false);
      }
      return false;
    }
    if (!selection || state.mode.tag === "error") return false;
    if (observation.trackId !== selection.id) {
      // Ignore outgoing snapshots while loading, but recover if a late remote
      // start replaces a track we have already observed on this connection.
      if (selection.observed && observation.state === "playing") {
        selection.controller.abort();
        selected = {
          ...selection,
          controller: new AbortController(),
          lastPosition: 0,
          ended: false,
          observed: false,
        };
        invoke(source, () => source.adapter.pause(), false);
        dispatch({
          type: "TrackSelected",
          videoId: selected.id,
          source: selected.source,
          autoplay: state.desiredPlayback === "playing",
        });
      }
      return false;
    }
    selection.observed = true;
    const { currentTime, duration } = observation;
    // Terminal snapshots must not reconcile desired-playing by replaying the
    // outgoing track. Only an actual restart re-arms end detection.
    if (selection.ended) {
      if (observation.state !== "playing") return false;
      selection.ended = false;
      selection.lastPosition = 0;
    }
    const reachedEnd =
      observation.state === "ended" ||
      (source.adapter.endsByRewinding &&
        state.desiredPlayback === "playing" &&
        observation.state === "paused" &&
        currentTime === 0 &&
        duration !== undefined &&
        duration > 0 &&
        selection.lastPosition > 0 &&
        selection.lastPosition > duration - 5);
    if (reachedEnd) {
      selection.ended = true;
      selection.lastPosition = 0;
      dispatch({ type: "PlayerStateChanged", state: "ended", duration });
      return true;
    }
    if (currentTime !== undefined) selection.lastPosition = currentTime;
    if (observation.state)
      dispatch({ type: "PlayerStateChanged", state: observation.state, duration });
    if (currentTime !== undefined && selected === selection) {
      dispatch({ type: "TimeTick", currentTime });
      const slice = state.sliceRepeat;
      if (
        slice.isActive &&
        slice.isSliceSet &&
        slice.startTime !== null &&
        slice.endTime !== null &&
        currentTime >= slice.endTime - 0.1
      ) {
        dispatch({ type: "SliceBoundaryReached" });
      }
    }
    return true;
  }

  function connect(sourceName: PlaybackSource, adapter: PlaybackAdapter): PlaybackConnection {
    const old = sources.get(sourceName);
    if (old) invoke(old, () => old.adapter.pause(), false);
    const source: Source = { adapter, ready: false };
    sources.set(sourceName, source);
    const attached = () => sources.get(sourceName) === source;
    if (selected?.source === sourceName) {
      selected.controller.abort();
      dispatch({ type: "SourceAvailabilityChanged", ready: false });
    }
    const unavailable = () => {
      if (!attached()) return;
      source.ready = false;
      if (selected?.source === sourceName) {
        selected.controller.abort();
        dispatch({ type: "SourceAvailabilityChanged", ready: false });
      }
    };
    return {
      ready: () => {
        if (!attached() || source.ready) return;
        source.ready = true;
        if (selected?.source !== sourceName) return;
        // Reconnect is a fresh load, not resume on an empty SDK device.
        selected.controller.abort();
        selected = {
          ...selected,
          controller: new AbortController(),
          lastPosition: 0,
          ended: false,
          observed: false,
        };
        dispatch({ type: "SourceAvailabilityChanged", ready: true });
        dispatch({
          type: "TrackSelected",
          videoId: selected.id,
          source: sourceName,
          autoplay: state.desiredPlayback === "playing",
        });
      },
      unavailable,
      observe: (observation) => attached() && observe(source, observation),
      fail: (reason, trackId) => {
        if (
          attached() &&
          selected?.source === sourceName &&
          (!trackId || selected.id === trackId)
        ) {
          dispatch({ type: "PlayerLoadFailed", reason });
        }
      },
      disconnect: () => {
        if (!attached()) return;
        unavailable();
        sources.delete(sourceName);
        invoke(source, () => adapter.pause(), false);
      },
    };
  }

  return {
    getState: () => state,
    subscribe: (listener: (state: PlayerState) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispatch: (event: PlayerAction) => dispatch(event),
    selectTrack,
    allowAutoplay: () => {
      userInteracted = true;
    },
    connect,
  };
}
