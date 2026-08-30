import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createPlaybackSession } from "./session";
import { createSpotifyAdapter, spotifyObservation } from "@/lib/player-shell/spotify-adapter";

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function harness(
  options: {
    token?: () => Promise<string | null>;
    start?: (track: string, signal: AbortSignal) => Promise<void>;
    read?: () => Promise<SpotifySDK.WebPlaybackState | null>;
  } = {},
) {
  const calls: string[] = [];
  let snapshot: SpotifySDK.WebPlaybackState | null = null;
  const player = {
    resume: async () => {
      calls.push("resume");
    },
    pause: async () => {
      calls.push("pause");
    },
    seek: async (position: number) => {
      calls.push(`seek:${position}`);
    },
    setVolume: async (volume: number) => {
      calls.push(`volume:${volume}`);
    },
    getCurrentState: options.read ?? (async () => snapshot),
  };
  const session = createPlaybackSession({
    queue: { next: () => null, previous: () => null, repeatMode: () => "off" },
    schedule: () => () => {},
  });
  const connection = session.connect(
    "spotify",
    createSpotifyAdapter({
      getPlayer: () => player,
      getDeviceId: () => "device",
      getAccessToken: options.token ?? (async () => "token"),
      startPlayback: async (_token, _device, track, signal) => {
        calls.push(`start:${track}`);
        await options.start?.(track, signal);
      },
    }),
  );
  connection.ready();
  return {
    session,
    connection,
    calls,
    snapshot: (value: SpotifySDK.WebPlaybackState) => {
      snapshot = value;
    },
  };
}

const sdkState = (id: string): SpotifySDK.WebPlaybackState => ({
  paused: false,
  loading: false,
  position: 2500,
  duration: 100000,
  track_window: {
    current_track: {
      id,
      uri: `spotify:track:${id}`,
      name: id,
      duration_ms: 100000,
      artists: [],
      album: { name: "", uri: "", images: [] },
    },
    previous_tracks: [],
    next_tracks: [],
  },
});

describe("Playback Session with the Spotify adapter", () => {
  it("restores the selected track when a stale remote start overtakes settled playback", async () => {
    const oldStart = deferred<void>();
    let remote = "";
    const h = harness({
      start: async (id) => {
        if (id === "a") await oldStart.promise;
        remote = id;
      },
    });
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a", source: "spotify" });
    await flush();
    h.session.selectTrack({ id: "b", source: "spotify" });
    // Outgoing observations during the transition must not restart B's load.
    h.connection.observe(spotifyObservation(sdkState("a")));
    await flush();
    h.connection.observe(spotifyObservation(sdkState("b")));
    oldStart.resolve();
    await flush();
    assert.equal(remote, "a");
    assert.equal(h.connection.observe(spotifyObservation(sdkState("a"))), false);
    // Repeated stale observations should not duplicate the recovery load.
    h.connection.observe(spotifyObservation(sdkState("a")));
    await flush();
    assert.equal(remote, "b");
    assert.deepEqual(
      h.calls.filter((call) => call.startsWith("start:")),
      ["start:a", "start:b", "start:b"],
    );
    assert.equal(h.session.getState().desiredPlayback, "playing");
  });

  it("does not let an old source-silencing read pause a newly selected Spotify track", async () => {
    const read = deferred<SpotifySDK.WebPlaybackState | null>();
    const h = harness({ read: () => read.promise });
    h.session.allowAutoplay();
    // Silencing the unused Spotify source needs a context check.
    h.session.selectTrack({ id: "video", source: "youtube" });
    h.session.selectTrack({ id: "song", source: "spotify" });
    await flush();
    h.connection.observe(spotifyObservation(sdkState("song")));
    read.resolve(sdkState("song"));
    await flush();
    assert.equal(h.calls.includes("pause"), false);
    assert.equal(h.session.getState().desiredPlayback, "playing");
  });

  it("keeps paused intent when silencing a stale track on the selected source", async () => {
    const h = harness();
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "b", source: "spotify" });
    await flush();
    h.connection.observe(spotifyObservation(sdkState("b")));
    h.session.dispatch({ type: "UserPause" });
    h.connection.observe(spotifyObservation(sdkState("a")));
    await flush();
    assert.equal(h.calls.at(-1), "pause");
    assert.equal(h.calls.filter((call) => call === "start:b").length, 1);
    assert.equal(h.session.getState().desiredPlayback, "paused");
    h.session.dispatch({ type: "UserPlay" });
    await flush();
    assert.equal(h.calls.at(-1), "start:b");
  });

  it("defers a cued load and starts it only once for repeated play intents", async () => {
    const token = deferred<string | null>();
    const h = harness({ token: () => token.promise });
    h.session.selectTrack({ id: "a", source: "spotify" });
    assert.equal(
      h.calls.some((call) => call.startsWith("start:")),
      false,
    );
    h.session.dispatch({ type: "UserPlay" });
    h.session.dispatch({ type: "UserPlay" });
    token.resolve("token");
    await flush();
    assert.deepEqual(
      h.calls.filter((call) => call.startsWith("start:")),
      ["start:a"],
    );
    h.connection.observe(spotifyObservation(sdkState("a")));
    h.session.dispatch({ type: "UserPause" });
    h.session.dispatch({ type: "UserPlay" });
    assert.deepEqual(h.calls.slice(-2), ["pause", "resume"]);
  });

  it("does not issue an obsolete remote start after token acquisition", async () => {
    const token = deferred<string | null>();
    const h = harness({ token: () => token.promise });
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a", source: "spotify" });
    h.session.selectTrack({ id: "b", source: "spotify" });
    token.resolve("token");
    await flush();
    assert.deepEqual(
      h.calls.filter((call) => call.startsWith("start:")),
      ["start:b"],
    );
  });

  it("cancels pending Spotify work on a source switch", async () => {
    const request = deferred<void>();
    let signal: AbortSignal | undefined;
    const h = harness({
      start: async (_id, requestSignal) => {
        signal = requestSignal;
        await request.promise;
      },
    });
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a", source: "spotify" });
    await flush();
    h.session.selectTrack({ id: "video", source: "youtube" });
    assert.equal(signal?.aborted, true);
    request.reject(new Error("aborted request"));
    await flush();
    assert.notEqual(h.session.getState().mode.tag, "error");
    assert.equal(h.session.getState().activeSource, "youtube");
  });

  it("honors pause while a remote start is in flight", async () => {
    const request = deferred<void>();
    const h = harness({ start: () => request.promise });
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a", source: "spotify" });
    await flush();
    h.session.dispatch({ type: "UserPause" });
    request.resolve();
    await flush();
    assert.equal(h.calls.at(-1), "pause");
    assert.equal(h.session.getState().desiredPlayback, "paused");
  });

  it("silences an inactive Spotify source even when its remote start completed late", async () => {
    const token = deferred<string | null>();
    const h = harness({ token: () => token.promise });
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a", source: "spotify" });
    h.session.selectTrack({ id: "video" });
    token.resolve("token");
    await flush();
    h.snapshot(sdkState("a"));
    h.connection.observe(spotifyObservation(sdkState("a")));
    await flush();
    assert.equal(h.calls.at(-1), "pause");
  });

  it("normalizes SDK units and retains the existing volume curve", async () => {
    const h = harness();
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a", source: "spotify" });
    await flush();
    h.connection.observe(spotifyObservation(sdkState("a")));
    assert.equal(h.session.getState().currentTime, 2.5);
    assert.equal(h.session.getState().duration, 100);
    h.session.dispatch({ type: "UserSeek", seconds: 3.25 });
    assert.equal(h.calls.at(-1), "seek:3250");
    h.session.dispatch({ type: "UserSetVolume", volume: 50 });
    assert.equal(h.calls.at(-1), `volume:${(Math.exp(0.5) - 1) / (Math.E - 1)}`);
  });

  it("reports an active start failure and permits an explicit retry", async () => {
    let fail = true;
    const h = harness({
      start: async () => {
        if (fail) throw new Error("network failed");
      },
    });
    h.session.allowAutoplay();
    h.session.selectTrack({ id: "a", source: "spotify" });
    await flush();
    assert.equal(h.session.getState().mode.tag, "error");
    assert.equal(h.session.getState().desiredPlayback, "paused");
    assert.equal(h.connection.observe(spotifyObservation(sdkState("a"))), false);
    fail = false;
    h.session.dispatch({ type: "UserPlay" });
    await flush();
    h.connection.observe(spotifyObservation(sdkState("a")));
    assert.equal(h.session.getState().mode.tag, "ready");
    assert.equal(h.session.getState().isPlaying, true);
    assert.equal(h.calls.filter((call) => call === "start:a").length, 2);
  });
});
